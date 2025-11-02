// ticketManager.js
import { Ticket } from './ticketSchema.js';

export class TicketManager {
  constructor() {
    this.tickets = new Map();
    this.verificationCodes = new Set();
  }

  // Generate unique ticket ID
  generateTicketId() {
    return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique verification code
  generateVerificationCode() {
    let code;
    do {
      code = Math.random().toString(36).substr(2, 6).toUpperCase();
    } while (this.verificationCodes.has(code));
    
    this.verificationCodes.add(code);
    return code;
  }

  // Create a new ticket
  createTicket(userId, foodDetails, dateTime) {
    const ticketId = this.generateTicketId();
    const verificationCode = this.generateVerificationCode();
    
    const ticket = new Ticket(
      userId,
      ticketId,
      foodDetails,
      dateTime,
      verificationCode
    );

    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  // Get ticket by ID
  getTicket(ticketId) {
    return this.tickets.get(ticketId);
  }

  // Get tickets by user ID
  getUserTickets(userId) {
    return Array.from(this.tickets.values()).filter(
      ticket => ticket.getUserId() === userId
    );
  }

  // Verify ticket using verification code
  verifyTicket(ticketId, verificationCode) {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return { valid: false, message: 'Ticket not found' };
    }

    if (ticket.getVerificationCode() !== verificationCode) {
      return { valid: false, message: 'Invalid verification code' };
    }

    if (!ticket.isValid()) {
      return { valid: false, message: 'Ticket is no longer valid' };
    }

    return { valid: true, message: 'Ticket verified successfully', ticket };
  }

  // Update ticket status
  updateTicketStatus(ticketId, status) {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      ticket.setStatus(status);
      return true;
    }
    return false;
  }

  // Remove ticket
  removeTicket(ticketId) {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      this.verificationCodes.delete(ticket.getVerificationCode());
    }
    return this.tickets.delete(ticketId);
  }

  // Get all tickets
  getAllTickets() {
    return Array.from(this.tickets.values());
  }

  // Clean up expired tickets
  cleanupExpiredTickets() {
    const now = new Date();
    let expiredCount = 0;

    for (const [ticketId, ticket] of this.tickets.entries()) {
      if (new Date(ticket.getDateTime()) < now || ticket.getStatus() === 'expired') {
        this.removeTicket(ticketId);
        expiredCount++;
      }
    }

    return expiredCount;
  }
}