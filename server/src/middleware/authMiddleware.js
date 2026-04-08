import { getAuth } from '../config/firebase.js';

// Protect routes - verify Firebase Auth JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      
      // Look up full user record to check custom claims or assign base fields
      const userRecord = await auth.getUser(decodedToken.uid);

      req.user = {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        role: userRecord.customClaims?.role || 'user'
      };
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, Firebase token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

// Check if user is verified (Optional based on your logic)
const verified = (req, res, next) => {
  if (req.user && (req.user.emailVerified || req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Please verify your email to access this resource');
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

// Super Admin middleware
const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a super admin');
  }
};

export { protect, verified, admin, superAdmin };
