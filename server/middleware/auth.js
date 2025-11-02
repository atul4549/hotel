// middleware/auth.js
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token with Clerk
    const session = await clerkClient.verifyToken(token);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(session.sub);
    
    // Attach user info to request
    req.user = {
      clerkId: session.sub,
      email: user.primaryEmailAddress?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export { authenticateUser };