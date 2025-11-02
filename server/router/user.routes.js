// // const express = require('express');
// import express from "express"
// const router = express.Router();
// import  { 
//   getUser, 
//   createUser, 
//   updateUser 
// } from '../controllers/user.controller.js';
// // const { authenticateToken } = require('../middleware/auth');

// router.post('/', createUser);
// router.get('/:userId', authenticateToken, getUser);
// router.put('/:userId', authenticateToken, updateUser);

// // module.exports = router;
// export {router as UserRouter}
import express from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;