
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { syncMedicineQuantity } = require('../utils/fifo');
const logger = require('../utils/logger');

exports.addBatch = asyncHandler(async (req, res) => {
  const { medicineId, batchNumber, expiryDate, quantity, purchasePrice, sellingPrice } = req.body;

  if (!medicineId || !batchNumber || !expiryDate || !quantity || !purchasePrice || !sellingPrice) {
    throw new AppError(
      'medicineId, batchNumber, expiryDate, quantity, purchasePrice, and sellingPrice are required',
      400
    );
  }

  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  const existingBatch = await Batch.findOne({ batchNumber, addedBy: req.user.id });
  if (existingBatch) {
    throw new AppError('Batch number already exists in your account', 409);
  }

  const expiry = new Date(expiryDate);
  const today = new Date();
  if (expiry <= today) {
    throw new AppError('Expiry date must be in the future', 400);
  }

  if (sellingPrice < purchasePrice) {
    throw new AppError('Selling price must be greater than or equal to purchase price', 400);
  }

  const batch = new Batch({
    medicineId,
    batchNumber,
    expiryDate,
    quantity,
    purchasePrice,
    sellingPrice,
    addedBy: req.user.id
  });

  await batch.save();

  await syncMedicineQuantity(medicineId);

  await batch.populate('medicineId', 'name manufacturer category');

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Batch added successfully',
    data: { batch }
  });
});

exports.getAllBatches = asyncHandler(async (req, res) => {
  const { medicineId, expiryDaysRange, page = 1, limit = 10 } = req.query;

  let query = { status: 'active', addedBy: req.user.id };

  if (medicineId) {
    query.medicineId = medicineId;
  }

  if (expiryDaysRange) {
    const daysRange = parseInt(expiryDaysRange, 10);
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysRange * 24 * 60 * 60 * 1000);

    query.expiryDate = {
      $gte: today,
      $lte: futureDate
    };
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const batches = await Batch.find(query)
    .populate('medicineId', 'name manufacturer category')
    .skip(skip)
    .limit(limitNum)
    .sort({ expiryDate: 1 }); 

  const totalCount = await Batch.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limitNum);

  const batchesWithComputed = batches.map(batch => {
    const batchObj = batch.toJSON();
    return {
      ...batchObj,
      daysRemaining: batch.daysRemaining,
      isNearExpiry: batch.isNearExpiry,
      isExpired: batch.isExpired,
      totalBatchValue: batch.totalBatchValue,
      totalProfit: batch.totalProfit,
      fifoScore: batch.expiryDate.getTime() 
    };
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Batches retrieved successfully',
    data: {
      batches: batchesWithComputed,
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

exports.getNearExpiryBatches = asyncHandler(async (req, res) => {
  const batches = await Batch.find({ 
    status: 'active', 
    addedBy: req.user.id,
    expiryDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } 
  })
    .populate('medicineId', 'name manufacturer category')
    .sort({ expiryDate: 1 });

  const batchesWithComputed = batches.map(batch => {
    const batchObj = batch.toJSON();
    return {
      ...batchObj,
      daysRemaining: batch.daysRemaining,
      isNearExpiry: batch.isNearExpiry,
      urgency: batch.daysRemaining <= 7 ? 'critical' : batch.daysRemaining <= 15 ? 'high' : 'medium'
    };
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Near-expiry batches retrieved successfully',
    data: {
      batches: batchesWithComputed,
      count: batches.length
    }
  });
});

exports.getBatchesByMedicine = asyncHandler(async (req, res) => {
  const { medicineId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const medicine = await Medicine.findOne({ _id: medicineId, addedBy: req.user.id });
  if (!medicine) {
    throw new AppError('Medicine not found or access denied', 404);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const batches = await Batch.find({ medicineId, status: 'active', addedBy: req.user.id })
    .populate('medicineId', 'name manufacturer category')
    .skip(skip)
    .limit(limitNum)
    .sort({ expiryDate: 1 });

  const totalCount = await Batch.countDocuments({ medicineId, status: 'active', addedBy: req.user.id });
  const totalPages = Math.ceil(totalCount / limitNum);

  const batchesWithComputed = batches.map(batch => {
    const batchObj = batch.toJSON();
    return {
      ...batchObj,
      daysRemaining: batch.daysRemaining,
      isNearExpiry: batch.isNearExpiry,
      totalBatchValue: batch.totalBatchValue,
      totalProfit: batch.totalProfit
    };
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `Batches for ${medicine.name} retrieved successfully`,
    data: {
      medicine: {
        id: medicine._id,
        name: medicine.name,
        manufacturer: medicine.manufacturer
      },
      batches: batchesWithComputed,
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

exports.getFIFOOrder = asyncHandler(async (req, res) => {
  const batches = await Batch.find({ status: 'active', addedBy: req.user.id })
    .populate('medicineId', 'name manufacturer')
    .sort({ expiryDate: 1 }); 

  const fifoOrdered = batches.map((batch, index) => {
    const batchObj = batch.toJSON();
    return {
      ...batchObj,
      fifoRank: index + 1, 
      daysRemaining: batch.daysRemaining,
      isNearExpiry: batch.isNearExpiry,
      recommendation: batch.daysRemaining <= 7 ? 'URGENT: Prioritize for sale' : batch.daysRemaining <= 30 ? 'MEDIUM: Schedule for promotion' : 'OK: Can stay in stock'
    };
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'FIFO order retrieved successfully',
    data: {
      totalBatches: batches.length,
      fifoSequence: fifoOrdered
    }
  });
});

exports.getInventorySummary = asyncHandler(async (req, res) => {
  const batches = await Batch.find({ status: 'active', addedBy: req.user.id })
    .populate('medicineId', 'name');

  const summary = {
    totalBatches: batches.length,
    totalQuantity: 0,
    totalInventoryValue: 0,
    totalProfit: 0,
    nearExpiryCount: 0,
    expiredCount: 0,
    byMedicine: {}
  };

  batches.forEach(batch => {
    summary.totalQuantity += batch.quantity;
    summary.totalInventoryValue += batch.quantity * batch.sellingPrice;
    summary.totalProfit += batch.quantity * batch.profit;

    if (batch.isNearExpiry) summary.nearExpiryCount++;
    if (batch.isExpired) summary.expiredCount++;

    const medicineName = batch.medicineId.name;
    if (!summary.byMedicine[medicineName]) {
      summary.byMedicine[medicineName] = {
        totalQuantity: 0,
        totalValue: 0,
        batches: 0
      };
    }

    summary.byMedicine[medicineName].totalQuantity += batch.quantity;
    summary.byMedicine[medicineName].totalValue += batch.quantity * batch.sellingPrice;
    summary.byMedicine[medicineName].batches += 1;
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Inventory summary retrieved successfully',
    data: { summary }
  });
});

exports.updateBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, purchasePrice, sellingPrice } = req.body;

  let batch = await Batch.findOne({ _id: id, addedBy: req.user.id });
  if (!batch) {
    throw new AppError('Batch not found or access denied', 404);
  }

  if (quantity !== undefined) batch.quantity = quantity;
  if (purchasePrice !== undefined) batch.purchasePrice = purchasePrice;
  if (sellingPrice !== undefined) {
    if (sellingPrice < purchasePrice) {
      throw new AppError('Selling price must be >= purchase price', 400);
    }
    batch.sellingPrice = sellingPrice;
  }

  await batch.save();
  await batch.populate('medicineId', 'name manufacturer');

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Batch updated successfully',
    data: { batch }
  });
});

exports.deleteBatch = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const batch = await Batch.findOneAndDelete({ _id: id, addedBy: req.user.id });
  if (!batch) {
    throw new AppError('Batch not found or access denied', 404);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Batch deleted successfully',
    data: { deletedBatch: batch }
  });
});

exports.markBatchExpired = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const batch = await Batch.findOne({ _id: id, addedBy: req.user.id });
  if (!batch) {
    throw new AppError('Batch not found or access denied', 404);
  }

  batch.status = 'expired';
  await batch.save();
  await batch.populate('medicineId', 'name manufacturer');

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Batch marked as expired',
    data: { batch }
  });
});
