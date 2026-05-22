
const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getMedicinesByCategory
} = require('../controllers/categoryController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getAllCategories);

router.get('/:id', protect, getCategoryById);

router.get('/:id/medicines', protect, getMedicinesByCategory);

router.post('/', protect, createCategory);

router.put('/:id', protect, updateCategory);

router.delete('/:id', protect, deleteCategory);

module.exports = router;
