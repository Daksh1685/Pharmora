
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const {
  checkLowStockAlert,
  checkExpiryAlert,
  runDailyInventoryChecks,
  resolveNotification
} = require('../utils/notificationUtils');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { isRead, type, priority, resolved, page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const filter = {};
  if (isRead !== undefined) filter.isRead = isRead === 'true';
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (resolved !== undefined) filter.resolved = resolved === 'true';

  const total = await Notification.countDocuments(filter);

  const notifications = await Notification.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('medicineId', 'name')
    .populate('batchId', 'batchNumber expiryDate')
    .lean();

  const unreadCount = await Notification.countDocuments({ isRead: false });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Notifications retrieved successfully',
    data: {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      summary: {
        unreadCount,
        lowStockAlerts: await Notification.countDocuments({ type: 'LOW_STOCK', resolved: false }),
        expiryAlerts: await Notification.countDocuments({ type: 'EXPIRY', resolved: false })
      }
    }
  });
});

exports.getNotificationsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { resolved = false } = req.query;

  const validTypes = ['LOW_STOCK', 'EXPIRY', 'GENERAL'];
  if (!validTypes.includes(type)) {
    throw new AppError(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`, 400);
  }

  const filter = { type, resolved: resolved === 'true' };

  const notifications = await Notification.find(filter)
    .sort('-createdAt')
    .populate('medicineId', 'name')
    .populate('batchId', 'batchNumber')
    .lean();

  const stats = {
    total: notifications.length,
    critical: notifications.filter(n => n.priority === 'CRITICAL').length,
    high: notifications.filter(n => n.priority === 'HIGH').length,
    medium: notifications.filter(n => n.priority === 'MEDIUM').length,
    low: notifications.filter(n => n.priority === 'LOW').length,
    unread: notifications.filter(n => !n.isRead).length
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `${type} notifications retrieved successfully`,
    data: {
      type,
      notifications,
      statistics: stats
    }
  });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  ).populate('medicineId', 'name');

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  logger.info(`Notification ${id} marked as read`);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Notification marked as read',
    data: notification
  });
});

exports.markMultipleAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new AppError('notificationIds must be a non-empty array', 400);
  }

  const result = await Notification.updateMany(
    { _id: { $in: notificationIds } },
    { isRead: true }
  );

  logger.info(`${result.modifiedCount} notifications marked as read`);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `${result.modifiedCount} notifications marked as read`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});

exports.resolveNotificationEndpoint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await resolveNotification(id, userId);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Notification resolved',
    data: notification
  });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findByIdAndDelete(id);

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  logger.info(`Notification ${id} deleted`);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Notification deleted successfully'
  });
});

exports.getNotificationSummary = asyncHandler(async (req, res) => {
  
  const summary = await Notification.aggregate([
    {
      $facet: {
        byType: [
          { $match: { resolved: false } },
          { $group: { _id: '$type', count: { $sum: 1 } } }
        ],
        byPriority: [
          { $match: { resolved: false } },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        unread: [
          { $match: { isRead: false, resolved: false } },
          { $count: 'count' }
        ],
        total: [
          { $count: 'count' }
        ]
      }
    }
  ]);

  const result = {
    unreadCount: summary[0].unread[0]?.count || 0,
    totalCount: summary[0].total[0]?.count || 0,
    byType: {},
    byPriority: {}
  };

  summary[0].byType.forEach(item => {
    result.byType[item._id] = item.count;
  });

  summary[0].byPriority.forEach(item => {
    result.byPriority[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Notification summary retrieved',
    data: result
  });
});

exports.manualInventoryCheck = asyncHandler(async (req, res) => {
  logger.info('Manual inventory check triggered');

  const result = await runDailyInventoryChecks();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Inventory checks completed',
    data: {
      checksRun: {
        lowStockAlerts: result.lowStockAlerts,
        expiryAlerts: result.expiryAlerts,
        totalNotifications: result.totalNotifications
      },
      timestamp: new Date().toISOString()
    }
  });
});

exports.clearResolvedNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ resolved: true });

  logger.info(`${result.deletedCount} resolved notifications cleared`);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Resolved notifications cleared',
    data: {
      deletedCount: result.deletedCount
    }
  });
});
