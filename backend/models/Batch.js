
const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: [true, 'Medicine ID is required'],
      index: true
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      minlength: [3, 'Batch number must be at least 3 characters'],
      maxlength: [50, 'Batch number cannot exceed 50 characters']
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: 'Expiry date must be in the future'
      }
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
      validate: {
        validator: function(value) {
          return value >= this.purchasePrice;
        },
        message: 'Selling price must be greater than or equal to purchase price'
      }
    },
    profit: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'discarded'],
      default: 'active'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

batchSchema.index({ batchNumber: 1, addedBy: 1 }, { unique: true });

batchSchema.index({ medicineId: 1, expiryDate: 1 });
batchSchema.index({ expiryDate: 1 });
batchSchema.index({ batchNumber: 1 });
batchSchema.index({ status: 1 });

batchSchema.pre('save', function(next) {
  
  this.profit = this.sellingPrice - this.purchasePrice;
  next();
});

batchSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(this.expiryDate);
  expiry.setHours(0, 0, 0, 0);
  
  const timeDiff = expiry.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  return daysDiff;
});

batchSchema.virtual('isNearExpiry').get(function() {
  const remaining = this.daysRemaining;
  return remaining > 0 && remaining <= 30;
});

batchSchema.virtual('isExpired').get(function() {
  return this.daysRemaining < 0;
});

batchSchema.virtual('totalBatchValue').get(function() {
  return this.quantity * this.sellingPrice;
});

batchSchema.virtual('totalProfit').get(function() {
  return this.quantity * this.profit;
});

batchSchema.set('toJSON', { virtuals: true });

batchSchema.statics.getWithMedicine = function(query = {}) {
  return this.find(query).populate('medicineId', 'name manufacturer category');
};

batchSchema.statics.filterByExpiryRange = function(daysRange = 30) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + daysRange * 24 * 60 * 60 * 1000);
  
  return this.find({
    expiryDate: {
      $gte: today,
      $lte: futureDate
    },
    status: 'active'
  });
};

batchSchema.statics.getNearExpiry = function() {
  return this.filterByExpiryRange(30);
};

batchSchema.statics.getExpired = function() {
  return this.find({
    expiryDate: { $lt: new Date() },
    status: { $ne: 'expired' }
  });
};

batchSchema.methods.markAsExpired = function() {
  this.status = 'expired';
  return this.save();
};

batchSchema.methods.getFIFOPriority = function() {
  return this.expiryDate.getTime();
};

module.exports = mongoose.model('Batch', batchSchema);
