// routes/foodRoutes.js
// const Category = require('../models/Category');
import express from "express"
import { Food } from "../models/foodModel.js";

const router = express.Router();

// Get all foods
router.get("/foods", async (req, res) => {
  try {
    const foods = await Food.find().populate("category");
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Food.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to cart
router.post("/cart", async (req, res) => {
  try {
    const { productId, quantity = 1, userId } = req.body;

    // Validation
    if (!productId || !userId) {
      return res.status(400).json({
        message: "Product ID and User ID are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // Check if product exists (pseudo-code)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock available",
      });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId,
        items: [{ productId, quantity }],
        total: product.price * quantity,
      });
    } else {
      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cart.items.push({ productId, quantity });
      }

      // Recalculate total (you might want a more sophisticated calculation)
      cart.total = cart.items.reduce((total, item) => {
        return total + product.price * item.quantity;
      }, 0);
    }

    await cart.save();

    res.json({
      message: "Item added to cart successfully",
      cart: {
        items: cart.items,
        total: cart.total,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    console.error("Cart error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// routes/foodRoutes.js - Add this route
router.post("/foods", async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      category,
      rating,
      isVegetarian,
      isSpicy,
      ingredients,
      preparationTime,
    } = req.body;

    // Validation
    if (!name || !description || !price || !image || !category) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const food = new Food({
      name,
      description,
      price,
      image,
      category,
      rating: rating || 0,
      isVegetarian: isVegetarian || false,
      isSpicy: isSpicy || false,
      ingredients: ingredients || [],
      preparationTime: preparationTime || 15,
    });

    const savedFood = await food.save();
    await savedFood.populate("category");

    res.status(201).json(savedFood);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }
    res.status(500).json({ message: error.message });
  }
});

//  TODO: more cart end point

// Get cart
router.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.json({ items: [], total: 0, itemCount: 0 });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update cart item quantity
router.put("/cart/item", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = quantity;
    await cart.save();

    res.json({ message: "Cart updated successfully", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove item from cart
router.delete("/cart/item", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );
    await cart.save();

    res.json({ message: "Item removed from cart", cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export { router as FoodRouter };
