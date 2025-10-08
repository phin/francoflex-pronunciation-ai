import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseApp = null;

function getRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${name}`);
  }
  return value;
}

export function getFirebaseApp() {
  if (!firebaseApp) {
    if (getApps().length) {
      firebaseApp = getApps()[0];
    } else {
      try {
        const projectId = getRequiredEnvVar('FIREBASE_PROJECT_ID');
        const clientEmail = getRequiredEnvVar('FIREBASE_CLIENT_EMAIL');
        const privateKey = getRequiredEnvVar('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
        const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

        console.log('Initializing Firebase Admin SDK with project:', projectId);

        const config = {
          credential: cert({ projectId, clientEmail, privateKey }),
        };

        if (databaseURL) {
          config.databaseURL = databaseURL;
        }

        firebaseApp = initializeApp(config);
        console.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
        throw error;
      }
    }
  }

  return firebaseApp;
}

export async function verifyIdToken(idToken) {
  if (!idToken) {
    throw new Error('No Firebase ID token provided');
  }

  try {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken);
    console.log('Token verified successfully for user:', decoded.uid);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error;
  }
}
