import {
  createCorsHeaders,
  ensureAllowedMethod,
  handleCors,
  handleError,
  successResponse
} from './_utils/http.js';
import { requireAuth, requireUserId } from './_utils/auth.js';
import { getFirestoreClient, getRealtimeDatabase } from './_utils/firestore.js';
import { normalizeLanguageCode, languageLabelFromCode } from './_utils/language.js';

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
    const realtimeDb = getRealtimeDatabase();

    const profileSnap = await firestore.collection('users').doc(userId).get();
    const profile = profileSnap.exists ? (profileSnap.data() || {}) : {};

    const realtimeSnap = await realtimeDb.ref(`/users/${userId}`).get();
    const realtime = realtimeSnap.exists() ? realtimeSnap.val() || {} : {};

    const learningCode = normalizeLanguageCode(profile.targetLanguage ?? profile.learning ?? null);
    const nativeCode = normalizeLanguageCode(profile.userLanguage ?? realtime.language ?? null);

    const preferences = {
      name: profile.name ?? realtime.name ?? null,
      industry: profile.industry ?? null,
      job: profile.job ?? null,
      learning: learningCode,
      learningLabel: languageLabelFromCode(learningCode),
      native: nativeCode,
      nativeLabel: languageLabelFromCode(nativeCode),
      level: profile.level ?? realtime.level ?? null,
      age: realtime.age ?? null,
      learningGoals: realtime.learningGoals ?? null
    };

    return successResponse(preferences, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to get preferences');
  }
}
