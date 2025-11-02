
import {Payment} from'../models/paymentSchema.js';
import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '../models/ticketSchema.js';

// import {Tickent } from "../models/ticketSchema.js"
// Generate ticket
export const generateTicket = async (req, res) => {
  try {
    const {
      userId,
      paymentId,
      productDetails,
      amount,
      currency = 'INR'
    } = req.body;

    // Verify that payment exists and is successful
    const payment = await Payment.findOne({ paymentId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate ticket for unsuccessful payment'
      });
    }

    // Check if ticket already exists for this payment
    const existingTicket = await Ticket.findOne({ paymentId });
    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already exists for this payment'
      });
    }

    const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const ticket = new Ticket({
      ticketNumber,
      userId,
      paymentId,
      productDetails,
      amount,
      currency,
      issueDate: new Date(),
      qrCodeData: `ticket:${ticketNumber}:${paymentId}:${userId}`
    });

    const savedTicket = await ticket.save();

    res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      data: savedTicket
    });
  } catch (error) {
    console.error('Generate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate ticket',
      error: error.message
    });
  }
};

// Get ticket by ticket number
export const getTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findOne({ ticketNumber });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ticket',
      error: error.message
    });
  }
};

// Get all tickets for a user
export const getUserTickets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const tickets = await Ticket.find({ userId })
      .sort({ issueDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments({ userId });

    res.json({
      success: true,
      data: tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTickets: total
      }
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user tickets',
      error: error.message
    });
  }
};

// Validate ticket
export const validateTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await Ticket.findOne({ ticketNumber });
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        valid: false
      });
    }

    if (ticket.status !== 'confirmed') {
      return res.json({
        success: false,
        message: `Ticket is ${ticket.status}`,
        valid: false,
        data: ticket
      });
    }

    if (new Date() > ticket.expiresAt) {
      return res.json({
        success: false,
        message: 'Ticket has expired',
        valid: false,
        data: ticket
      });
    }

    res.json({
      success: true,
      message: 'Ticket is valid',
      valid: true,
      data: ticket
    });
  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate ticket',
      error: error.message
    });
  }
};