import { getFirestoreDb, getAuth } from '../config/firebase.js';

// ** Notice: Under Firebase architecture, users usually register and login directly
// on the frontend client using the Firebase Client SDK. The backend validates 
// the token via authMiddleware.js.
// These routes remain for compatibility or manual backend creation.

// @desc    Register a new user (Creates in Firestore)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const db = getFirestoreDb();
  
  try {
    // Check if exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      res.status(400);
      throw new Error('User already exists in Firestore');
    }
    
    // In a pure Firebase setup, you should use admin.auth().createUser()
    // For this compatibility wrapper, we just store it in Firestore:
    const docRef = await usersRef.add({
      name,
      email,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    
    res.status(201).json({
      _id: docRef.id,
      name,
      email,
      role: 'user',
      message: 'Account created. Please login via Firebase client.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Auth user (Mock/Compatibility route)
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;
  
  // Note: Backend cannot verify passwords with Firebase Admin.
  // The correct flow is: Frontend logs in -> sends token -> Backend verifies token.
  // This is a placeholder to prevent the Admin dashboard from crashing if it was using local JWT.
  res.status(400).json({ 
    message: 'To login, please use the Firebase Client SDK on your frontend to get a token.'
  });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const db = getFirestoreDb();
  // req.user is set by Firebase auth middleware
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    
    if (doc.exists) {
      res.json({ id: doc.id, ...doc.data() });
    } else {
      // Fallback to basic auth info
      res.json({
        id: req.user.uid,
        email: req.user.email,
        role: req.user.role
      });
    }
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all users (Firebase Auth)
// @route   GET /api/auth/users
// @access  Private/SuperAdmin
const getAllUsers = async (req, res) => {
  try {
    const auth = getAuth();
    const listUsersResult = await auth.listUsers(1000); // gets up to 1000
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || 'No Name',
      role: userRecord.customClaims?.role || 'user',
      creationTime: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user role
// @route   PUT /api/auth/users/:uid/role
// @access  Private/SuperAdmin
const updateUserRole = async (req, res) => {
  try {
    const auth = getAuth();
    const { role } = req.body;
    const { uid } = req.params;

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role');
    }

    await auth.setCustomUserClaims(uid, { role });
    res.json({ message: `Success! User role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { registerUser, authUser, getUserProfile, getAllUsers, updateUserRole };
