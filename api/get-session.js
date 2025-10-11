import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  successResponse
} from './_utils/http.js';
import { requireAuth, requireUserId } from './_utils/auth.js';
import { getFirestoreClient } from './_utils/firestore.js';

/**
 * Get or create session for a user
 * Auto-creates a beginner session if none exists
 */
export async function handler(event, context) {
  const allowedMethods = ['GET'];
  const headers = createCorsHeaders(allowedMethods);

  const cors = handleCors(event, headers);
  if (cors) return cors;

  const methodError = ensureAllowedMethod(event, headers, allowedMethods);
  if (methodError) return methodError;

  try {
    const params = event.queryStringParameters || {};
    const { uid } = await requireAuth(event);
    const userId = requireUserId(params, uid);

    const firestore = getFirestoreClient();
    const snapshot = await firestore
      .collection('sessions')
      .where('user', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      const sessionContent = [
        {
          learning: "Bonjour, comment allez-vous?",
          native: "Hello, how are you?",
          audio_url: null
        },
        {
          learning: "Je m'appelle...",
          native: "My name is...",
          audio_url: null
        },
        {
          learning: "Enchanté de vous rencontrer",
          native: "Nice to meet you",
          audio_url: null
        }
      ];

      const sessionRef = firestore.collection('sessions').doc();
      const now = new Date().toISOString();
      const newSession = {
        id: sessionRef.id,
        user: userId,
        level: 'beginner',
        type: 'repeat',
        content: sessionContent,
        created_at: now,
        updated_at: now
      };

      await sessionRef.set(newSession);

      return successResponse(newSession, headers);
    }

    const doc = snapshot.docs[0];
    const raw = doc.data();
    const formatted = {
      id: doc.id,
      ...raw,
      mode: raw.type || raw.mode || 'repeat',
      type: raw.type || raw.mode || 'repeat'
    };

    return successResponse(formatted, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to get session');
  }
}
