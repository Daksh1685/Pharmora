
const Sale = require('../models/Sale');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Purchase = require('../models/Purchase');
const Category = require('../models/Category');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = { status: 'completed', soldBy: req.user.id };
  if (Object.keys(dateFilter).length > 0) {
    matchStage.createdAt = dateFilter;
  }

  let groupFormat = '%Y-%m-%d';
  if (groupBy === 'week') groupFormat = '%Y-W%V';
  if (groupBy === 'month') groupFormat = '%Y-%m';

  const salesReport = await Sale.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        totalRevenue: { $sum: '$totalAmount' },
        totalSales: { $sum: 1 },
        totalQuantity: { $sum: { $sum: '$medicines.quantity' } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Sales report generated successfully',
    data: {
      report: salesReport,
      summary: {
        totalRevenue: salesReport.reduce((sum, item) => sum + item.totalRevenue, 0),
        totalSales: salesReport.reduce((sum, item) => sum + item.totalSales, 0),
        totalQuantity: salesReport.reduce((sum, item) => sum + item.totalQuantity, 0),
        startDate: startDate || 'All time',
        endDate: endDate || 'Until now'
      }
    }
  });
});

exports.getInventorySummary = asyncHandler(async (req, res) => {
  const medicineStats = await Medicine.aggregate([
    { $match: { addedBy: req.user.id } },
    {
      $group: {
        _id: null,
        totalMedicines: { $sum: 1 },
        totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  const lowStockMedicines = await Medicine.find({ addedBy: req.user.id, quantity: { $lte: 20 } })
    .populate('category', 'name')
    .limit(10);

  const expiredBatches = await Batch.find({
    addedBy: req.user.id,
    expiryDate: { $lt: new Date() },
    status: 'active'
  }).populate('medicineId', 'name');

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Inventory summary generated successfully',
    data: {
      stats: medicineStats[0] || { totalMedicines: 0, totalStockValue: 0, totalQuantity: 0 },
      lowStockItems: lowStockMedicines,
      expiredItems: expiredBatches
    }
  });
});

exports.getProfitReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);

  const matchStage = { status: 'completed', soldBy: req.user.id };
  if (Object.keys(dateFilter).length > 0) {
    matchStage.createdAt = dateFilter;
  }

  const profitReport = await Sale.aggregate([
    { $match: matchStage },
    { $unwind: '$medicines' },
    { $unwind: '$medicines.batchDetails' },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$medicines.subtotal' },
        totalCost: { $sum: '$medicines.batchDetails.costFromBatch' }
      }
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        totalCost: 1,
        grossProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
        profitPercentage: {
          $cond: [
            { $eq: ['$totalRevenue', 0] },
            0,
            { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] }, 100] }
          ]
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Profit report generated successfully',
    data: {
      report: profitReport[0] || { totalRevenue: 0, totalCost: 0, grossProfit: 0, profitPercentage: 0 },
      summary: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Until now'
      }
    }
  });
});

exports.getLowStockReport = asyncHandler(async (req, res) => {
  const { threshold = 20 } = req.query;
  const limit = parseInt(threshold, 10);

  const lowStockItems = await Medicine.find({
    addedBy: req.user.id,
    quantity: { $lte: limit }
  }).populate('category', 'name').sort({ quantity: 1 });

  res.status(200).json({
    success: true,
    data: {
      items: lowStockItems,
      count: lowStockItems.length,
      threshold: limit
    }
  });
});

exports.getExpiryReport = asyncHandler(async (req, res) => {
  const { daysUntilExpiry = 30 } = req.query;
  const days = parseInt(daysUntilExpiry, 10);
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const expiringBatches = await Batch.find({
    addedBy: req.user.id,
    expiryDate: { $gte: new Date(), $lte: futureDate },
    status: 'active'
  }).populate('medicineId', 'name').sort({ expiryDate: 1 });

  res.status(200).json({
    success: true,
    data: {
      items: expiringBatches,
      count: expiringBatches.length,
      daysThreshold: days
    }
  });
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  console.log(`📊 [STATS] Fetching optimized dashboard statistics for user ${req.user.id}...`);
  
  const [medicineCount, lowStockCount, salesStats, purchaseStats, expiredCount, categoryCount, userCount] = await Promise.all([
    Medicine.countDocuments({ addedBy: req.user.id }),
    Medicine.countDocuments({ addedBy: req.user.id, quantity: { $lte: 20 } }),
    Sale.aggregate([
      { $match: { status: 'completed', soldBy: req.user.id } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]),
    Purchase.aggregate([
      { $match: { status: 'received', createdBy: req.user.id } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]),
    Batch.countDocuments({ expiryDate: { $lt: new Date() }, status: 'active', addedBy: req.user.id }),
    Category.countDocuments({ userId: req.user.id }),
    User.countDocuments()
  ]);

  const recentSales = await Sale.find({ status: 'completed', soldBy: req.user.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const chartSales = await Sale.find({
    status: 'completed',
    soldBy: req.user.id,
    createdAt: { $gte: thirtyDaysAgo }
  })
  .select('totalAmount createdAt')
  .sort({ createdAt: 1 })
  .lean();

  res.status(200).json({
    success: true,
    data: {
      totalMedicines: medicineCount,
      lowStockItems: lowStockCount,
      totalSales: salesStats[0]?.total || 0,
      totalPurchases: purchaseStats[0]?.total || 0,
      salesCount: salesStats[0]?.count || 0,
      purchasesCount: purchaseStats[0]?.count || 0,
      expiredMedicines: expiredCount,
      batchesCount: await Batch.countDocuments({ addedBy: req.user.id }),
      recentSales,
      salesData: chartSales,
      availableCategories: categoryCount,
      systemUsers: userCount
    }
  });
});
