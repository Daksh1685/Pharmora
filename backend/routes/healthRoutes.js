const express = require('express');
const router = express.Router();
const { getHealth, getDetailedHealth } = require('../controllers/healthController');

router.get('/', getHealth);

router.get('/detailed', getDetailedHealth);

module.exports = router;
