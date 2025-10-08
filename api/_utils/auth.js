import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from './http.js';
import { verifyIdToken } from './firebase-admin.js';
import { getFirestoreClient } from './firestore.js';

export async function requireAuth(event) {
  const headers = event.headers || {};
  const authHeader = headers.authorization || headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No authentication token provided');
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const decoded = await verifyIdToken(token);
    return {
      uid: decoded.uid,
      token,
      claims: decoded,
    };
  } catch (error) {
    throw new UnauthorizedError('Invalid authentication token', error?.message);
  }
}

export function requireUserId(source, fallbackUserId, options = {}) {
  const { enforceMatch = true } = options;
  const candidate = source?.user_id || source?.userId || fallbackUserId;

  if (!candidate) {
    throw new BadRequestError('user_id is required');
  }

  if (enforceMatch && fallbackUserId && candidate !== fallbackUserId) {
    throw new ForbiddenError('Authenticated user does not match requested user_id');
  }

  return candidate;
}

export async function ensureSessionOwnership({ firestore, sessionId, userId }) {
  if (!sessionId) {
    throw new BadRequestError('session_id is required');
  }

  const db = firestore || getFirestoreClient();
  const sessionRef = db.collection('sessions').doc(sessionId);
  const snapshot = await sessionRef.get();

  if (!snapshot.exists) {
    throw new NotFoundError('Session not found');
  }

  const session = snapshot.data();

  if (session?.user && userId && session.user !== userId) {
    throw new ForbiddenError('You do not have access to this session');
  }

  return {
    id: snapshot.id,
    ...session,
  };
}
