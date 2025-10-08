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
    const { uid } = await requireAuth(event);
    const userId = requireUserId(payload, uid);
    const {
      level,
      analysis_content: analysisContent,
      analysis_type: analysisType = 'repeat'
    } = payload;

    if (!level || !analysisContent) {
      return errorResponse(400, 'level and analysis_content are required', headers);
    }

    const firestore = getFirestoreClient();
    const docRef = firestore.collection('pronunciation_analysis').doc();
    const record = {
      id: docRef.id,
      user: userId,
      type: analysisType,
      level,
      content: analysisContent,
      created_at: new Date().toISOString()
    };

    await docRef.set(record);

    return successResponse(record, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to save pronunciation analysis');
  }
}
