import express from 'express';
import {
  getDocuments, createDocument, deleteDocument,
  getSoftware, createSoftware, deleteSoftware,
  getCourses, createCourse, deleteCourse,
  getDrivers, createDriver, deleteDriver,
  getCommunityPosts, createCommunityPost
} from '../controllers/resourceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Documents
router.route('/documents')
  .get(getDocuments)
  .post(protect, admin, createDocument);
router.route('/documents/:id')
  .delete(protect, admin, deleteDocument);

// Software
router.route('/software')
  .get(getSoftware)
  .post(protect, admin, createSoftware);
router.route('/software/:id')
  .delete(protect, admin, deleteSoftware);

// Courses
router.route('/courses')
  .get(getCourses)
  .post(protect, admin, createCourse);
router.route('/courses/:id')
  .delete(protect, admin, deleteCourse);

// Drivers
router.route('/drivers')
  .get(getDrivers)
  .post(protect, admin, createDriver);
router.route('/drivers/:id')
  .delete(protect, admin, deleteDriver);

// Community
router.route('/community')
  .get(getCommunityPosts)
  .post(protect, createCommunityPost);

// Media
import { getMedia, createMedia, deleteMedia } from '../controllers/resourceController.js';
router.route('/media')
  .get(getMedia)
  .post(protect, admin, createMedia);
router.route('/media/:id')
  .delete(protect, admin, deleteMedia);

export default router;
