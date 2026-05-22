
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Category = require('../models/Category');
const Counter = require('../models/Counter');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const {
  processFIFOSale,
  validateSaleFeasibility,
  getFIFOAnalysis,
  rollbackSale,
  generateFIFOReport
} = require('../utils/fifo');
const logger = require('../utils/logger');

exports.generateOrderId = asyncHandler(async (req, res) => {
  
  const updated = await Counter.findOneAndUpdate(
    { name: 'orderId', userId: req.user.id },
    { 
      $inc: { sequence: 1 },
      $setOnInsert: { name: 'orderId', userId: req.user.id }
    },
    { 
      new: true, 
      upsert: true,
    }
  );

  if (!updated) {
    throw new AppError('Failed to generate order ID', 500);
  }

  const seq = updated.sequence;
  const nextOrderId = `ORD-${seq.toString().padStart(4, '0')}`;
  logger.info(`[ORDER_ID] Generated Order ID: ${nextOrderId} for user ${req.user.id}`);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Order ID generated successfully',
    data: {
      orderId: nextOrderId
    }
  });
});

exports.createSale = asyncHandler(async (req, res) => {
  const { medicines, customerName, customerPhone, customerEmail, customerAddress, paymentMethod, notes, orderId } = req.body;

  if (!req.user || !req.user.id) {
    throw new AppError('Authentication required. Please log in first', 401);
  }

  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    throw new AppError('Medicines array is required', 400);
  }

  for (const medicine of medicines) {
    if (!medicine.medicineId || !medicine.quantity) {
      throw new AppError('Each medicine must have medicineId and quantity', 400);
    }

    const medicineExists = await Medicine.findOne({ _id: medicine.medicineId, addedBy: req.user.id });
    if (!medicineExists) {
      throw new AppError(`Medicine ${medicine.medicineId} not found or access denied`, 404);
    }

    if (medicine.quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }
  }

  let validation;
  try {
    logger.info(`[SALE] Validating feasibility for ${medicines.length} medicines`);
    validation = await validateSaleFeasibility(medicines);
    logger.info(`[SALE] Validation result: ${JSON.stringify(validation)}`);
    
    if (!validation.isValid) {
      throw new AppError(validation.message, 400);
    }
  } catch (validationError) {
    logger.error(`[SALE] Validation error: ${validationError.message}`);
    throw validationError;
  }

  let totalAmount = 0;
  let medicinesDetail = [];
  let usedBatches = [];

  try {
    logger.info(`[SALE] Starting to process ${medicines.length} medicines`);

    for (const medicine of medicines) {
      logger.info(`[SALE] Fetching medicine: ${medicine.medicineId}`);
      const medicineData = await Medicine.findOne({ _id: medicine.medicineId, addedBy: req.user.id });
      
      if (!medicineData) {
        throw new AppError(`Medicine not found or access denied: ${medicine.medicineId}`, 404);
      }
      
      logger.info(`[SALE] Found medicine: ${medicineData.name}, current stock: ${medicineData.quantity}`);

      logger.info(`[SALE] Processing FIFO for ${medicineData.name}, qty: ${medicine.quantity}`);
      let fifoResult;
      try {
        fifoResult = await processFIFOSale(medicine.medicineId, medicine.quantity);
        logger.info(`[SALE] FIFO processed: ${medicineData.name} - used ${fifoResult.batchDetails.length} batches, cost: ${fifoResult.totalCost}`);
      } catch (fifoError) {
        logger.error(`[SALE] FIFO ERROR for ${medicineData.name}: ${fifoError.message}`);
        throw fifoError;
      }

      const subtotal = fifoResult.totalCost;
      totalAmount += subtotal;

      medicinesDetail.push({
        medicineId: medicine.medicineId,
        medicineName: medicineData.name,
        quantity: medicine.quantity,
        price: fifoResult.totalCost / medicine.quantity, 
        batchDetails: fifoResult.batchDetails,
        subtotal
      });

      usedBatches.push(...fifoResult.usedBatches);

      logger.info(
        `[SALE] FIFO Sale: Sold ${medicine.quantity} units of ${medicineData.name} using ${fifoResult.batchDetails.length} batch(es), subtotal: ${subtotal}`
      );
    }

    logger.info(`[SALE] All medicines processed, total amount: ${totalAmount}`);

    logger.info(`[SALE] Creating Sale document for user: ${req.user.id}`);
    const sale = new Sale({
      medicines: medicinesDetail,
      totalAmount,
      orderId: orderId || null,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'completed',
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      customerAddress: customerAddress || null,
      notes,
      soldBy: req.user.id,
      status: 'completed'
    });

    await sale.save();
    logger.info(`[SALE] Sale saved with ID: ${sale._id}`);
    
    await sale.populate('medicines.medicineId', 'name manufacturer');
    await sale.populate('soldBy', 'name email');

    logger.info(`[SALE] Sale creation completed successfully`);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Sale created successfully with FIFO logic',
      data: {
        sale,
        summary: {
          invoiceNumber: sale.invoiceNumber,
          totalMedicines: sale.getUniqueMedicineCount(),
          totalQuantity: sale.getTotalQuantity(),
          totalAmount: sale.totalAmount,
          batchesUsed: medicinesDetail.reduce((sum, m) => sum + m.batchDetails.length, 0)
        }
      }
    });
  } catch (error) {
    
    logger.error(`[SALE] ERROR in createSale: ${error.message}`);
    logger.error(`[SALE] Error type: ${error.constructor.name}`);
    logger.error(`[SALE] Error stack: ${error.stack}`);

    if (medicinesDetail && medicinesDetail.length > 0) {
      logger.warn(`[SALE] Attempting rollback for ${medicinesDetail.length} medicines`);
      for (const medicine of medicinesDetail) {
        try {
          await rollbackSale([], medicine.batchDetails);
          logger.info(`[SALE] Rollback successful for medicine: ${medicine.medicineName}`);
        } catch (rollbackError) {
          logger.error(`[SALE] Rollback failed for ${medicine.medicineName}: ${rollbackError.message}`);
        }
      }
    }

    if (error instanceof AppError) {
      throw error;
    }
    
    console.error('[SALES] Unexpected error in createSale:', error);
    throw new AppError(`Failed to create sale: ${error.message}`, 500);
  }
});

exports.getAllSales = asyncHandler(async (req, res) => {
  const { page = 1, limit = 100, startDate, endDate, medicineId, search } = req.query;

  let query = { soldBy: req.user.id };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  if (medicineId) {
    query['medicines.medicineId'] = medicineId;
  }

  if (search && search.trim()) {
    const searchTerm = search.trim();
    
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    query.$or = [
      { customerName: { $regex: escapedTerm, $options: 'i' } },
      { customerPhone: { $regex: escapedTerm, $options: 'i' } },
      { orderId: { $regex: escapedTerm, $options: 'i' } },
      { medicineName: { $regex: escapedTerm, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 100;
  const skip = (pageNum - 1) * limitNum;

  const allCategories = await Category.find({}, '_id name').lean();
  const categoryMap = {};
  allCategories.forEach(cat => {
    categoryMap[cat._id.toString()] = cat.name;
  });

  const sales = await Sale.find(query)
    .populate({
      path: 'medicines.medicineId',
      select: 'name manufacturer category price'
    })
    .populate({
      path: 'soldBy',
      select: 'name email'
    })
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 })
    .lean();

  const salesData = sales.map(sale => {
    return {
      ...sale,
      medicines: (sale.medicines || []).map(med => {
        
        if (!med.medicineId) {
          return { ...med, medicineId: { name: med.medicineName || 'Deleted Medicine', category: { name: 'Unknown' } } };
        }
        
        const categoryId = med.medicineId.category;
        const categoryName = categoryId 
          ? (categoryMap[categoryId.toString()] || 'Unknown Category')
          : 'Unknown Category';
        
        return {
          ...med,
          medicineId: {
            ...med.medicineId,
            category: {
              _id: categoryId,
              name: categoryName
            }
          }
        };
      })
    };
  });

  const totalCount = await Sale.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limitNum);

  console.log('Fetched', salesData.length, 'sales with categories');
  if (salesData[0]) {
    console.log('Sample sale medicines:', JSON.stringify(salesData[0].medicines[0], null, 2));
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Sales retrieved successfully',
    data: {
      sales: salesData,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  });
});

exports.getSaleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sale = await Sale.findOne({ _id: id, soldBy: req.user.id })
    .populate('medicines.medicineId', 'name manufacturer category')
    .populate('medicines.batchDetails.batchId', 'batchNumber expiryDate')
    .populate('soldBy', 'name email role');

  if (!sale) {
    throw new AppError('Sale not found or access denied', 404);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Sale retrieved successfully',
    data: { sale }
  });
});

exports.getCustomersList = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = { soldBy: req.user.id };

  if (search && search.trim()) {
    const searchTerm = search.trim();
    
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    query.$or = [
      { customerName: { $regex: escapedTerm, $options: 'i' } },
      { customerPhone: { $regex: escapedTerm, $options: 'i' } },
      { orderId: { $regex: escapedTerm, $options: 'i' } },
      { 'medicines.medicineName': { $regex: escapedTerm, $options: 'i' } }
    ];
    logger.info(`[SEARCH] Searching with term: "${searchTerm}" | Escaped: "${escapedTerm}"`);
  }

  const customers = await Sale.find(query)
    .populate('medicines.medicineId', 'name price')
    .sort({ createdAt: -1 })
    .lean();

  if (search && search.trim()) {
    console.log('📋 [SEARCH_DEBUG] Query used:', JSON.stringify(query, null, 2));
    console.log('📋 [SEARCH_DEBUG] First result:', customers[0] ? {
      _id: customers[0]._id,
      orderId: customers[0].orderId,
      customerName: customers[0].customerName,
      createdAt: customers[0].createdAt
    } : 'No results');
  }

  logger.info(`[SEARCH] Found ${customers.length} results`);
  if (customers.length > 0 && search) {
    logger.info(`[SEARCH] Sample result - Order ID: ${customers[0].orderId}, Name: ${customers[0].customerName}`);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Customers retrieved successfully',
    data: {
      sales: customers
    }
  });
});

exports.getSalesByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const userExists = await User.findById(userId);
  if (!userExists) {
    throw new AppError('User not found', 404);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sales = await Sale.find({ soldBy: userId, status: 'completed' })
    .populate('medicines.medicineId', 'name')
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const totalCount = await Sale.countDocuments({ soldBy: userId, status: 'completed' });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `Sales for user ${userExists.name} retrieved`,
    data: {
      user: { id: userId, name: userExists.name },
      sales,
      totalSales: totalCount
    }
  });
});

exports.getSalesAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let dateFilter = { status: 'completed', soldBy: req.user.id };
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.$lte = end;
    }
  }

  const revenueData = await Sale.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalSalesCount: { $sum: 1 },
        avgSaleAmount: { $avg: '$totalAmount' }
      }
    }
  ]);

  const topMedicines = await Sale.aggregate([
    { $match: dateFilter },
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.medicineId',
        medicineName: { $first: '$medicines.medicineName' },
        totalQuantity: { $sum: '$medicines.quantity' },
        totalRevenue: { $sum: '$medicines.subtotal' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 }
  ]);

  const paymentMethods = await Sale.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyTrend = await Sale.aggregate([
    {
      $match: {
        status: 'completed',
        soldBy: req.user.id,
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        dailyRevenue: { $sum: '$totalAmount' },
        salesCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const analytics = {
    summary: revenueData.length > 0 ? revenueData[0] : { totalRevenue: 0, totalSalesCount: 0, avgSaleAmount: 0 },
    topMedicines,
    paymentMethods,
    dailyTrend
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Sales analytics retrieved successfully',
    data: { analytics }
  });
});

exports.getFIFOAnalysisForSale = asyncHandler(async (req, res) => {
  const { medicineId } = req.params;
  const { quantity = 1 } = req.query;

  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  const analysis = await getFIFOAnalysis(medicineId, parseInt(quantity, 10));

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'FIFO analysis retrieved successfully',
    data: {
      medicine: { id: medicine._id, name: medicine.name },
      analysis
    }
  });
});

exports.getFIFOReport = asyncHandler(async (req, res) => {
  const { medicineId } = req.params;

  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  const report = await generateFIFOReport(medicineId);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'FIFO report generated successfully',
    data: {
      medicine: { id: medicine._id, name: medicine.name, manufacturer: medicine.manufacturer },
      report
    }
  });
});

exports.cancelSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  let sale = await Sale.findOne({ _id: id, soldBy: req.user.id });
  if (!sale) {
    throw new AppError('Sale not found or access denied', 404);
  }

  if (sale.status === 'cancelled') {
    throw new AppError('Sale is already cancelled', 400);
  }

  for (const medicine of sale.medicines) {
    try {
      await rollbackSale([], medicine.batchDetails);
    } catch (error) {
      logger.error(`Error rolling back batch: ${error.message}`);
    }
  }

  sale.status = 'cancelled';
  sale.notes = (sale.notes || '') + ` [CANCELLED]: ${reason || 'No reason provided'}`;
  await sale.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Sale cancelled and stock restored',
    data: { sale }
  });
});

exports.updateSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customerName, customerPhone, customerEmail, paymentMethod, totalAmount, medicines, notes } = req.body;

  console.log('UPDATE SALE REQUEST:', { id, customerName, customerPhone, customerEmail, paymentMethod, totalAmount, medicines });

  if (typeof customerName === 'undefined' && typeof customerPhone === 'undefined' && typeof customerEmail === 'undefined' &&
      typeof paymentMethod === 'undefined' && typeof totalAmount === 'undefined' && 
      typeof medicines === 'undefined' && typeof notes === 'undefined') {
    throw new AppError('At least one field is required', 400);
  }

  if (totalAmount !== undefined && totalAmount < 0) {
    throw new AppError('Total amount cannot be negative', 400);
  }

  const sale = await Sale.findOne({ _id: id, soldBy: req.user.id });
  if (!sale) {
    throw new AppError('Sale not found or access denied', 404);
  }

  if (typeof customerName !== 'undefined') {
    sale.customerName = customerName;
  }

  if (typeof customerPhone !== 'undefined') {
    sale.customerPhone = customerPhone;
  }

  if (typeof customerEmail !== 'undefined') {
    sale.customerEmail = customerEmail;
  }

  if (typeof paymentMethod !== 'undefined') {
    sale.paymentMethod = paymentMethod;
  }

  if (typeof totalAmount !== 'undefined') {
    sale.totalAmount = totalAmount;
  }

  if (typeof notes !== 'undefined') {
    sale.notes = notes;
  }

  if (medicines && Array.isArray(medicines)) {
    
    if (sale.status === 'completed') {
      for (const oldMed of sale.medicines) {
        try {
          await rollbackSale([], oldMed.batchDetails);
        } catch (err) {
          logger.error(`Error rolling back batch during update: ${err.message}`);
        }
      }
    }

    const newMedicinesDetail = [];
    try {
      for (const med of medicines) {
        if (!med.medicineId) continue;
        const qty = parseInt(med.quantity);
        if (isNaN(qty) || qty < 1) throw new AppError('Quantity must be at least 1', 400);

        const medicineData = await Medicine.findOne({ _id: med.medicineId, addedBy: req.user.id });
        if (!medicineData) throw new AppError(`Medicine not found: ${med.medicineId}`, 404);

        const fifoResult = await processFIFOSale(med.medicineId, qty);
        newMedicinesDetail.push({
          medicineId: med.medicineId,
          medicineName: medicineData.name,
          quantity: qty,
          price: fifoResult.totalCost / qty,
          batchDetails: fifoResult.batchDetails,
          subtotal: fifoResult.totalCost
        });
      }

      sale.medicines = newMedicinesDetail;
      
      if (typeof totalAmount === 'undefined') {
        sale.totalAmount = newMedicinesDetail.reduce((sum, item) => sum + item.subtotal, 0);
      }
      
    } catch (error) {
      
      logger.error(`[SALE_UPDATE] Error processing new FIFO: ${error.message}. Attempting to restore old stock.`);
      if (sale.status === 'completed') {
        for (const oldMed of sale.medicines) {
          try {
            await processFIFOSale(oldMed.medicineId, oldMed.quantity);
          } catch (restoreErr) {
            logger.error(`[SALE_UPDATE] Critical failure restoring old stock: ${restoreErr.message}`);
          }
        }
      }
      throw error;
    }
  }

  const savedSale = await sale.save();
  
  const populatedSale = await Sale.findById(savedSale._id)
    .populate('medicines.medicineId', 'name manufacturer price category');

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Sale updated successfully',
    data: { sale: populatedSale }
  });
});

exports.deleteSale = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sale = await Sale.findOne({ _id: id, soldBy: req.user.id });
  if (!sale) {
    throw new AppError('Sale not found or access denied', 404);
  }

  if (sale.status === 'completed') {
    for (const medicine of sale.medicines) {
      try {
        await rollbackSale([], medicine.batchDetails);
        logger.info(`Stock restored for sale ${id}`);
      } catch (error) {
        logger.error(`Error rolling back batch for deleted sale: ${error.message}`);
      }
    }
  }

  await Sale.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Sale deleted successfully and stock restored',
    data: {}
  });
});
