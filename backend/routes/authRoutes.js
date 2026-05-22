const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  changePassword,
  googleAuth,
  getDevices,
  registerDevice,
  removeDevice,
  removeAllOtherDevices,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/register', register);

router.post('/login', login);

router.post('/google', googleAuth);

router.get('/me', authMiddleware, getMe);

router.post('/logout', authMiddleware, logout);

router.put('/update-profile', authMiddleware, updateProfile);

router.put('/change-password', authMiddleware, changePassword);

router.get('/devices', authMiddleware, getDevices);

router.post('/register-device', authMiddleware, registerDevice);

router.delete('/devices/:deviceId', authMiddleware, removeDevice);

router.post('/remove-all-devices', authMiddleware, removeAllOtherDevices);

module.exports = router;
