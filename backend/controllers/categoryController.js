
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ userId: req.user.id }).sort({ name: 1 });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Categories retrieved successfully',
    data: {
      categories,
      total: categories.length
    }
  });
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await Category.findOne({ _id: id, userId: req.user.id });

  if (!category) {
    throw new AppError('Category not found or access denied', 404);
  }

  const medicineCount = await Medicine.countDocuments({ category: category._id });
  category.medicineCount = medicineCount;

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Category retrieved successfully',
    data: { category }
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    throw new AppError('Category name is required', 400);
  }

  const existingCategory = await Category.findOne({ 
    name: { $regex: `^${name}$`, $options: 'i' },
    userId: req.user.id
  });

  if (existingCategory) {
    throw new AppError('Category with this name already exists in your account', 409);
  }

  const category = await Category.create({
    name: name.trim(),
    description: description ? description.trim() : '',
    userId: req.user.id
  });

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Category created successfully',
    data: { category }
  });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await Category.findOne({ _id: id, userId: req.user.id });
  if (!category) {
    throw new AppError('Category not found or access denied', 404);
  }

  if (name && name.trim() !== category.name) {
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name}$`, $options: 'i' },
      userId: req.user.id
    });

    if (existingCategory) {
      throw new AppError('Category with this name already exists in your account', 409);
    }
  }

  if (name && name.trim() !== '') {
    category.name = name.trim();
  }
  if (description !== undefined) {
    category.description = description.trim();
  }

  await category.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Category updated successfully',
    data: { category }
  });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await Category.findOne({ _id: id, userId: req.user.id });
  
  if (!category) {
    throw new AppError('Category not found or access denied', 404);
  }

  const medicineCount = await Medicine.countDocuments({ category: id });
  
  if (medicineCount > 0) {
    throw new AppError(
      `Cannot delete category. It has ${medicineCount} medicine(s). Please move or delete those medicines first.`,
      400
    );
  }

  await Category.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Category deleted successfully',
    data: {}
  });
});

exports.getMedicinesByCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await Category.findOne({ _id: id, userId: req.user.id });
  if (!category) {
    throw new AppError('Category not found or access denied', 404);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const medicines = await Medicine.find({ category: id })
    .skip(skip)
    .limit(limitNum)
    .sort({ name: 1 });

  const totalCount = await Medicine.countDocuments({ category: id });
  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Medicines retrieved successfully',
    data: {
      category: category.name,
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
