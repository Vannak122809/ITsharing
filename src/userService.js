/**
 * userService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central service for reading & writing all user information to Firestore.
 * Every page that needs user data should import from here — never write raw
 * Firestore calls in individual components.
 *
 * Firestore path:  users/{uid}
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// ── Collection reference helper ─────────────────────────────────────────────
const userRef = (uid) => doc(db, 'users', uid);

// ── Default user document shape ────────────────────────────────────────────
const defaultProfile = {
  nickname:    '',
  bio:         '',
  location:    '',
  website:     '',
  avatarUrl:   '',
  coverUrl:    '',
  email:       '',
  displayName: '',
  provider:    '',   // 'password' | 'google.com' | 'anonymous'
  isAnonymous: false,
  role:        'user', // 'user' | 'admin'
  createdAt:   null,
  lastLoginAt: null,
  updatedAt:   null,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE OR UPDATE on every login / auth state change
//    Call this whenever onAuthStateChanged fires with a non-null user.
// ─────────────────────────────────────────────────────────────────────────────
export const syncUserToFirestore = async (firebaseUser) => {
  if (!firebaseUser) return null;

  const ref  = userRef(firebaseUser.uid);
  const snap = await getDoc(ref);

  const providerData   = firebaseUser.providerData?.[0];
  const provider       = providerData?.providerId ?? (firebaseUser.isAnonymous ? 'anonymous' : 'unknown');
  const googleName     = provider === 'google.com' ? (firebaseUser.displayName || '') : '';
  const googleAvatar   = provider === 'google.com' ? (firebaseUser.photoURL || '') : '';

  if (!snap.exists()) {
    // ── First time — create full document ──────────────────────────────────
    const newDoc = {
      ...defaultProfile,
      uid:         firebaseUser.uid,
      email:       firebaseUser.email ?? '',
      displayName: googleName,
      nickname:    googleName,       // pre-fill from Google if available
      avatarUrl:   googleAvatar,     // pre-fill Google profile photo
      provider,
      isAnonymous: firebaseUser.isAnonymous,
      createdAt:   serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };
    await setDoc(ref, newDoc);
    return newDoc;
  } else {
    // ── Already exists — update login time & auth fields only ──────────────
    const updates = {
      lastLoginAt: serverTimestamp(),
      email:       firebaseUser.email ?? snap.data().email ?? '',
      isAnonymous: firebaseUser.isAnonymous,
      provider,
    };
    // Only update displayName / avatarUrl from Google if the user hasn't
    // set their own custom values yet
    const existing = snap.data();
    if (!existing.nickname && googleName)   updates.nickname   = googleName;
    if (!existing.avatarUrl && googleAvatar) updates.avatarUrl = googleAvatar;

    await updateDoc(ref, updates);
    return { ...existing, ...updates };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. READ full profile
// ─────────────────────────────────────────────────────────────────────────────
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  try {
    const snap = await getDoc(userRef(uid));
    return snap.exists() ? { uid, ...snap.data() } : null;
  } catch (e) {
    console.error('[userService] getUserProfile failed:', e);
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. SAVE a single field  (e.g. in Profile page inline edits)
// ─────────────────────────────────────────────────────────────────────────────
export const saveProfileField = async (uid, field, value) => {
  if (!uid || !field) return;
  try {
    await updateDoc(userRef(uid), {
      [field]:   value,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('[userService] saveProfileField failed:', e);
    throw e;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. SAVE multiple fields at once (merge-safe)
// ─────────────────────────────────────────────────────────────────────────────
export const saveProfileFields = async (uid, fields = {}) => {
  if (!uid) return;
  try {
    await setDoc(userRef(uid), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error('[userService] saveProfileFields failed:', e);
    throw e;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET nickname (used by Community forum for post author name)
// ─────────────────────────────────────────────────────────────────────────────
export const getUserNickname = async (uid) => {
  const profile = await getUserProfile(uid);
  if (!profile) return 'Unknown';
  return profile.nickname || profile.email?.split('@')[0] || 'User';
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. BOOKMARKS (Saved Resources)
// ─────────────────────────────────────────────────────────────────────────────
export const toggleBookmark = async (uid, resourceId, resourceData) => {
  if (!uid || !resourceId) return false;
  const bookmarkRef = doc(db, 'users', uid, 'bookmarks', resourceId);
  try {
    const snap = await getDoc(bookmarkRef);
    if (snap.exists()) {
      await deleteDoc(bookmarkRef);
      return false; // unbookmarked
    } else {
      await setDoc(bookmarkRef, {
        ...resourceData,
        bookmarkedAt: serverTimestamp()
      });
      return true; // bookmarked
    }
  } catch (e) {
    console.error('[userService] toggleBookmark failed:', e);
    throw e;
  }
};

export const getBookmarks = async (uid) => {
  if (!uid) return [];
  try {
    const bookmarksRef = collection(db, 'users', uid, 'bookmarks');
    const snap = await getDocs(bookmarksRef);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('[userService] getBookmarks failed:', e);
    return [];
  }
};

export const checkIsBookmarked = async (uid, resourceId) => {
  if (!uid || !resourceId) return false;
  try {
    const bookmarkRef = doc(db, 'users', uid, 'bookmarks', resourceId);
    const snap = await getDoc(bookmarkRef);
    return snap.exists();
  } catch (e) {
    console.error('[userService] checkIsBookmarked failed:', e);
    return false;
  }
};
