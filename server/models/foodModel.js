// models/Food.js
// const mongoose = require('mongoose');
import mongoose from 'mongoose'
const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  // category: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Category',
  //   required: true
  // },
  category: { type: String, required: true }, // Change from ObjectId to String
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  inStock:{
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  ingredients: [String],
  preparationTime: {
    type: Number, // in minutes
    default: 15
  }
}, {
  timestamps: true
});








// models/Category.js
// // const mongoose = require('mongoose');

// const categorySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   description: String,
//   image: String
// }, {
//   timestamps: true
// });

// export const Category = mongoose.model('Category', categorySchema);


const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  total: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


export const Food = mongoose.model('Food', foodSchema);
export const Cart = mongoose.model('Cart', cartSchema);



