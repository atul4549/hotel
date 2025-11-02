// const express = require('express');
import express from 'express'
const router = express.Router();
import { 
  createPayment, 
  verifyPayment, 
  getPayment, 
  getUserPayments 
} from '../controllers/paymentController.js';
import { validatePayment } from '../middleware/middleware.js';
// const { validatePayment } = require('../middleware/validation');
// const { authenticateToken } = require('../middleware/auth');

// Public routes (for payment initiation)
router.post('/', validatePayment, createPayment);
router.get('/:paymentId/verify', verifyPayment);

// Protected routes
// router.get('/:paymentId', authenticateToken, getPayment);
// router.get('/user/:userId', authenticateToken, getUserPayments);
import { clerkMiddleware  } from '@clerk/express';

// Use Clerk's built-in middleware
router.get('/:paymentId', clerkMiddleware (), getPayment);
router.get('/user/:userId', clerkMiddleware (), getUserPayments);
// module.exports = router;

export{router as PaymentRouter}