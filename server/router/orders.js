// routes/orders.js
import express from 'express';
const router = express.Router();
import { Order } from '../models/Order.js';
import { Food } from '../models/foodModel.js';
// import {auth} from '../middleware/auth.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', /*auth,*/ async (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      paymentMethod,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({ 
        success: false,
        message: 'Order items are required' 
      });
    }

    if (!deliveryAddress || !paymentMethod) {
      return res.status(400).json({ 
        success: false,
        message: 'Delivery address and payment method are required' 
      });
    }

    // Calculate totals and validate items
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const food = await Food.findById(item.foodId);
      
      if (!food) {
        return res.status(404).json({ 
          success: false,
          message: `Food item not found: ${item.foodId}` 
        });
      }

      if (!food.inStock) {
        return res.status(422).json({ 
          success: false,
          message: `Item out of stock: ${food.name}` 
        });
      }

      if (food.price !== item.price) {
        return res.status(400).json({ 
          success: false,
          message: `Price mismatch for ${food.name}` 
        });
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        foodId: food._id,
        name: food.name,
        price: food.price,
        quantity: item.quantity,
        image: food.image
      });
    }

    // Calculate tax (8%) and delivery fee
    const tax = subtotal * 0.08;
    const deliveryFee = subtotal > 25 ? 0 : 3.99; // Free delivery over $25
    const total = subtotal + tax + deliveryFee;

    // Create order
    const order = new Order({
      userId: req.user.id,
      items: orderItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      deliveryAddress,
      paymentMethod,
      specialInstructions: specialInstructions || '',
      status: 'pending',
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid'
    });

    const savedOrder = await order.save();

    // Update food item stock (in a real app, you might want to handle this differently)
    for (const item of items) {
      await Food.findByIdAndUpdate(item.foodId, { 
        $inc: { stock: -item.quantity } 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating order',
      error: error.message 
    });
  }
});

// @desc    Get user's orders
// @route   GET /api/orders/my-orders
// @access  Private
router.get('/my-orders', /*auth,*/ async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    const total = await Order.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching orders',
      error: error.message 
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', /*auth,*/ async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('items.foodId', 'name description');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check if user owns the order or is admin
    if (order.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching order',
      error: error.message 
    });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Admin/Owner)
router.put('/:id/status', /*auth,*/ async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check permissions
    if (order.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Update status and set deliveredAt if status is delivered
    const updateData = { status };
    if (status === 'delivered' && order.status !== 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating order status',
      error: error.message 
    });
  }
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', /*auth,*/ async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check if user owns the order
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    // Restore food item stock
    for (const item of order.items) {
      await Food.findByIdAndUpdate(item.foodId, { 
        $inc: { stock: item.quantity } 
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error cancelling order',
      error: error.message 
    });
  }
});

// @desc    Quick order (single item)
// @route   POST /api/orders/quick
// @access  Private
// import { authenticateUser } from '../middleware/auth.js';

router.post('/quick', /*authenticateUser, /*auth,*/ async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;

    if (!items || !items.length || items.length > 1) {
      return res.status(400).json({ 
        success: false,
        message: 'Quick order can only contain one item' 
      });
    }

    // Reuse the main order creation logic
    const orderResponse = await createOrder(
      // req.user.clerkId,
      items,
      deliveryAddress,
      paymentMethod,
      req.body.specialInstructions
    );

    res.status(201).json({
      success: true,
      message: 'Quick order placed successfully',
      order: orderResponse
    });
  } catch (error) {
    console.error('Quick order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating quick order',
      error: error.message 
    });
  }
});

// Helper function for order creation (extracted from the POST route)
// async function createOrder(userId, items, deliveryAddress, paymentMethod, specialInstructions = '') {
//   // Calculate totals and validate items
//   let subtotal = 0;
//   const orderItems = [];

//   for (const item of items) {
//     const food = await Food.findById(item.foodId);
    
//     if (!food) {
//       throw new Error(`Food item not found: ${item.foodId}`);
//     }

//     if (!food.inStock) {
//       throw new Error(`Item out of stock: ${food.name}`);
//     }

//     if (food.price !== item.price) {
//       throw new Error(`Price mismatch for ${food.name}`);
//     }

//     const itemTotal = item.price * item.quantity;
//     subtotal += itemTotal;

//     orderItems.push({
//       foodId: food._id,
//       name: food.name,
//       price: food.price,
//       quantity: item.quantity,
//       image: food.image
//     });
//   }

//   // Calculate tax (8%) and delivery fee
//   const tax = subtotal * 0.08;
//   const deliveryFee = subtotal > 25 ? 0 : 3.99;
//   const total = subtotal + tax + deliveryFee;

//   // Create order
//   const order = new Order({
//     userId,
//     items: orderItems,
//     subtotal: parseFloat(subtotal.toFixed(2)),
//     tax: parseFloat(tax.toFixed(2)),
//     deliveryFee: parseFloat(deliveryFee.toFixed(2)),
//     total: parseFloat(total.toFixed(2)),
//     deliveryAddress,
//     paymentMethod,
//     specialInstructions,
//     status: 'pending',
//     paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid'
//   });

//   const savedOrder = await order.save();

//   // Update food item stock
//   for (const item of items) {
//     await Food.findByIdAndUpdate(item.foodId, { 
//       $inc: { stock: -item.quantity } 
//     });
//   }

//   return savedOrder;
// }
// In your order service/controller
const createOrder = async (clerkUserId, items, deliveryAddress, paymentMethod, specialInstructions) => {
  try {
    // Find or create user in your database using Clerk ID
    let user = await User.findOne({ clerkId: clerkUserId });
    
    if (!user) {
      // Create new user record if doesn't exist
      user = await User.create({
        clerkId: clerkUserId,
        // You might want to fetch additional user info from Clerk API
        // or store it during user registration
      });
    }

    // Create order with the database user ID
    const order = await Order.create({
      user: user._id, // Your database user ID
      items,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      status: 'pending'
    });

    return await order.populate('user', 'name email');
  } catch (error) {
    throw error;
  }

};



export const quickOrderHandler = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;

    if (!items || !items.length || items.length > 1) {
      return res.status(400).json({ 
        success: false,
        message: 'Quick order can only contain one item' 
      });
    }

    // Reuse the main order creation logic
    const orderResponse = await createOrder(
      req.user.id,
      items,
      deliveryAddress,
      paymentMethod,
      req.body.specialInstructions
    );

    res.status(201).json({
      success: true,
      message: 'Quick order placed successfully',
      order: orderResponse
    });
  } catch (error) {
    console.error('Quick order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating quick order',
      error: error.message 
    });
  }
};

export {router};