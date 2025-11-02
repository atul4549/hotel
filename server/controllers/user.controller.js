// import { generateToken } from "../lib/utils.js";
import jwt from "jsonwebtoken";
// const \\\\\\\
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
// import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // const uploadResponse = await cloudinary.uploader.upload(profilePic);?
    const updatedUser = await User.findByIdAndUpdate(
      userId,
    //   { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// export const checkAuth = async (req, res) => {
// //   try {
// //     res.status(200).json(req.user);
// //   } catch (error) {
// //     console.log("Error in checkAuth controller", error.message);
// //     res.status(500).json({ message: "Internal Server Error" });
// //   }
//   try {
//     // This depends on your session/token setup
//     if (req.session.userId) {
//       const user = await User.findById(req.session.userId).select('-password');
//       return res.json(user);
//     }
    
//     // Or if using JWT tokens in cookies
//     const token = req.cookies.token;
//     if (token) {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const user = await User.findById(decoded.userId).select('-password');
//       return res.json(user);
//     }
    
//     res.status(401).json(null);
//   } catch (error) {
//     console.error('Auth check error:', error);
//     res.status(401).json(null);
//   }
// };
export const checkAuth = async (req, res) => {
  try {
    let user = null;

    // Check for session-based authentication first
    if (req.session && req.session.userId) {
      user = await User.findById(req.session.userId).select('-password');
    }
    // Check for JWT token in cookies
    else if (req.cookies && req.cookies.token) {
      const token = req.cookies.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.userId).select('-password');
    }
    // Check for JWT token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.userId).select('-password');
    }

    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(401).json({ message: "Not authenticated" });
    }

  } catch (error) {
    console.error("Auth check error:", error);
    
    // Clear invalid token cookie if present
    if (req.cookies?.token) {
      res.clearCookie('token');
    }
    
    // Specific error handling
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    return res.status(500).json({ message: "Internal Server Error" });
  }
};