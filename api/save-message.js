import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  successResponse
} from './_utils/http.js';
import { ensureSessionOwnership, requireAuth, requireUserId } from './_utils/auth.js';
import { getFirestoreClient } from './_utils/firestore.js';

export async function handler(event, context) {
  const allowedMethods = ['POST'];
  const headers = createCorsHeaders(allowedMethods);

  const cors = handleCors(event, headers);
  if (cors) return cors;

  const methodError = ensureAllowedMethod(event, headers, allowedMethods);
  if (methodError) return methodError;

  let payload;
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    return errorResponse(400, 'Invalid JSON payload', headers);
  }

  try {
    const {
      author,
      session_id: sessionId,
      content,
      audio_url: audioUrl,
      ai_feedback: aiFeedback,
      user_id
    } = payload;

    const { uid } = await requireAuth(event);
    const userId = requireUserId({ user_id }, uid);

    let messageContent = content || aiFeedback || '';

    if (!messageContent && author === 'system') {
      messageContent = '[System message]';
    }

    if (!author || !sessionId) {
      return errorResponse(400, 'author and session_id are required', headers);
    }

    if (!messageContent) {
      return errorResponse(400, 'content or ai_feedback is required for user messages', headers);
    }

    if (author !== 'user' && author !== 'system') {
      return errorResponse(400, 'author must be "user" or "system"', headers);
    }

    const firestore = getFirestoreClient();

    await ensureSessionOwnership({
      firestore,
      sessionId,
      userId
    });

    const messageRef = firestore.collection('messages').doc();
    const now = new Date().toISOString();
    const messageData = {
      id: messageRef.id,
      user: userId,
      author,
      session: sessionId,
      content: messageContent,
      created_at: now
    };

    if (audioUrl) {
      messageData.metadata = { audio_url: audioUrl };
    }

    await messageRef.set(messageData);

    return successResponse(messageData, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to save message');
  }
}
