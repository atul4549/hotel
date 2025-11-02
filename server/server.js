import express from "express";
import { connectDB } from "./db.js";
import { FoodRouter } from "./router/food.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PaymentRouter } from "./router/payment.route.js";
import { TicketRouter } from "./router/ticket.routes.js";
import dotenv from "dotenv";
dotenv.config();
// For sessions (if using session-based auth)
import session from 'express-session';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// For parsing cookies (if using cookie-based JWT)
// import cookieParser from 'cookie-parser';
// app.use(cookieParser());

// For parsing JSON bodies
// app.use(express.json());
// import { UserRouter } from "./router/user.routes.js";

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

import authRoutes from "./router/user.routes.js";
app.use("/api/auth", authRoutes);

app.use("/api", FoodRouter);

// Routes
app.use("/api/payments", PaymentRouter);
app.use("/api/tickets", TicketRouter);
// app.use("/api/users", UserRouter);
// Add this to your server.js or app.js
import { router as orderRoutes } from "./router/orders.js";

app.use("/api/orders", orderRoutes);
// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "QR Payment API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// 404 handler with regex
app.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// 404 handler for all methods
// app.all('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// This should be your LAST route
app.use("/", (req, res, next) => {
  // Check if this is an API route that wasn't handled
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "API route not found",
    });
  }
  next(); // Or handle SPA routing if you have a frontend
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        "Database connection established and Server running on port " + PORT
      );
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
