import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  jsonResponse
} from './_utils/http.js';
import { requireAuth, requireUserId } from './_utils/auth.js';
import { getRealtimeDatabase } from './_utils/firestore.js';
import { normalizeLanguageCode, languageLabelFromCode } from './_utils/language.js';

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
      learning,
      native,
      industry,
      job,
      name
    } = payload;

    const { uid } = await requireAuth(event);
    const userId = requireUserId(payload, uid);

    const realtimeDb = getRealtimeDatabase();

    const normalizedLearning = normalizeLanguageCode(learning);
    const normalizedNative = normalizeLanguageCode(native);

    const learningLabel = languageLabelFromCode(normalizedLearning) ?? null;
    const nativeLabel = languageLabelFromCode(normalizedNative) ?? null;

    const userRef = realtimeDb.ref(`/users/${userId}`);
    const prefsRef = userRef.child('preferences');

    await userRef.update({
      name: name ?? null,
      language: nativeLabel,
      targetLanguage: learningLabel
    });

    await prefsRef.update({
      language: nativeLabel,
      targetLanguage: learningLabel,
      industry: industry ?? null,
      job: job ?? null,
      updatedAt: new Date().toISOString()
    });

    const realtime = (await userRef.get()).val() || {};
    const prefs = realtime.preferences || {};
    const saved = {
      name: realtime.name ?? null,
      industry: prefs.industry ?? null,
      job: prefs.job ?? null,
      learning: normalizedLearning,
      learningLabel,
      native: normalizedNative,
      nativeLabel,
      level: prefs.level ?? realtime.level ?? null,
      age: realtime.age ?? prefs.age ?? null,
      learningGoals: prefs.learningGoals ?? realtime.learningGoals ?? null
    };

    return jsonResponse(200, {
      success: true,
      message: 'Preferences saved successfully',
      data: saved
    }, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to save preferences');
  }
}
