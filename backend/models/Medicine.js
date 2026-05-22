
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      minlength: [2, 'Medicine name must be at least 2 characters'],
      maxlength: [100, 'Medicine name cannot exceed 100 characters'],
      index: true
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
      minlength: [2, 'Manufacturer name must be at least 2 characters'],
      maxlength: [100, 'Manufacturer name cannot exceed 100 characters']
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price must be greater than or equal to 0']
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity must be greater than or equal to 0']
    },
    expiryDate: {
      type: Date,
      default: null
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

medicineSchema.index({ category: 1, name: 1 });

medicineSchema.index({ name: 'text', description: 'text' });

medicineSchema.statics.searchByName = function(searchTerm) {
  return this.find({
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ]
  });
};

medicineSchema.statics.filterByCategory = function(category) {
  return this.find({ category });
};

medicineSchema.statics.getPaginated = function(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit
  };
};

module.exports = mongoose.model('Medicine', medicineSchema);
