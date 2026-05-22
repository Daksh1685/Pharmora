
const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrPharmacist, adminOnly } = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, batchController.getAllBatches);

router.get('/near-expiry', authMiddleware, batchController.getNearExpiryBatches);

router.get('/status/fifo', authMiddleware, batchController.getFIFOOrder);

router.get('/summary/inventory', authMiddleware, batchController.getInventorySummary);

router.get('/medicine/:medicineId', authMiddleware, batchController.getBatchesByMedicine);

router.post('/', authMiddleware, batchController.addBatch);

router.put('/:id', authMiddleware, batchController.updateBatch);

router.patch('/:id/mark-expired', authMiddleware, batchController.markBatchExpired);

router.delete('/:id', authMiddleware, batchController.deleteBatch);

module.exports = router;
