
const Notification = require('../models/Notification');
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const logger = require('./logger');

async function checkLowStockAlert(medicineId, currentStock, threshold) {
  try {
    
    const existingNotification = await Notification.findOne({
      medicineId,
      type: 'LOW_STOCK',
      isRead: false,
      resolved: false
    });

    if (existingNotification) {
      logger.info(`Low stock notification already exists for medicine ${medicineId}`);
      return existingNotification;
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      logger.error(`Medicine not found: ${medicineId}`);
      return null;
    }

    const notification = await Notification.create({
      type: 'LOW_STOCK',
      title: `Low Stock Alert: ${medicine.name}`,
      message: `${medicine.name} stock is critically low. Current: ${currentStock} units, Threshold: ${threshold} units. Please reorder immediately.`,
      medicineId,
      medicineName: medicine.name,
      currentStock,
      threshold,
      priority: currentStock <= 5 ? 'CRITICAL' : currentStock <= 10 ? 'HIGH' : 'MEDIUM',
      targetRole: 'All'
    });

    logger.info(`✓ Low stock notification created for ${medicine.name}`);
    return notification;
  } catch (error) {
    logger.error(`Error creating low stock notification: ${error.message}`);
    throw error;
  }
}

async function checkExpiryAlert(batchId) {
  try {
    
    const batch = await Batch.findById(batchId).populate('medicineId');
    if (!batch) {
      logger.error(`Batch not found: ${batchId}`);
      return null;
    }

    if (batch.daysRemaining > 30) {
      return null;
    }

    const existingNotification = await Notification.findOne({
      batchId,
      type: 'EXPIRY',
      isRead: false,
      resolved: false
    });

    if (existingNotification) {
      logger.info(`Expiry notification already exists for batch ${batchId}`);
      return existingNotification;
    }

    const medicine = batch.medicineId;

    let priority = 'MEDIUM';
    if (batch.daysRemaining <= 5) {
      priority = 'CRITICAL';
    } else if (batch.daysRemaining <= 15) {
      priority = 'HIGH';
    }

    const notification = await Notification.create({
      type: 'EXPIRY',
      title: `Expiry Alert: ${medicine.name} (Batch ${batch.batchNumber})`,
      message: `${medicine.name} (Batch: ${batch.batchNumber}) expires in ${batch.daysRemaining} days (${batch.expiryDate.toLocaleDateString()}). Stock: ${batch.quantity} units. Plan clearance/disposal immediately.`,
      medicineId: medicine._id,
      medicineName: medicine.name,
      batchId,
      daysToExpiry: batch.daysRemaining,
      priority,
      targetRole: 'All'
    });

    logger.info(`✓ Expiry notification created for ${medicine.name} - Batch ${batch.batchNumber}`);
    return notification;
  } catch (error) {
    logger.error(`Error creating expiry notification: ${error.message}`);
    throw error;
  }
}

async function checkAllExpiryAlerts() {
  try {
    logger.info('Starting batch expiry check...');

    const expiringBatches = await Batch.find({
      status: 'active',
      daysRemaining: { $lte: 30, $gt: 0 }
    });

    logger.info(`Found ${expiringBatches.length} batches expiring within 30 days`);

    let notificationsCreated = 0;
    for (const batch of expiringBatches) {
      const notification = await checkExpiryAlert(batch._id);
      if (notification) {
        notificationsCreated++;
      }
    }

    logger.info(`Expiry check complete: ${notificationsCreated} new notifications created`);
    return notificationsCreated;
  } catch (error) {
    logger.error(`Error in batch expiry check: ${error.message}`);
    throw error;
  }
}

async function checkAllLowStockAlerts() {
  try {
    logger.info('Starting batch low stock check...');

    const medicines = await Medicine.find({ status: 'active' });

    logger.info(`Checking ${medicines.length} medicines for low stock...`);

    let notificationsCreated = 0;
    for (const medicine of medicines) {
      
      const batches = await Batch.find({
        medicineId: medicine._id,
        status: 'active'
      });

      const totalStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);

      if (totalStock > 0 && totalStock <= medicine.minimumStock) {
        const notification = await checkLowStockAlert(
          medicine._id,
          totalStock,
          medicine.minimumStock
        );
        if (notification) {
          notificationsCreated++;
        }
      }
    }

    logger.info(`Low stock check complete: ${notificationsCreated} new notifications created`);
    return notificationsCreated;
  } catch (error) {
    logger.error(`Error in batch low stock check: ${error.message}`);
    throw error;
  }
}

async function runDailyInventoryChecks() {
  try {
    logger.info('═══════════════════════════════════════');
    logger.info('DAILY INVENTORY NOTIFICATION CHECK');
    logger.info('═══════════════════════════════════════');

    const expiryCount = await checkAllExpiryAlerts();
    const lowStockCount = await checkAllLowStockAlerts();

    logger.info(`Total notifications created: ${expiryCount + lowStockCount}`);
    logger.info('═══════════════════════════════════════\n');

    return {
      expiryAlerts: expiryCount,
      lowStockAlerts: lowStockCount,
      totalNotifications: expiryCount + lowStockCount
    };
  } catch (error) {
    logger.error(`Error in daily inventory checks: ${error.message}`);
    throw error;
  }
}

async function resolveNotification(notificationId, userId) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId
      },
      { new: true }
    );

    logger.info(`Notification ${notificationId} resolved`);
    return notification;
  } catch (error) {
    logger.error(`Error resolving notification: ${error.message}`);
    throw error;
  }
}

module.exports = {
  checkLowStockAlert,
  checkExpiryAlert,
  checkAllExpiryAlerts,
  checkAllLowStockAlerts,
  runDailyInventoryChecks,
  resolveNotification
};
