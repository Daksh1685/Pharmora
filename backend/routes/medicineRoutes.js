
const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOrPharmacist, adminOnly } = require('../middleware/roleMiddleware');

router.get('/', authMiddleware, medicineController.getAllMedicines);

router.get('/search', authMiddleware, medicineController.searchMedicines);

router.get('/category/:category', authMiddleware, medicineController.getMedicinesByCategory);

router.get('/:id', authMiddleware, medicineController.getMedicineById);

router.post('/', authMiddleware, medicineController.addMedicine);

router.put(
  '/:id',
  authMiddleware,
  medicineController.updateMedicine
);

router.delete('/:id', authMiddleware, medicineController.deleteMedicine);

module.exports = router;
