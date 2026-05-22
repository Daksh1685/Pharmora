
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: true
        },
        medicineName: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1']
        },
        price: {
          type: Number,
          required: [true, 'Price per unit is required'],
          min: [0, 'Price cannot be negative']
        },
        
        batchDetails: [
          {
            batchId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Batch'
            },
            batchNumber: String,
            quantityFromBatch: Number,
            costFromBatch: Number
          }
        ],
        subtotal: {
          type: Number,
          required: true
        }
      }
    ],

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },

    orderId: {
      type: String,
      
    },

    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'store_credit', 'net_banking'],
      default: 'cash'
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'credited'],
      default: 'completed'
    },

    customerName: {
      type: String,
      trim: true
    },

    customerPhone: {
      type: String,
      trim: true
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    customerAddress: {
      type: String,
      trim: true
    },

    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true
    },

    notes: {
      type: String,
      maxlength: 500
    },

    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    status: {
      type: String,
      enum: ['completed', 'cancelled', 'returned'],
      default: 'completed'
    }
  },
  {
    timestamps: true
  }
);

saleSchema.index({ soldBy: 1, createdAt: -1 });
saleSchema.index({ invoiceNumber: 1 });
saleSchema.index({ orderId: 1 });  
saleSchema.index({ customerPhone: 1 });
saleSchema.index({ customerEmail: 1 });
saleSchema.index({ 'medicines.medicineId': 1 });

saleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const timestamp = date.getTime();
    this.invoiceNumber = `INV-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(timestamp).slice(-6)}`;
  }
  next();
});

saleSchema.methods.getTotalQuantity = function() {
  return this.medicines.reduce((total, medicine) => total + medicine.quantity, 0);
};

saleSchema.methods.getUniqueMedicineCount = function() {
  return this.medicines.length;
};

saleSchema.statics.getSalesByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    },
    status: 'completed'
  });
};

saleSchema.statics.getSalesByUser = function(userId) {
  return this.find({ soldBy: userId }).sort({ createdAt: -1 });
};

saleSchema.statics.getTotalRevenue = async function(startDate, endDate) {
  const result = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalSales: { $sum: 1 }
      }
    }
  ]);

  return result.length > 0 ? result[0] : { totalRevenue: 0, totalSales: 0 };
};

saleSchema.statics.getTopSellingMedicines = async function(limit = 10) {
  const result = await this.aggregate([
    { $match: { status: 'completed' } },
    { $unwind: '$medicines' },
    {
      $group: {
        _id: '$medicines.medicineId',
        medicineName: { $first: '$medicines.medicineName' },
        totalQuantity: { $sum: '$medicines.quantity' },
        totalRevenue: { $sum: '$medicines.subtotal' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ]);

  return result;
};

module.exports = mongoose.model('Sale', saleSchema);
