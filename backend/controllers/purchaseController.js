
const Purchase = require('../models/Purchase');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { syncMedicineQuantity } = require('../utils/fifo');

exports.createPurchase = asyncHandler(async (req, res) => {
  const {
    supplierName,
    supplierPhone,
    supplierEmail,
    supplierAddress,
    medicines,
    paymentMethod,
    paymentStatus,
    status,
    notes
  } = req.body;

  if (!supplierName || !supplierName.trim()) {
    throw new AppError('Supplier name is required', 400);
  }

  if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
    throw new AppError('Medicines array is required', 400);
  }

  const processedMedicines = [];
  
  for (const medicine of medicines) {
    
    const errors = [];
    
    if (!medicine.name && !medicine.medicineName && !medicine.medicineId) {
      errors.push('medicine name or medicineId');
    }
    if (!medicine.batchNumber || !String(medicine.batchNumber).trim()) {
      errors.push('batchNumber');
    }
    if (!medicine.expiryDate) {
      errors.push('expiryDate');
    }
    if (medicine.quantity === undefined || medicine.quantity === null || medicine.quantity === '') {
      errors.push('quantity');
    }
    if (medicine.purchasePrice === undefined || medicine.purchasePrice === null) {
      errors.push('purchasePrice');
    }
    
    if (errors.length > 0) {
      throw new AppError(
        `Each medicine must have: ${errors.join(', ')}`,
        400
      );
    }

    let medicineId = medicine.medicineId;
    let medicineName = medicine.name || medicine.medicineName;

    if (!medicineId) {
      throw new AppError('medicineId is required. Please select a medicine from the list.', 400);
    }

    const medicineExists = await Medicine.findById(medicineId);
    if (!medicineExists) {
      throw new AppError(`Medicine ${medicineId} not found`, 404);
    }

    if (medicine.quantity < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    if (medicine.purchasePrice < 0) {
      throw new AppError('Purchase price cannot be negative', 400);
    }

    const expiryDate = new Date(medicine.expiryDate);
    if (expiryDate <= new Date()) {
      throw new AppError(`Expiry date for ${medicineExists.name} must be in the future`, 400);
    }

    processedMedicines.push({
      medicineId,
      medicineName: medicineExists.name,
      batchNumber: medicine.batchNumber,
      expiryDate: medicine.expiryDate,
      quantity: medicine.quantity,
      purchasePrice: medicine.purchasePrice,
    });
  }

  let totalAmount = 0;
  const medicinesDetail = [];
  const createdBatches = [];

  for (const medicine of processedMedicines) {
    const medicineData = await Medicine.findById(medicine.medicineId);
    const subtotal = medicine.quantity * medicine.purchasePrice;
    totalAmount += subtotal;

    let batchNumber = medicine.batchNumber;
    let batchExists = await Batch.findOne({ batchNumber, addedBy: req.user.id });
    let counter = 1;
    
    while (batchExists) {
      
      batchNumber = `${medicine.batchNumber}-${counter}`;
      batchExists = await Batch.findOne({ batchNumber, addedBy: req.user.id });
      counter++;
    }

    const batch = new Batch({
      medicineId: medicine.medicineId,
      batchNumber: batchNumber,
      quantity: medicine.quantity,
      purchasePrice: medicine.purchasePrice,
      sellingPrice: Math.max(medicineData.price || medicine.purchasePrice * 1.5, medicine.purchasePrice * 1.5),
      expiryDate: new Date(medicine.expiryDate),
      status: 'active',
      addedBy: req.user.id 
    });

    await batch.save();

    await syncMedicineQuantity(medicine.medicineId);

    medicinesDetail.push({
      medicineId: medicine.medicineId,
      medicineName: medicineData.name,
      batchNumber: batchNumber,
      expiryDate: new Date(medicine.expiryDate),
      quantity: medicine.quantity,
      purchasePrice: medicine.purchasePrice,
      batchId: batch._id,
      subtotal
    });

    createdBatches.push({
      batchId: batch._id,
      medicineId: medicine.medicineId,
      quantity: medicine.quantity
    });

    logger.info(
      `Batch Created: ${medicine.batchNumber} for ${medicineData.name} (${medicine.quantity} units)`
    );
  }

  const purchase = new Purchase({
    supplierName: supplierName.trim(),
    supplierPhone: supplierPhone || null,
    supplierEmail: supplierEmail || null,
    supplierAddress: supplierAddress || null,
    medicines: medicinesDetail,
    totalAmount,
    paymentMethod: paymentMethod || 'bank_transfer',
    paymentStatus: paymentStatus || 'pending',
    status: status || 'pending',
    notes,
    createdBy: req.user.id,
  });

  await purchase.save();
  await purchase.populate('medicines.medicineId', 'name manufacturer');
  await purchase.populate('medicines.batchId', 'batchNumber quantity');
  await purchase.populate('createdBy', 'name email');

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Purchase created successfully with automatic batch creation',
    data: {
      purchase,
      summary: {
        purchaseOrderNumber: purchase.purchaseOrderNumber,
        totalMedicines: purchase.getUniqueMedicineCount(),
        totalQuantity: purchase.getTotalQuantity(),
        totalAmount: purchase.totalAmount,
        batchesCreated: createdBatches.length
      }
    }
  });

  logger.info(`Purchase ${purchase.purchaseOrderNumber} created with ${createdBatches.length} batches`);
});

exports.getPurchases = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, supplierName, startDate, endDate, status } = req.query;

  let query = { createdBy: req.user.id };

  if (supplierName) {
    query.supplierName = { $regex: supplierName, $options: 'i' };
  }

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const purchases = await Purchase.find(query)
    .populate('medicines.medicineId', 'name manufacturer category')
    .populate('medicines.batchId', 'batchNumber quantity expiryDate')
    .populate('createdBy', 'name email')
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const totalCount = await Purchase.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Purchases retrieved successfully',
    data: {
      purchases,
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

exports.getPurchaseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const purchase = await Purchase.findOne({ _id: id, createdBy: req.user.id })
    .populate('medicines.medicineId', 'name manufacturer category')
    .populate('medicines.batchId', 'batchNumber quantity expiryDate status')
    .populate('createdBy', 'name email role');

  if (!purchase) {
    throw new AppError('Purchase not found or access denied', 404);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Purchase retrieved successfully',
    data: { purchase }
  });
});

exports.getPurchasesBySupplier = asyncHandler(async (req, res) => {
  const { supplierName } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const purchases = await Purchase.find({
    supplierName: { $regex: supplierName, $options: 'i' },
    createdBy: req.user.id
  })
    .populate('medicines.medicineId', 'name')
    .populate('medicines.batchId', 'batchNumber quantity')
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const totalCount = await Purchase.countDocuments({
    supplierName: { $regex: supplierName, $options: 'i' },
    createdBy: req.user.id
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `Purchases from ${supplierName} retrieved`,
    data: {
      supplier: supplierName,
      purchases,
      total: totalCount
    }
  });
});

exports.getPurchaseAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let dateFilter = { createdBy: req.user.id };
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt.$lte = end;
    }
  }

  const spendingData = await Purchase.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalSpending: { $sum: '$totalAmount' },
        totalPurchases: { $sum: 1 },
        avgPurchaseAmount: { $avg: '$totalAmount' }
      }
    }
  ]);

  const topSuppliers = await Purchase.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$supplierName',
        totalSpending: { $sum: '$totalAmount' },
        purchaseCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpending: -1 } },
    { $limit: 10 }
  ]);

  const topMedicines = await Purchase.aggregate([
    { $match: dateFilter },
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.medicineId',
        medicineName: { $first: '$medicines.medicineName' },
        totalQuantity: { $sum: '$medicines.quantity' },
        totalCost: { $sum: '$medicines.subtotal' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 }
  ]);

  const paymentStatus = await Purchase.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const analytics = {
    summary: spendingData.length > 0 ? spendingData[0] : { totalSpending: 0, totalPurchases: 0, avgPurchaseAmount: 0 },
    topSuppliers,
    topMedicines,
    paymentStatus
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Purchase analytics retrieved successfully',
    data: { analytics }
  });
});

exports.updatePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { supplierName, supplierPhone, supplierEmail, supplierAddress, status, paymentMethod, paymentStatus, notes } = req.body;

  const purchase = await Purchase.findOne({ _id: id, createdBy: req.user.id });
  if (!purchase) {
    throw new AppError('Purchase not found or access denied', 404);
  }

  if (supplierName) purchase.supplierName = supplierName;
  if (supplierPhone) purchase.supplierPhone = supplierPhone;
  if (supplierEmail) purchase.supplierEmail = supplierEmail;
  if (supplierAddress) purchase.supplierAddress = supplierAddress;
  if (status) purchase.status = status;
  if (paymentMethod) purchase.paymentMethod = paymentMethod;
  if (paymentStatus) purchase.paymentStatus = paymentStatus;
  if (notes) purchase.notes = notes;

  await purchase.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Purchase updated successfully',
    data: { purchase }
  });
});

exports.deletePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const purchase = await Purchase.findOne({ _id: id, createdBy: req.user.id });
  if (!purchase) {
    throw new AppError('Purchase not found or access denied', 404);
  }

  const batchIds = purchase.medicines.map(m => m.batchId);
  await Batch.deleteMany({ _id: { $in: batchIds } });

  await Purchase.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Purchase deleted successfully'
  });
});
