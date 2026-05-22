
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const { AppError } = require('../middleware/errorHandler');
const logger = require('./logger');

async function syncMedicineQuantity(medicineId) {
  try {
    const batches = await Batch.find({
      medicineId,
      status: 'active'
    });

    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);

    await Medicine.findByIdAndUpdate(
      medicineId,
      { quantity: totalQuantity },
      { new: true }
    );

    logger.info(`✅ Synced quantity for medicine ${medicineId}: ${totalQuantity} units from ${batches.length} batches`);
    return totalQuantity;
  } catch (error) {
    logger.error(`Error syncing medicine quantity: ${error.message}`);
    
    return 0;
  }
}

async function getFIFOBatches(medicineId) {
  try {
    const batches = await Batch.find({
      medicineId,
      status: 'active',
      quantity: { $gt: 0 } 
    })
      .populate('medicineId', 'name manufacturer')
      .sort({ expiryDate: 1 }); 

    return batches;
  } catch (error) {
    logger.error(`Error fetching FIFO batches for medicine ${medicineId}: ${error.message}`);
    throw new AppError('Failed to fetch available batches', 500);
  }
}

async function processFIFOSale(medicineId, quantityNeeded) {
  try {
    
    const batches = await getFIFOBatches(medicineId);

    let medicineName = medicineId;
    if (batches && batches.length > 0 && batches[0].medicineId?.name) {
      medicineName = batches[0].medicineId.name;
    } else {
      const medicineData = await Medicine.findById(medicineId);
      medicineName = medicineData?.name || medicineId;
    }

    if (!batches || batches.length === 0) {
      throw new AppError(`No available batches for medicine ${medicineName}`, 404);
    }

    const totalAvailable = batches.reduce((sum, batch) => sum + batch.quantity, 0);

    if (totalAvailable < quantityNeeded) {
      throw new AppError(
        `Insufficient stock for medicine ${medicineName}. Available: ${totalAvailable}, Requested: ${quantityNeeded}`,
        400
      );
    }

    const batchDetails = [];
    const usedBatches = [];
    let remainingQuantity = quantityNeeded;
    let totalCost = 0;

    for (const batch of batches) {
      if (remainingQuantity === 0) break;

      const quantityFromBatch = Math.min(remainingQuantity, batch.quantity);
      const costFromBatch = quantityFromBatch * batch.sellingPrice;

      batchDetails.push({
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysRemaining: batch.daysRemaining,
        quantityFromBatch,
        pricePerUnit: batch.sellingPrice,
        costFromBatch
      });

      batch.quantity -= quantityFromBatch;
      await batch.save();

      usedBatches.push({
        batchId: batch._id,
        updatedQuantity: batch.quantity
      });

      totalCost += costFromBatch;
      remainingQuantity -= quantityFromBatch;

      logger.debug(
        `FIFO: Deducted ${quantityFromBatch} from batch ${batch.batchNumber}, Remaining in batch: ${batch.quantity}`
      );
    }

    await syncMedicineQuantity(medicineId);

    return {
      batchDetails,
      totalCost,
      usedBatches,
      quantitySold: quantityNeeded
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error(`Error processing FIFO sale: ${error.message}`);
    throw new AppError('Failed to process FIFO sale', 500);
  }
}

async function validateSaleFeasibility(medicines) {
  try {
    const validationDetails = [];

    for (const medicine of medicines) {
      const batches = await getFIFOBatches(medicine.medicineId);
      const totalAvailable = batches.reduce((sum, batch) => sum + batch.quantity, 0);

      const isSufficient = totalAvailable >= medicine.quantity;

      let medicineName = medicine.medicineId;
      if (batches && batches.length > 0 && batches[0].medicineId?.name) {
        medicineName = batches[0].medicineId.name;
      } else {
        const medicineData = await Medicine.findById(medicine.medicineId);
        medicineName = medicineData?.name || medicine.medicineId;
      }

      validationDetails.push({
        medicineId: medicine.medicineId,
        medicineName,
        requested: medicine.quantity,
        available: totalAvailable,
        isSufficient
      });

      if (!isSufficient) {
        return {
          isValid: false,
          message: `Insufficient stock for medicine ${medicineName}. Available: ${totalAvailable}, Requested: ${medicine.quantity}`,
          details: validationDetails
        };
      }
    }

    return {
      isValid: true,
      message: 'All medicines have sufficient stock',
      details: validationDetails
    };
  } catch (error) {
    logger.error(`Error validating sale feasibility: ${error.message}`);
    throw new AppError('Failed to validate sale', 500);
  }
}

async function getFIFOAnalysis(medicineId, quantity) {
  try {
    const batches = await getFIFOBatches(medicineId);

    if (batches.length === 0) {
      throw new AppError('No available batches', 404);
    }

    const analysis = {
      medicineId,
      quantityRequested: quantity,
      batches: [],
      recommendations: []
    };

    let remaining = quantity;
    let priority = 1;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const qtyFromBatch = Math.min(remaining, batch.quantity);

      analysis.batches.push({
        fifoRank: priority,
        batchNumber: batch.batchNumber,
        availableQuantity: batch.quantity,
        expiryDate: batch.expiryDate,
        daysRemaining: batch.daysRemaining,
        willUse: qtyFromBatch,
        costTotal: qtyFromBatch * batch.sellingPrice,
        urgency: batch.daysRemaining <= 7 ? 'CRITICAL' : batch.daysRemaining <= 30 ? 'HIGH' : 'NORMAL'
      });

      if (batch.daysRemaining <= 7) {
        analysis.recommendations.push(
          `Batch ${batch.batchNumber} expires in ${batch.daysRemaining} days - URGENT CLEARANCE`
        );
      }

      remaining -= qtyFromBatch;
      priority++;
    }

    analysis.canFullfillRequest = remaining === 0;
    analysis.totalCost = batches
      .slice(0, priority - 1)
      .reduce((sum, batch, idx) => sum + (Math.min(analysis.batches[idx].willUse, batch.quantity) * batch.sellingPrice), 0);

    return analysis;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error(`Error getting FIFO analysis: ${error.message}`);
    throw new AppError('Failed to analyze FIFO', 500);
  }
}

async function rollbackSale(usedBatches, batchDetails) {
  try {
    let medicineId = null;

    for (let i = 0; i < batchDetails.length; i++) {
      const detail = batchDetails[i];
      const batch = await Batch.findById(detail.batchId);

      if (batch) {
        medicineId = batch.medicineId; 
        batch.quantity += detail.quantityFromBatch;
        await batch.save();
        logger.info(`Rolled back ${detail.quantityFromBatch} units to batch ${detail.batchNumber}`);
      }
    }

    if (medicineId) {
      await syncMedicineQuantity(medicineId);
    }

    return { success: true, message: 'Sale rolled back successfully' };
  } catch (error) {
    logger.error(`Error rolling back sale: ${error.message}`);
    throw new AppError('Failed to rollback sale', 500);
  }
}

async function generateFIFOReport(medicineId) {
  try {
    const batches = await getFIFOBatches(medicineId);

    const report = {
      medicineId,
      totalBatches: batches.length,
      totalStock: 0,
      totalValue: 0,
      expiryTimeline: [],
      fifoSequence: []
    };

    batches.forEach((batch, index) => {
      const batchValue = batch.quantity * batch.sellingPrice;
      report.totalStock += batch.quantity;
      report.totalValue += batchValue;

      report.fifoSequence.push({
        fifoRank: index + 1,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        expiryDate: batch.expiryDate,
        daysRemaining: batch.daysRemaining,
        batchValue,
        priority: batch.daysRemaining <= 7 ? '🔴 CRITICAL' : batch.daysRemaining <= 30 ? '🟡 HIGH' : '🟢 NORMAL'
      });

      report.expiryTimeline.push({
        daysFromNow: batch.daysRemaining,
        batchNumber: batch.batchNumber,
        quantity: batch.quantity
      });
    });

    report.expiryTimeline.sort((a, b) => a.daysFromNow - b.daysFromNow);

    return report;
  } catch (error) {
    logger.error(`Error generating FIFO report: ${error.message}`);
    throw new AppError('Failed to generate report', 500);
  }
}

module.exports = {
  syncMedicineQuantity,
  getFIFOBatches,
  processFIFOSale,
  validateSaleFeasibility,
  getFIFOAnalysis,
  rollbackSale,
  generateFIFOReport
};
