import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Separate Firebase Admin instance for Imposter app
let imposterApp: App | null = null;
let imposterDb: Firestore | null = null;

const initImposterFirebase = () => {
  // Check if already initialized
  const existingApp = getApps().find(app => app.name === 'imposter');
  if (existingApp) {
    return existingApp;
  }

  const serviceAccount = process.env.IMPOSTER_FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccount) {
    console.warn('Imposter Firebase service account not configured.');
    return null;
  }

  try {
    const parsedServiceAccount = JSON.parse(serviceAccount);

    return initializeApp({
      credential: cert(parsedServiceAccount),
    }, 'imposter'); // Named app instance
  } catch (error) {
    console.error('Failed to initialize Imposter Firebase Admin:', error);
    return null;
  }
};

// Initialize on first import
imposterApp = initImposterFirebase();
imposterDb = imposterApp ? getFirestore(imposterApp) : null;

export { imposterDb as db };
