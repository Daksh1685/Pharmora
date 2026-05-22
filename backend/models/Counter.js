
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['orderId']
    },
    sequence: {
      type: Number,
      default: 1000
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

counterSchema.index({ name: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
