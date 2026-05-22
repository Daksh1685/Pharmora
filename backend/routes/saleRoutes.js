
const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrPharmacist, adminOnly } = require('../middleware/roleMiddleware');

router.get('/generate-order-id', authMiddleware, saleController.generateOrderId);

router.get('/', authMiddleware, saleController.getAllSales);

router.get('/analytics/summary', authMiddleware, saleController.getSalesAnalytics);

router.get('/analysis/fifo/:medicineId', authMiddleware, saleController.getFIFOAnalysisForSale);

router.get('/report/fifo/:medicineId', authMiddleware, saleController.getFIFOReport);

router.get('/user/:userId', authMiddleware, saleController.getSalesByUser);

router.get('/customers/list', authMiddleware, saleController.getCustomersList);

router.get('/:id', authMiddleware, saleController.getSaleById);

router.post('/', authMiddleware, saleController.createSale);

router.put('/:id', authMiddleware, saleController.updateSale);

router.delete('/:id', authMiddleware, saleController.deleteSale);

router.patch('/:id/cancel', authMiddleware, saleController.cancelSale);

module.exports = router;
