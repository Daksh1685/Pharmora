
const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const Batch = require('../models/Batch');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const { syncMedicineQuantity } = require('../utils/fifo');

async function syncAllMedicinesQuantities(userId) {
  try {
    if (!userId) return 0;
    
    const batchTotals = await Batch.aggregate([
      { $match: { status: 'active', addedBy: userId } },
      { 
        $group: { 
          _id: '$medicineId', 
          totalQuantity: { $sum: '$quantity' } 
        } 
      }
    ]);

    const totalsMap = {};
    batchTotals.forEach(item => {
      totalsMap[item._id.toString()] = item.totalQuantity;
    });

    const medicines = await Medicine.find({ addedBy: userId });
    let syncCount = 0;
    const updateOps = [];

    for (const medicine of medicines) {
      const calculatedQuantity = totalsMap[medicine._id.toString()] || 0;
      
      if (medicine.quantity !== calculatedQuantity) {
        medicine.quantity = calculatedQuantity;
        updateOps.push(medicine.save());
        syncCount++;
      }
    }

    if (updateOps.length > 0) {
      await Promise.all(updateOps);
    }
    
    return syncCount;
  } catch (error) {
    return 0;
  }
}

exports.getAllMedicines = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 100 } = req.query;

  await syncAllMedicinesQuantities(req.user.id);

  console.log('GET /medicines requested by:', req.user.email, 'ID:', req.user.id);

  let query = { addedBy: req.user.id };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 100;
  const skip = (pageNum - 1) * limitNum;

  const medicines = await Medicine.find(query)
    .populate('category', 'name description')
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const totalCount = await Medicine.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Medicines retrieved successfully',
    data: {
      medicines,
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

exports.getMedicineById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medicine = await Medicine.findOne({ _id: id, addedBy: req.user.id })
    .populate('category', 'name description')
    .select('-__v');

  if (!medicine) {
    throw new AppError('Medicine not found or access denied', 404);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Medicine retrieved successfully',
    data: { medicine }
  });
});

exports.addMedicine = asyncHandler(async (req, res) => {
  const { name, manufacturer, category, price, quantity, expiryDate, description } = req.body;

  if (!name || !manufacturer || !category) {
    throw new AppError('Name, manufacturer, and category are required', 400);
  }

  let categoryId = null;
  
  if (category.match(/^[0-9a-fA-F]{24}$/)) {
    
    categoryId = category;
  } else {
    
    const categoryDoc = await Category.findOne({ 
      name: { $regex: `^${category}$`, $options: 'i' },
      userId: req.user.id
    });
    if (!categoryDoc) {
      throw new AppError(`Category '${category}' not found. Please create it first or use an existing category.`, 400);
    }
    categoryId = categoryDoc._id;
  }

  if (price !== undefined && price !== '' && (isNaN(price) || price < 0)) {
    throw new AppError('Price must be a valid number greater than or equal to 0', 400);
  }

  if (quantity !== undefined && quantity !== '' && (isNaN(quantity) || quantity < 0)) {
    throw new AppError('Quantity must be a valid number greater than or equal to 0', 400);
  }

  const medicine = new Medicine({
    name,
    manufacturer,
    category: categoryId,
    price: price || 0,
    quantity: quantity || 0,
    expiryDate: expiryDate || null,
    description,
    addedBy: req.user.id 
  });

  await medicine.save();
  
  if (quantity > 0) {
    const Batch = require('../models/Batch');
    await Batch.create({
      medicineId: medicine._id,
      batchNumber: `INIT-${Date.now()}`,
      quantity: quantity,
      purchasePrice: price || 0,
      sellingPrice: price || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 
      status: 'active',
      addedBy: req.user.id
    });
  }

  await medicine.populate('category');

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Medicine added successfully',
    data: { medicine }
  });
});

exports.updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, manufacturer, category, price, quantity, expiryDate, description } = req.body;

  let medicine = await Medicine.findOne({ _id: id, addedBy: req.user.id });
  if (!medicine) {
    throw new AppError('Medicine not found or access denied', 404);
  }

  if (category !== undefined) {
    let categoryId = null;
    
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      
      categoryId = category;
    } else {
      
      const categoryDoc = await Category.findOne({ 
        name: { $regex: `^${category}$`, $options: 'i' },
        userId: req.user.id
      });
      if (!categoryDoc) {
        throw new AppError(`Category '${category}' not found. Please create it first or use an existing category.`, 400);
      }
      categoryId = categoryDoc._id;
    }
    
    medicine.category = categoryId;
  }

  if (price !== undefined && price !== '' && (isNaN(price) || price < 0)) {
    throw new AppError('Price must be a valid number greater than or equal to 0', 400);
  }

  if (quantity !== undefined && quantity !== '' && (isNaN(quantity) || quantity < 0)) {
    throw new AppError('Quantity must be a valid number greater than or equal to 0', 400);
  }

  const oldQuantity = medicine.quantity;

  if (name !== undefined) medicine.name = name;
  if (manufacturer !== undefined) medicine.manufacturer = manufacturer;
  if (price !== undefined && price !== '') medicine.price = price;
  if (quantity !== undefined && quantity !== '') medicine.quantity = quantity;
  if (expiryDate !== undefined) medicine.expiryDate = expiryDate || null;
  if (description !== undefined) medicine.description = description;

  await medicine.save();
  
  if (quantity !== undefined && quantity !== '' && Number(quantity) > oldQuantity) {
    const diff = Number(quantity) - oldQuantity;
    const Batch = require('../models/Batch');
    await Batch.create({
      medicineId: medicine._id,
      batchNumber: `MANUAL-${Date.now()}`,
      quantity: diff,
      purchasePrice: medicine.price || 0,
      sellingPrice: medicine.price || 0,
      expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
      addedBy: req.user.id
    });
  }

  await medicine.populate('category');

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Medicine updated successfully',
    data: { medicine }
  });
});

exports.deleteMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medicine = await Medicine.findOneAndDelete({ _id: id, addedBy: req.user.id });

  if (!medicine) {
    throw new AppError('Medicine not found or access denied', 404);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Medicine deleted successfully',
    data: { deletedMedicine: medicine }
  });
});

exports.searchMedicines = asyncHandler(async (req, res) => {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    throw new AppError('Search term is required', 400);
  }

  const medicines = await Medicine.find({
    addedBy: req.user.id,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ]
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Search results retrieved successfully',
    data: {
      medicines,
      count: medicines.length
    }
  });
});

exports.getMedicinesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;

  const validCategories = [
    'Antibiotic',
    'Painkiller',
    'Vitamin',
    'Antacid',
    'Antihistamine',
    'Cough Syrup',
    'Fever',
    'Blood Pressure',
    'Diabetes',
    'Heart',
    'Other'
  ];

  if (!validCategories.includes(category)) {
    throw new AppError(
      `Invalid category. Valid categories: ${validCategories.join(', ')}`,
      400
    );
  }

  const medicines = await Medicine.find({
    category: category,
    addedBy: req.user.id
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `Medicines in ${category} category retrieved successfully`,
    data: {
      category,
      medicines,
      count: medicines.length
    }
  });
});
