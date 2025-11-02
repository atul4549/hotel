// const express = require('express');
import express from "express"
const router = express.Router();
import { 
  generateTicket, 
  getTicket, 
  getUserTickets, 
  validateTicket 
} from '../controllers/ticketController.js';
import { validateTicket as validateTicketInput } from '../middleware/middleware.js';

// const { authenticateToken } = require('../middleware/auth');

router.post('/', validateTicketInput, generateTicket);
router.get('/:ticketNumber', getTicket);
router.get('/validate/:ticketNumber', validateTicket);
import { clerkMiddleware  } from '@clerk/express';

// router.get('/user/:userId', authenticateToken, getUserTickets);
router.get('/user/:userId',  clerkMiddleware (), getUserTickets);

// module.exports = router;
export {router as TicketRouter}