
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// Gather real inventory data ONLY for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
async function gatherInventoryContext(userId) {
  try {
    // req.user.id is already a Mongoose ObjectId from authMiddleware,
    // but we explicitly cast to be safe with aggregation pipeline $match.
    const userObjectId = new mongoose.Types.ObjectId(userId.toString());

    // 1. All medicines belonging to this user
    const allMedicines = await Medicine.find({ addedBy: userObjectId })
      .sort({ name: 1 })
      .lean();

    // 2. Stock per medicine from active batches — user filter FIRST
    const medicineStocks = await Batch.aggregate([
      { $match: { status: 'active', addedBy: userObjectId } },
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
          averageSellingPrice: { $avg: '$sellingPrice' }
        }
      }
    ]);

    const stockMap = {};
    medicineStocks.forEach(s => {
      stockMap[s._id.toString()] = s;
    });

    const medicinesWithStock = allMedicines.map(med => {
      const s = stockMap[med._id.toString()] || {
        totalStock: 0,
        batchCount: 0,
        minDaysToExpiry: null,
        averageSellingPrice: med.price || 0
      };
      return {
        name: med.name,
        price: med.price || s.averageSellingPrice || 0,
        quantity: s.totalStock || 0,
        category: med.category,
        daysToExpiry: s.minDaysToExpiry
      };
    });

    // Low stock = has stock but <= 20 units
    const lowStockMedicines = medicinesWithStock
      .filter(m => m.quantity > 0 && m.quantity <= 20)
      .slice(0, 10);

    // Out of stock = registered but 0 quantity
    const outOfStockMedicines = medicinesWithStock
      .filter(m => m.quantity === 0)
      .slice(0, 10);

    // 3. Expiring within 30 days — user filter FIRST, then compute days
    const expiringBatchesData = await Batch.aggregate([
      { $match: { status: 'active', addedBy: userObjectId } },
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
      { $match: { daysToExpiry: { $lte: 30, $gt: 0 } } },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicineId',
          foreignField: '_id',
          as: 'medicineDetails'
        }
      },
      { $sort: { daysToExpiry: 1 } },
      { $limit: 10 }
    ]);

    // 4. Recent sales — user filter first
    const recentSales = await Sale.aggregate([
      { $match: { status: 'completed', soldBy: userObjectId } },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.medicineId',
          medicineName: { $first: '$medicines.medicineName' },
          totalQuantity: { $sum: '$medicines.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$medicines.quantity', '$medicines.price'] }
          },
          saleCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    // 5. Overall stock summary
    const stockSummaryArr = await Batch.aggregate([
      { $match: { status: 'active', addedBy: userObjectId } },
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalUnits: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } }
        }
      }
    ]);

    logger.info(
      `AI context for user ${userId}: ` +
      `medicines=${allMedicines.length}, ` +
      `lowStock=${lowStockMedicines.length}, ` +
      `expiring=${expiringBatchesData.length}`
    );

    return {
      allMedicines: medicinesWithStock,
      lowStockMedicines,
      outOfStockMedicines,
      expiringBatches: expiringBatchesData,
      topSellingMedicines: recentSales,
      inventorySummary: stockSummaryArr[0] || {
        totalBatches: 0,
        totalUnits: 0,
        totalValue: 0
      }
    };
  } catch (error) {
    logger.error(`Error gathering inventory context: ${error.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the system prompt injected into the AI's `system` role
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(context) {
  const total = context.allMedicines.length;

  // ── HARD GUARD: empty inventory ───────────────────────────────────────────
  if (total === 0) {
    return (
      'You are a Pharmacy Inventory Management AI Assistant.\n\n' +
      'IMPORTANT: This pharmacy account has ZERO medicines in its inventory.\n' +
      'Verified inventory data:\n' +
      '- Total medicines: 0\n' +
      '- Total stock units: 0\n' +
      '- Inventory value: ₹0\n' +
      '- Low stock items: 0\n' +
      '- Expiring soon: 0\n' +
      '- Recent sales: 0\n\n' +
      'ABSOLUTE RULES — violating these is not allowed:\n' +
      '1. You MUST NOT fabricate, guess, or invent any medicine names, quantities, prices, or expiry dates.\n' +
      '2. For every question about medicines, stock, or expiry you MUST say the inventory is empty.\n' +
      '3. Guide the user to add medicines via the Medicines section before asking inventory questions.\n' +
      '4. Always use ₹ (Indian Rupees), never $.'
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  const medicinesList = context.allMedicines
    .map((m, i) => {
      const qty = m.quantity || 0;
      const status = qty === 0 ? 'OUT OF STOCK' : `${qty} units in stock`;
      return `${i + 1}. ${m.name} — ₹${(m.price || 0).toFixed(0)} — ${status}`;
    })
    .join('\n');

  const lowStockLines =
    context.lowStockMedicines.length > 0
      ? context.lowStockMedicines
          .map(m => `  • ${m.name}: ${m.quantity} units`)
          .join('\n')
      : '  None';

  const expiryLines =
    context.expiringBatches.length > 0
      ? context.expiringBatches
          .map(b => {
            const name = b.medicineDetails?.[0]?.name || 'Unknown';
            return `  • ${name}: expires in ${b.daysToExpiry} days (qty: ${b.quantity})`;
          })
          .join('\n')
      : '  None expiring within 30 days';

  const topSellersLines =
    context.topSellingMedicines.length > 0
      ? context.topSellingMedicines
          .map(m => `  • ${m.medicineName}: ${m.totalQuantity} units sold`)
          .join('\n')
      : '  No sales recorded yet';

  return (
    'You are a Pharmacy Inventory Management AI Assistant.\n' +
    'You have been given the EXACT, REAL-TIME inventory data for this pharmacy below.\n\n' +
    '════ VERIFIED INVENTORY DATA (use ONLY this data) ════\n\n' +
    `Total medicines registered: ${total}\n` +
    `Total stock units: ${context.inventorySummary.totalUnits}\n` +
    `Total inventory value: ₹${(context.inventorySummary.totalValue || 0).toFixed(0)}\n` +
    `Low stock items (≤20 units): ${context.lowStockMedicines.length}\n` +
    `Out of stock: ${context.outOfStockMedicines.length}\n` +
    `Batches expiring within 30 days: ${context.expiringBatches.length}\n\n` +
    `--- COMPLETE MEDICINE LIST (${total} medicines) ---\n` +
    `${medicinesList}\n\n` +
    `--- LOW STOCK MEDICINES ---\n${lowStockLines}\n\n` +
    `--- EXPIRING SOON (within 30 days) ---\n${expiryLines}\n\n` +
    `--- TOP SELLING MEDICINES ---\n${topSellersLines}\n\n` +
    '════════════════════════════════════════════════════\n\n' +
    'ABSOLUTE RULES — you MUST follow these at all times:\n' +
    '1. Only use medicine names, quantities, and prices from the VERIFIED INVENTORY DATA above.\n' +
    '2. NEVER invent, guess, or fabricate medicine names, quantities, expiry dates, or prices.\n' +
    '3. If a medicine is not in the list above, it does not exist in this pharmacy.\n' +
    '4. Always use ₹ (Indian Rupees), never $.\n' +
    '5. Keep responses concise and scannable — use bullet points for lists of 3+ items.\n' +
    '6. When asked to list medicines, show the COMPLETE MEDICINE LIST above.'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: call Groq with proper system/user role split
// ─────────────────────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, userMessage, maxTokens = 1024) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,          // Low temperature = factual, not creative
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  });
  return response.choices[0]?.message?.content || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC responses for empty inventory (no AI call needed)
// ─────────────────────────────────────────────────────────────────────────────
function emptyInventoryResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('low stock') || msg.includes('stock')) {
    return '📦 Your inventory is currently empty — there are no medicines registered yet, so there are no low stock items to report.\n\nTo get started, go to the **Medicines** section and add your medicines first.';
  }
  if (msg.includes('expir') || msg.includes('near expiry') || msg.includes('expired')) {
    return '📅 Your inventory is currently empty — there are no medicines registered, so there are no expiry alerts.\n\nAdd medicines via the **Medicines** section to start tracking expiry dates.';
  }
  if (msg.includes('sale') || msg.includes('best seller') || msg.includes('top')) {
    return '📊 No sales data available — your inventory is empty and no medicines have been added yet.\n\nAdd medicines first, then record sales to see analytics here.';
  }
  if (msg.includes('reorder') || msg.includes('buy') || msg.includes('purchase')) {
    return '🛒 Nothing to reorder yet — your inventory has no medicines registered.\n\nUse the **Medicines** section to add your stock, then return here for reorder recommendations.';
  }
  return '🏥 Your pharmacy inventory is currently **empty** — 0 medicines are registered in your account.\n\nTo use the AI Assistant, please add medicines via the **Medicines** section first. Once you have inventory data, I can help you with:\n• Stock analysis\n• Expiry tracking\n• Reorder recommendations\n• Sales insights';
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

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

  const context = await gatherInventoryContext(req.user.id);
  if (!context) {
    throw new AppError('Failed to gather inventory context', 500);
  }

  // ── HARD SHORT-CIRCUIT for empty inventory — no AI call ──────────────────
  if (context.allMedicines.length === 0) {
    logger.info(`AI Chat: empty inventory for user ${req.user.id} — returning deterministic response`);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'AI analysis generated successfully',
      data: {
        query: { type, original: message },
        response: emptyInventoryResponse(message),
        metadata: {
          model: 'none (empty inventory)',
          hasWarning: false,
          timestamp: new Date().toISOString(),
          inventoryEmpty: true
        },
        context: {
          totalMedicines: 0,
          lowStockItems: 0,
          expiringBatches: 0,
          topSellingMedicines: 0
        }
      }
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  const systemPrompt = buildSystemPrompt(context);

  let userMessage = message;
  switch (type.toLowerCase()) {
    case 'stock':
      userMessage = `[STOCK ANALYSIS] ${message}`;
      break;
    case 'reorder':
      userMessage = `[REORDER REQUEST] ${message}`;
      break;
    case 'expiry':
      userMessage = `[EXPIRY MANAGEMENT] ${message}`;
      break;
    default:
      userMessage = message;
  }

  try {
    const aiResponse = await callGroq(systemPrompt, userMessage, 1024);

    const hasWarning =
      aiResponse.toLowerCase().includes('urgent') ||
      aiResponse.toLowerCase().includes('critical') ||
      aiResponse.toLowerCase().includes('immediately');

    logger.info(`AI Chat: answered for user ${req.user.id} (${context.allMedicines.length} medicines in inventory)`);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'AI analysis generated successfully',
      data: {
        query: { type, original: message },
        response: aiResponse,
        metadata: {
          model: 'llama-3.3-70b-versatile',
          hasWarning,
          timestamp: new Date().toISOString(),
          note: 'Powered by Groq'
        },
        context: {
          totalMedicines: context.allMedicines.length,
          lowStockItems: context.lowStockMedicines.length,
          expiringBatches: context.expiringBatches.length,
          topSellingMedicines: context.topSellingMedicines.length
        }
      }
    });
  } catch (error) {
    if (error?.status === 429) {
      throw new AppError('AI service temporarily unavailable — too many requests', 429);
    }
    if (error?.message?.includes('API_KEY') || error?.message?.includes('auth')) {
      throw new AppError('Groq authentication failed — check API key', 500);
    }
    if (error instanceof AppError) throw error;
    logger.error(`AI Chat error: ${error.message}`);
    throw new AppError('Failed to process AI request', 500);
  }
});

exports.analyzeStock = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 500);
  }

  const context = await gatherInventoryContext(req.user.id);
  if (!context) {
    throw new AppError('Failed to gather inventory context', 500);
  }

  const systemPrompt = buildSystemPrompt(context);

  if (context.allMedicines.length === 0) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Stock analysis generated successfully',
      data: {
        analysis: emptyInventoryResponse('stock'),
        generatedAt: new Date().toISOString(),
        context: context.inventorySummary
      }
    });
  }

  const analysis = await callGroq(
    systemPrompt,
    'Provide a comprehensive stock analysis report covering: current stock status, medicines running low, medicines expiring soon, and recommendations to optimise inventory.',
    1024
  );

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Stock analysis generated successfully',
    data: {
      analysis,
      generatedAt: new Date().toISOString(),
      context: context.inventorySummary
    }
  });
});

exports.suggestReorder = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 500);
  }

  const context = await gatherInventoryContext(req.user.id);
  if (!context) {
    throw new AppError('Failed to gather inventory context', 500);
  }

  const systemPrompt = buildSystemPrompt(context);

  if (context.allMedicines.length === 0) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Reorder suggestions generated successfully',
      data: {
        suggestions: emptyInventoryResponse('reorder'),
        generatedAt: new Date().toISOString(),
        lowStockCount: 0,
        topSellers: []
      }
    });
  }

  const suggestions = await callGroq(
    systemPrompt,
    'Based on the current inventory data and sales trends, generate a reorder purchase list. For each medicine that needs reordering specify: quantity to order, priority (URGENT / HIGH / NORMAL), and justification.',
    1024
  );

  return res.status(200).json({
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
});

exports.expiryAlert = asyncHandler(async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    throw new AppError('Groq API key not configured', 500);
  }

  const context = await gatherInventoryContext(req.user.id);
  if (!context) {
    throw new AppError('Failed to gather inventory context', 500);
  }

  const systemPrompt = buildSystemPrompt(context);

  if (context.allMedicines.length === 0) {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Expiry action plan generated successfully',
      data: {
        actionPlan: emptyInventoryResponse('expiry'),
        expiringBatches: 0,
        generatedAt: new Date().toISOString()
      }
    });
  }

  const actionPlan = await callGroq(
    systemPrompt,
    'Generate an urgent action plan for medicines expiring soon. Categorise by urgency (CRITICAL / HIGH / MEDIUM), list specific actions for each, and suggest revenue recovery strategies.',
    1024
  );

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Expiry action plan generated successfully',
    data: {
      actionPlan,
      expiringBatches: context.expiringBatches.length,
      generatedAt: new Date().toISOString()
    }
  });
});

exports.getAIHealth = asyncHandler(async (req, res) => {
  const apiKeyConfigured = !!process.env.GROQ_API_KEY;

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'AI service status',
    data: {
      aiServiceActive: apiKeyConfigured,
      apiConfigured: apiKeyConfigured,
      model: 'llama-3.3-70b-versatile',
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
        message: 'Powered by Groq — ultra-fast inference'
      }
    }
  });
});
