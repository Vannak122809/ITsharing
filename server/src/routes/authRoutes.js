import express from 'express';
import { registerUser, authUser, getUserProfile, getAllUsers, updateUserRole } from '../controllers/authController.js';
import { protect, superAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);

// User Management (Super Admin ONLY)
router.route('/users').get(protect, superAdmin, getAllUsers);
router.route('/users/:uid/role').put(protect, superAdmin, updateUserRole);

export default router;
