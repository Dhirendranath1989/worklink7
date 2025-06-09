import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDbV5BSPuKsMovojw5EssNl9vcqFIQAGys",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "workrklink6.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "workrklink6",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "workrklink6.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "85255551610",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:85255551610:web:fd0610bfbdd59365cdd9c3"
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Firebase configuration is incomplete. Please check your environment variables.');
  console.error('Current config:', {
    apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
    projectId: firebaseConfig.projectId || 'Missing',
    authDomain: firebaseConfig.authDomain || 'Missing'
  });
  throw new Error('Firebase configuration is incomplete. Missing required fields.');
}

console.log('✅ Firebase configuration validated. Project ID:', firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized with project:', app.options.projectId);

// Initialize Firebase services
export const auth = getAuth(app);

// Initialize Firestore with proper configuration
let db;

try {
  // Initialize Firestore with modern cache and long polling configuration
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: undefined // Disable tab synchronization to prevent WebChannel issues
    })
  });
  
  console.log('✅ Firestore initialized with modern cache and long polling');
  
} catch (error) {
  console.error('❌ Modern Firestore initialization failed:', error);
  
  // Fallback: Try with basic long polling only
  try {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    });
    console.log('⚠️ Using basic long polling Firestore initialization');
  } catch (fallbackError) {
    console.error('❌ Long polling initialization failed:', error);
    
    // Final fallback: Basic initialization
    try {
      db = getFirestore(app);
      console.log('🔄 Using basic Firestore initialization as last resort');
    } catch (finalError) {
      console.error('❌ All Firestore initialization attempts failed:', finalError);
      throw finalError;
    }
  }
}

export { db };

export const storage = getStorage(app);

// Initialize messaging (for push notifications)
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.warn('Firebase messaging not supported:', error);
  }
}

// Phone authentication utilities
export const setupRecaptcha = (containerId) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: (response) => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
    }
  });
};

export const sendOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

// Push notification utilities
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.warn('Messaging not available');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
};

export const onMessageListener = () => {
  if (!messaging) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

// File upload utilities with progress support
export const uploadFile = async (file, path, onProgress = null) => {
  try {
    const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
    const storageRef = ref(storage, path);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress percentage
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          // Call progress callback if provided
          if (onProgress && typeof onProgress === 'function') {
            onProgress(Math.round(progress));
          }
          
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error('Error uploading file:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File uploaded successfully:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('Error getting download URL:', error);
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error initializing file upload:', error);
    throw error;
  }
};

// Legacy upload function for backward compatibility
export const uploadFileSimple = async (file, path) => {
  try {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Firestore utilities
export const firestoreUtils = {
  // Add document
  addDocument: async (collection, data) => {
    try {
      const { collection: firestoreCollection, addDoc } = await import('firebase/firestore');
      const docRef = await addDoc(firestoreCollection(db, collection), data);
      return docRef.id;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },

  // Get document
  getDocument: async (collection, docId) => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, collection, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  },

  // Update document
  updateDocument: async (collection, docId, data) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const docRef = doc(db, collection, docId);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (collection, docId) => {
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const docRef = doc(db, collection, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  // Listen to real-time updates
  onSnapshot: (collection, callback) => {
    try {
      const { collection: firestoreCollection, onSnapshot: firestoreOnSnapshot } = require('firebase/firestore');
      const collectionRef = firestoreCollection(db, collection);
      return firestoreOnSnapshot(collectionRef, callback);
    } catch (error) {
      console.error('Error setting up listener:', error);
      throw error;
    }
  }
};

export default app;