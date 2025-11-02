// // ticketSchema.js
// export class Ticket {
//   constructor(userId, ticketId, foodDetails, dateTime, verificationCode) {
//     this.userId = userId;
//     this.ticketId = ticketId;
//     this.foodDetails = foodDetails;
//     this.dateTime = dateTime;
//     this.verificationCode = verificationCode;
//     this.status = 'active'; // additional field for ticket status
//     this.createdAt = new Date();
//   }

import mongoose from "mongoose";

//   // Getters
//   getUserId() {
//     return this.userId;
//   }

//   getTicketId() {
//     return this.ticketId;
//   }

//   getFoodDetails() {
//     return this.foodDetails;
//   }

//   getDateTime() {
//     return this.dateTime;
//   }

//   getVerificationCode() {
//     return this.verificationCode;
//   }

//   getStatus() {
//     return this.status;
//   }

//   // Setters
//   setFoodDetails(foodDetails) {
//     this.foodDetails = foodDetails;
//   }

//   setDateTime(dateTime) {
//     this.dateTime = dateTime;
//   }

//   setStatus(status) {
//     this.status = status;
//   }

//   // Utility methods
//   isValid() {
//     return this.status === 'active' && new Date(this.dateTime) > new Date();
//   }

//   toJSON() {
//     return {
//       userId: this.userId,
//       ticketId: this.ticketId,
//       foodDetails: this.foodDetails,
//       dateTime: this.dateTime,
//       verificationCode: this.verificationCode,
//       status: this.status,
//       createdAt: this.createdAt
//     };
//   }

//   toString() {
//     return `Ticket ${this.ticketId} for User ${this.userId}`;
//   }
// }


const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  productDetails: {
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    }
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'refunded'],
    default: 'confirmed'
  },
  qrCodeData: {
    type: String
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  }
});

export const Ticket = mongoose.model('Ticket', ticketSchema);
