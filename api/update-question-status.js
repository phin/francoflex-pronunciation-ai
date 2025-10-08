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
      session_id: sessionId,
      question_index: questionIndex,
      status = 'done',
      user_id
    } = payload;

    const { uid } = await requireAuth(event);
    const userId = requireUserId({ user_id }, uid);

    if (questionIndex === undefined) {
      return errorResponse(400, 'question_index is required', headers);
    }

    const firestore = getFirestoreClient();

    const session = await ensureSessionOwnership({
      firestore,
      sessionId,
      userId
    });

    const content = session.content || [];

    if (questionIndex < 0 || questionIndex >= content.length) {
      return errorResponse(400, 'Invalid question_index', headers);
    }

    content[questionIndex] = {
      ...content[questionIndex],
      status: status
    };

    const sessionRef = firestore.collection('sessions').doc(session.id);
    const updated_at = new Date().toISOString();

    await sessionRef.update({
      content,
      updated_at
    });

    return successResponse({
      ...session,
      content,
      updated_at
    }, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to update question status');
  }
}
