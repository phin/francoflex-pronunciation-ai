import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getDatabase } from 'firebase-admin/database';
import { BadRequestError } from './http.js';
import { getFirebaseApp } from './firebase-admin.js';

let firestoreInstance = null;
let storageInstance = null;
let realtimeDbInstance = null;

export function getFirestoreClient() {
  if (!firestoreInstance) {
    const app = getFirebaseApp();
    firestoreInstance = getFirestore(app);
  }

  return firestoreInstance;
}

export function getStorageBucket() {
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!bucketName) {
    throw new BadRequestError('FIREBASE_STORAGE_BUCKET environment variable is not set');
  }

  if (!storageInstance) {
    const app = getFirebaseApp();
    storageInstance = getStorage(app);
  }

  return storageInstance.bucket(bucketName);
}

export function getRealtimeDatabase() {
  if (!realtimeDbInstance) {
    const app = getFirebaseApp();
    realtimeDbInstance = getDatabase(app);
  }

  return realtimeDbInstance;
}
