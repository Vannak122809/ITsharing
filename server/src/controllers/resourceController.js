import { getFirestoreDb } from '../config/firebase.js';

// ── Generic CRUD Helpers ───────────────────────────────────────────────────

const getAll = async (collectionName, req, res) => {
  const db = getFirestoreDb();
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = snapshot.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    res.status(500);
    throw new Error('Error fetching data from Firestore');
  }
};

const getById = async (collectionName, req, res) => {
  const db = getFirestoreDb();
  try {
    const doc = await db.collection(collectionName).doc(req.params.id).get();
    if (doc.exists) {
      res.json({ _id: doc.id, id: doc.id, ...doc.data() });
    } else {
      res.status(404);
      throw new Error('Resource not found');
    }
  } catch (error) {
    res.status(500);
    throw new Error('Error fetching data from Firestore');
  }
};

const deleteById = async (collectionName, req, res) => {
  const db = getFirestoreDb();
  try {
    await db.collection(collectionName).doc(req.params.id).delete();
    res.json({ message: 'Resource removed' });
  } catch (error) {
    res.status(500);
    throw new Error('Error deleting data from Firestore');
  }
};

const createOne = async (collectionName, req, res) => {
  const db = getFirestoreDb();
  try {
    const data = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await db.collection(collectionName).add(data);
    res.status(201).json({ _id: docRef.id, id: docRef.id, ...data });
  } catch (error) {
    res.status(500);
    throw new Error('Error adding data to Firestore');
  }
};

// ── Specific Controllers ──────────────────────────────────────────────────

// @desc    Get all documents with search/sort
// @route   GET /api/documents
// @access  Public
export const getDocuments = async (req, res) => {
  const { category, subCategory, sort, order, search } = req.query;
  const db = getFirestoreDb();
  
  try {
    let ref = db.collection('documents');
    
    // Note: Firestore requires composite indexes for multiple where clauses. 
    // Filtering might need to be done memory-side for complex queries.
    if (category) ref = ref.where('category', '==', category);
    if (subCategory) ref = ref.where('subCategory', '==', subCategory);
    
    const snapshot = await ref.get();
    let data = snapshot.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));

    // Memory-side filtering for search & sort
    if (search) {
      data = data.filter(doc => doc.title?.toLowerCase().includes(search.toLowerCase()));
    }

    if (sort) {
      data.sort((a, b) => {
        if (a[sort] < b[sort]) return order === 'desc' ? 1 : -1;
        if (a[sort] > b[sort]) return order === 'desc' ? -1 : 1;
        return 0;
      });
    } else {
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json(data);
  } catch (error) {
    res.status(500);
    throw new Error('Error fetching documents');
  }
};

// @desc    Create a document
// @route   POST /api/documents
// @access  Private/Admin
export const createDocument = async (req, res) => await createOne('documents', req, res);

// @desc    Get all software
// @route   GET /api/software
// @access  Public
export const getSoftware = async (req, res) => await getAll('software', req, res);

// @desc    Create software
// @route   POST /api/software
// @access  Private/Admin
export const createSoftware = async (req, res) => await createOne('software', req, res);

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
export const getCourses = async (req, res) => await getAll('courses', req, res);

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res) => await createOne('courses', req, res);

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Public
export const getDrivers = async (req, res) => await getAll('drivers', req, res);

// @desc    Create a driver
// @route   POST /api/drivers
// @access  Private/Admin
export const createDriver = async (req, res) => await createOne('drivers', req, res);

// @desc    Get all community posts
// @route   GET /api/community
// @access  Public
export const getCommunityPosts = async (req, res) => {
    // Basic implementation since populate isn't natively supported in NoSQL like Mongoose
    const db = getFirestoreDb();
    const snapshot = await db.collection('communityPosts').orderBy('createdAt', 'desc').get();
    const data = snapshot.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    res.json(data);
};

// @desc    Create a community post
// @route   POST /api/community
// @access  Private
export const createCommunityPost = async (req, res) => {
  const { content, mediaUrl } = req.body;
  const db = getFirestoreDb();
  
  try {
    const post = {
      authorId: req.user.uid,
      authorEmail: req.user.email,
      content,
      mediaUrl: mediaUrl || '',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    const docRef = await db.collection('communityPosts').add(post);
    res.status(201).json({ _id: docRef.id, id: docRef.id, ...post });
  } catch (error) {
    res.status(500);
    throw new Error('Error creating post');
  }
};

// @desc    Get all media
export const getMedia = async (req, res) => await getAll('media', req, res);

// @desc    Create media
export const createMedia = async (req, res) => await createOne('media', req, res);

// Generic Delete
export const deleteDocument = async (req, res) => await deleteById('documents', req, res);
export const deleteSoftware = async (req, res) => await deleteById('software', req, res);
export const deleteCourse = async (req, res) => await deleteById('courses', req, res);
export const deleteDriver = async (req, res) => await deleteById('drivers', req, res);
export const deleteMedia = async (req, res) => await deleteById('media', req, res);
export const deleteCommunityPost = async (req, res) => await deleteById('communityPosts', req, res);
