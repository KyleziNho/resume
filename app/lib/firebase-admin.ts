import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const initFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Use service account from environment variable
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccount) {
    console.warn('Firebase service account not configured. Analytics will not persist.');
    return null;
  }

  try {
    const parsedServiceAccount = JSON.parse(serviceAccount);

    return initializeApp({
      credential: cert(parsedServiceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
};

const app = initFirebaseAdmin();

// Export Firestore instance
export const db = app ? getFirestore(app) : null;
