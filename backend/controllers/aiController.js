
const Groq = require('groq-sdk');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function gatherInventoryContext(userId) {
  try {
    
    const allMedicines = await Medicine.find({ addedBy: userId }).sort({ name: 1 }).lean();
    
    const medicineStocks = await Batch.aggregate([
      { $match: { status: 'active', addedBy: userId } },
      {
        $addFields: {
          daysToExpiry: {
            $ceil: {
              $divide: [
                { $subtract: ['$expiryDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$medicineId',
          totalStock: { $sum: '$quantity' },
          batchCount: { $sum: 1 },
          minDaysToExpiry: { $min: '$daysToExpiry' },
          averagePrice: { $avg: '$sellingPrice' }
        }
      }
    ]);

    const stockMap = {};
    medicineStocks.forEach(stock => {
      stockMap[stock._id.toString()] = stock;
    });

    const medicinesWithStock = allMedicines.map(med => {
      const stock = stockMap[med._id.toString()] || { totalStock: 0, batchCount: 0, minDaysToExpiry: -1, averagePrice: med.price };
      return {
        name: med.name,
        price: med.price || stock.averagePrice || 0,
        quantity: stock.totalStock || 0,
        category: med.category,
        daysToExpiry: stock.minDaysToExpiry || -1
      };
    });

    const lowStockMedicines = medicinesWithStock.filter(m => m.quantity <= 20);

    const expiringBatchesData = await Batch.aggregate([
      {
        $addFields: {
          daysToExpiry: {
            $ceil: {
              $divide: [
                { $subtract: ['$expiryDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $match: {
          status: 'active',
          addedBy: userId,
          daysToExpiry: { $lte: 30, $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicineId',
          foreignField: '_id',
          as: 'medicineDetails'
        }
      },
      { $limit: 10 }
    ]);

    const recentSales = await Sale.aggregate([
      { $match: { status: 'completed', soldBy: userId } },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.medicineId',
          medicineName: { $first: '$medicines.medicineName' },
          totalQuantity: { $sum: '$medicines.quantity' },
          totalRevenue: { $sum: { $multiply: ['$medicines.quantity', '$medicines.price'] } },
          saleCount: { $sum: 1 }
        }
      },
      { $sort: { saleCount: -1 } },
      { $limit: 5 }
    ]);

    const stockSummary = await Batch.aggregate([
      { $match: { status: 'active', addedBy: userId } },
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalUnits: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
        }
      }
    ]);

    return {
      allMedicines: medicinesWithStock,
      lowStockMedicines: lowStockMedicines.slice(0, 5),
      expiringBatches: expiringBatchesData.slice(0, 5),
      topSellingMedicines: recentSales,
      inventorySummary: stockSummary[0] || { totalBatches: 0, totalUnits: 0, totalValue: 0 }
    };
  } catch (error) {
    logger.error(`Error gathering inventory context: ${error.message}`);
    return null;
  }
}

function buildSystemPrompt(context) {
  
  const medicinesList = context.allMedicines.map((m, idx) => {
    const stock = m.quantity || 0;
    const status = stock === 0 ? '(OUT OF STOCK)' : `(${stock} units)`;
    return `${idx + 1}. ${m.name} - ₹${(m.price || 0).toFixed(0)} ${status}`;
  }).join('\n');

  const lowStockList = context.lowStockMedicines.length > 0 
    ? context.lowStockMedicines.map((m, i) => `${m.name} (${m.quantity} units)`).join(', ')
    : 'None';

  return `You are an intelligent Pharmacy Inventory Management AI Assistant. You have real-time inventory data.

**RESPONSE FORMAT (CRITICAL):**
- When user asks for "list of medicines" or "medicines in inventory" - PROVIDE COMPLETE LIST with all medicines
- For other queries: Keep responses CONCISE and SCANNABLE
- Use bullet points (•) ONLY for lists of 3+ items
- Focus on: KEY INSIGHTS, RECOMMENDATIONS, ACTIONABLE ITEMS
- Avoid long paragraphs - use short sentences
- ALL prices in Indian Rupees (₹), NEVER dollars ($)
- Keep non-list responses UNDER 500 words

**COMPLETE MEDICINE INVENTORY (Total: ${context.allMedicines.length} medicines):**
${medicinesList}

**Pharmacy Status Overview:**
• Total Medicines: ${context.allMedicines.length}
• Total Stock: ${context.inventorySummary.totalUnits} units
• Inventory Value: ₹${(context.inventorySummary.totalValue || 0).toFixed(0)}
• Low Stock Items: ${context.lowStockMedicines.length}
• Out of Stock: ${context.allMedicines.filter(m => m.quantity === 0).length}
• Expiring Soon: ${context.expiringBatches.length} batches

**Quick Reference:**
- Low Stock: ${lowStockList}
- Top Sellers: ${context.topSellingMedicines.length > 0 ? context.topSellingMedicines.slice(0, 3).map(m => m.medicineName).join(', ') : 'No data'}

**Your Role:**
- Provide direct answers to user queries
- When asked for "list" or "inventory" - show COMPLETE medicine list with quantities
- Give specific numbers and percentages
- Recommend actions based on data

Special Instructions:
- If user asks "what medicines" or "list medicines" or "inventory" - ALWAYS provide the COMPLETE MEDICINE INVENTORY list above
- For other questions: Use summary format with key insights
- Be specific with quantities and prices`;
}

exports.chatWithAI = asyncHandler(async (req, res) => {
  const { message, type = 'general' } = req.body;

  if (!message || !message.trim()) {
    throw new AppError('Message is required', 400);
  }

  if (message.length > 1000) {
    throw new AppError('Message too long (max 1000 characters)', 400);
  }

  if (!process.env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 500);
  }

  try {
    
    const context = await gatherInventoryContext(req.user.id);
    if (!context) {
      throw new AppError('Failed to gather inventory context', 500);
    }

    const systemPrompt = buildSystemPrompt(context);

    let enhancedMessage = message;
    switch (type.toLowerCase()) {
      case 'stock':
        enhancedMessage = `[STOCK ANALYSIS REQUEST] ${message}\nPlease analyze current stock levels and provide insights.`;
        break;
      case 'reorder':
        enhancedMessage = `[REORDER REQUEST] ${message}\nBased on sales trends and current stock, suggest reorder quantities.`;
        break;
      case 'expiry':
        enhancedMessage = `[EXPIRY MANAGEMENT REQUEST] ${message}\nIdentify medicines expiring soon and recommend action.`;
        break;
      default:
        enhancedMessage = message;
    }

    const fullPrompt = `${systemPrompt}\n\nUser Query: ${enhancedMessage}`;

    const message_response = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 2048,
      temperature: 0.7
    });
    
    const aiResponse = message_response.choices[0]?.message?.content || '';

    const hasWarning = aiResponse.toLowerCase().includes('urgent') || 
                       aiResponse.toLowerCase().includes('critical') ||
                       aiResponse.toLowerCase().includes('immediately');

    logger.info(`AI Chat: ${type} query answered using Groq`);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'AI analysis generated successfully',
      data: {
        query: {
          type,
          original: message
        },
        response: aiResponse,
        metadata: {
          model: 'llama-3.1-8b-instant',
          hasWarning,
          timestamp: new Date().toISOString(),
          note: 'Powered by Groq - Free, no billing required, ultra-fast responses'
        },
        context: {
          lowStockItems: context.lowStockMedicines.length,
          expiringBatches: context.expiringBatches.length,
          topSellingMedicines: context.topSellingMedicines.length
        }
      }
    });
  } catch (error) {
    if (error.message && error.message.includes('API_KEY')) {
      logger.error('Groq API key invalid or not configured');
      throw new AppError('Groq authentication failed - check API key', 500);
    }

    if (error && error.status === 429) {
      logger.error('Groq rate limit exceeded');
      throw new AppError('AI service temporarily unavailable - too many requests', 429);
    }

    if (error instanceof AppError) {
      throw error;
    }

    logger.error(`AI Chat error: ${error.message}`);
    throw new AppError('Failed to process AI request', 500);
  }
});

exports.analyzeStock = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 500);
  }

  try {
    const context = await gatherInventoryContext(req.user.id);
    if (!context) {
      throw new AppError('Failed to gather inventory context', 500);
    }

    const systemPrompt = buildSystemPrompt(context);

    const fullPrompt = `${systemPrompt}\n\nUser Request: Provide a comprehensive stock analysis report. Include: current stock status, medicines running low, medicines expiring soon, and recommendations to optimize inventory.`;

    const result = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 2048,
      temperature: 0.7
    });
    
    const analysis = result.choices[0]?.message?.content || '';

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Stock analysis generated successfully',
      data: {
        analysis,
        generatedAt: new Date().toISOString(),
        context: context.inventorySummary
      }
    });
  } catch (error) {
    logger.error(`Stock analysis error: ${error.message}`);
    throw new AppError('Failed to generate stock analysis', 500);
  }
});

exports.suggestReorder = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 500);
  }

  try {
    const context = await gatherInventoryContext(req.user.id);
    if (!context) {
      throw new AppError('Failed to gather inventory context', 500);
    }

    const systemPrompt = buildSystemPrompt(context);

    const fullPrompt = `${systemPrompt}\n\nUser Request: Based on the current inventory data and sales trends, generate a detailed reorder purchase list. For each medicine that needs reordering, suggest: 1. Quantity to order, 2. Priority level (URGENT/HIGH/NORMAL), 3. Justification based on sales data and current stock, 4. Expected usage timeline. Format the response as actionable purchase recommendations.`;

    const result = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 2048,
      temperature: 0.7
    });
    
    const suggestions = result.choices[0]?.message?.content || '';

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Reorder suggestions generated successfully',
      data: {
        suggestions,
        generatedAt: new Date().toISOString(),
        lowStockCount: context.lowStockMedicines.length,
        topSellers: context.topSellingMedicines
      }
    });
  } catch (error) {
    logger.error(`Reorder suggestion error: ${error.message}`);
    throw new AppError('Failed to generate reorder suggestions', 500);
  }
});

exports.expiryAlert = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 500);
  }

  try {
    const context = await gatherInventoryContext(req.user.id);
    if (!context) {
      throw new AppError('Failed to gather inventory context', 500);
    }

    const systemPrompt = buildSystemPrompt(context);

    const fullPrompt = `${systemPrompt}\n\nUser Request: Generate an urgent action plan for medicines expiring soon. Include: 1. List of medicines by urgency (CRITICAL, HIGH, MEDIUM), 2. Specific actions for each (clearance discount, donation, professional disposal), 3. Timeline for actions, 4. Revenue recovery strategies, 5. Compliance and safety considerations. Be specific and actionable.`;

    const result = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 2048,
      temperature: 0.7
    });
    
    const actionPlan = result.choices[0]?.message?.content || '';

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Expiry action plan generated successfully',
      data: {
        actionPlan,
        expiringBatches: context.expiringBatches.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Expiry alert error: ${error.message}`);
    throw new AppError('Failed to generate expiry alert', 500);
  }
});

exports.getAIHealth = asyncHandler(async (req, res) => {
  const apiKeyConfigured = !!process.env.GROQ_API_KEY;

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'AI service status',
    data: {
      aiServiceActive: apiKeyConfigured,
      apiConfigured: apiKeyConfigured,
      model: 'llama-3.1-8b-instant',
      provider: 'Groq',
      features: [
        'Stock Analysis',
        'Reorder Suggestions',
        'Expiry Management',
        'General Query Answering'
      ],
      status: apiKeyConfigured ? 'Ready' : 'API Key Not Configured',
      pricing: {
        status: 'FREE',
        rateLimit: '30 requests/minute',
        dailyLimit: 'Very generous',
        message: 'Groq API is completely free with no billing required - Ultra-fast responses'
      }
    }
  });
});
