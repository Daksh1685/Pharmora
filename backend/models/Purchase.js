
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    
    supplierName: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true
    },

    supplierPhone: {
      type: String,
      trim: true
    },

    supplierEmail: {
      type: String,
      trim: true
    },

    supplierAddress: {
      type: String,
      trim: true
    },

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
        batchNumber: {
          type: String,
          required: [true, 'Batch number is required'],
          trim: true
        },
        expiryDate: {
          type: Date,
          required: [true, 'Expiry date is required']
        },
        quantity: {
          type: Number,
          required: [true, 'Quantity is required'],
          min: [1, 'Quantity must be at least 1']
        },
        purchasePrice: {
          type: Number,
          required: [true, 'Purchase price per unit is required'],
          min: [0, 'Purchase price cannot be negative']
        },
        
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Batch'
        },
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

    paymentMethod: {
      type: String,
      enum: ['cash', 'cheque', 'bank_transfer', 'credit', 'online', 'upi', 'card', 'netbanking', 'cod'],
      default: 'bank_transfer'
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },

    purchaseOrderNumber: {
      type: String,
      unique: true,
      sparse: true
    },

    notes: {
      type: String,
      maxlength: 500
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'received', 'rejected', 'returned'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

purchaseSchema.index({ createdBy: 1, createdAt: -1 });
purchaseSchema.index({ purchaseOrderNumber: 1 });
purchaseSchema.index({ supplierName: 1 });
purchaseSchema.index({ 'medicines.medicineId': 1 });

purchaseSchema.pre('save', async function(next) {
  if (!this.purchaseOrderNumber) {
    const date = new Date();
    const timestamp = date.getTime();
    this.purchaseOrderNumber = `PO-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(timestamp).slice(-6)}`;
  }
  next();
});

purchaseSchema.methods.getTotalQuantity = function() {
  return this.medicines.reduce((total, medicine) => total + medicine.quantity, 0);
};

purchaseSchema.methods.getUniqueMedicineCount = function() {
  return this.medicines.length;
};

purchaseSchema.methods.getBatchIds = function() {
  return this.medicines
    .filter(medicine => medicine.batchId)
    .map(medicine => medicine.batchId);
};

module.exports = mongoose.model('Purchase', purchaseSchema);
