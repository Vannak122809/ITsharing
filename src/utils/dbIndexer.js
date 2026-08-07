/**
 * dbIndexer.js — High-Performance Firestore Database Indexer & Query Optimizer
 *
 * Features:
 *   1. Optimized Indexed Query Builder (Utilizes composite indexes)
 *   2. Cursor-Based Pagination for High Concurrency (startAfter, limit)
 *   3. Automatic Fallback Query Engine (gracefully falls back if index is building)
 *   4. Client-side Query Result Caching via apiCache
 */

import { 
  collection, query, where, orderBy, limit, 
  startAfter, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { getCachedData, setCachedData } from './apiCache';

/**
 * Fetch software items using indexed composite queries & caching
 */
export async function getIndexedSoftware({ os = 'windows', folder = null, pageSize = 20, lastDoc = null }) {
  const cacheKey = `indexed_sw_${os}_${folder || 'all'}_${lastDoc ? lastDoc.id : 'first'}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const colRef = collection(db, 'software');
    const constraints = [where('os', '==', os)];

    if (folder) {
      constraints.push(where('folder', '==', folder));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize));

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const result = {
      items: docs,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      count: docs.length
    };

    setCachedData(cacheKey, result, 3 * 60 * 1000); // 3 minutes TTL
    return result;
  } catch (err) {
    console.warn('[dbIndexer] Fallback query triggered:', err);
    // Unindexed fallback query
    const colRef = collection(db, 'software');
    const snapshot = await getDocs(query(colRef, limit(pageSize)));
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { items: docs, lastVisible: null, count: docs.length };
  }
}

/**
 * Fetch assets using indexed composite queries & caching
 */
export async function getIndexedAssets({ category = null, type = null, pageSize = 20, lastDoc = null }) {
  const cacheKey = `indexed_assets_${category || 'all'}_${type || 'all'}_${lastDoc ? lastDoc.id : 'first'}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const colRef = collection(db, 'assets');
    const constraints = [];

    if (category) constraints.push(where('category', '==', category));
    if (type) constraints.push(where('type', '==', type));

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(pageSize));

    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const result = {
      items: docs,
      lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
      count: docs.length
    };

    setCachedData(cacheKey, result, 3 * 60 * 1000);
    return result;
  } catch (err) {
    console.warn('[dbIndexer] Fallback asset query triggered:', err);
    const colRef = collection(db, 'assets');
    const snapshot = await getDocs(query(colRef, limit(pageSize)));
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { items: docs, lastVisible: null, count: docs.length };
  }
}
