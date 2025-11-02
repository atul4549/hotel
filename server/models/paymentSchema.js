// const mongoose = require('mongoose');
import mongoose from "mongoose"
const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['initiated', 'processing', 'success', 'failed', 'cancelled'],
    default: 'initiated'
  },
  upiTransactionId: {
    type: String
  },
  upiId: {
    type: String
  },
  productDetails: {
    name: String,
    description: String,
    quantity: Number,
    price: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  failureReason: {
    type: String
  }
});

paymentSchema.pre('save', function(next) {
  if (this.status === 'success' || this.status === 'failed') {
    this.completedAt = new Date();
  }
  next();
});

// const mongoose = require('mongoose');


export const Payment = mongoose.model('Payment', paymentSchema);




