
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrPharmacist, authenticated } = require('../middleware/roleMiddleware');

router.post('/chat', authMiddleware, authenticated, aiController.chatWithAI);

router.post('/analyze-stock', authMiddleware, authenticated, aiController.analyzeStock);

router.post('/suggest-reorder', authMiddleware, authenticated, aiController.suggestReorder);

router.post('/expiry-alert', authMiddleware, authenticated, aiController.expiryAlert);

router.get('/health', aiController.getAIHealth);

module.exports = router;
