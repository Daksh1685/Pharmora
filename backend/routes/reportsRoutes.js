const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const protect = require('../middleware/authMiddleware');

router.get('/sales', protect, reportsController.getSalesReport);

router.get('/profit', protect, reportsController.getProfitReport);

router.get('/low-stock', protect, reportsController.getLowStockReport);

router.get('/expiry', protect, reportsController.getExpiryReport);

router.get('/inventory-summary', protect, reportsController.getInventorySummary);

router.get('/dashboard-stats', protect, reportsController.getDashboardStats);

module.exports = router;
