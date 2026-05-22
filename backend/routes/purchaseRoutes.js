
const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrPharmacist, adminOnly } = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, purchaseController.getPurchases);

router.get('/:id', authMiddleware, purchaseController.getPurchaseById);

router.get('/supplier/:supplierName', authMiddleware, purchaseController.getPurchasesBySupplier);

router.get('/analytics/summary', authMiddleware, purchaseController.getPurchaseAnalytics);

router.post('/', authMiddleware, adminOrPharmacist, purchaseController.createPurchase);

router.put('/:id', authMiddleware, adminOrPharmacist, purchaseController.updatePurchase);

router.delete('/:id', authMiddleware, adminOnly, purchaseController.deletePurchase);

module.exports = router;
