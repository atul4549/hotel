// const Payment = require('../models/Payment');
import { v4 as uuidv4 } from 'uuid';
import {Payment} from "../models/paymentSchema.js"

// Create new payment
export const createPayment = async (req, res) => {
  try {
    const {
      userId,
      amount,
      currency = 'INR',
      upiId,
      productDetails,
      status = 'initiated'
    } = req.body;

    const paymentId = `pay_${uuidv4().split('-')[0]}`;

    const payment = new Payment({
      paymentId,
      userId,
      amount,
      currency,
      upiId,
      productDetails,
      status,
      timestamp: new Date()
    });

    const savedPayment = await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: savedPayment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Simulate payment verification logic
    // In real implementation, this would integrate with UPI payment gateway
    const isVerified = Math.random() > 0.2; // 80% success rate for simulation

    if (isVerified) {
      payment.status = 'success';
      payment.upiTransactionId = `upi_${uuidv4().split('-')[0]}`;
      payment.completedAt = new Date();
      await payment.save();

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: payment
      });
    } else {
      payment.status = 'failed';
      payment.failureReason = 'Transaction declined by bank';
      payment.completedAt = new Date();
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: payment
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

// Get payment by ID
export const getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment',
      error: error.message
    });
  }
};

// Get all payments for a user
export const getUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ userId });

    res.json({
      success: true,
      data: payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total
      }
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user payments',
      error: error.message
    });
  }
};