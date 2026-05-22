
const express = require('express');
const {
  getNotifications,
  getNotificationsByType,
  markAsRead,
  markMultipleAsRead,
  resolveNotificationEndpoint,
  deleteNotification,
  getNotificationSummary,
  manualInventoryCheck,
  clearResolvedNotifications
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNotifications);

router.get('/dashboard/summary', getNotificationSummary);

router.get('/type/:type', getNotificationsByType);

router.patch('/:id/read', markAsRead);

router.patch('/read-multiple', markMultipleAsRead);

router.patch('/:id/resolve', resolveNotificationEndpoint);

router.post(
  '/check-inventory',
  adminOnly,
  manualInventoryCheck
);

router.delete(
  '/:id',
  adminOnly,
  deleteNotification
);

router.delete(
  '/clear-resolved',
  adminOnly,
  clearResolvedNotifications
);

module.exports = router;
