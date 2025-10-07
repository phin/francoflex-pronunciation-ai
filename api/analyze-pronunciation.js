/**
 * Netlify Function: Pronunciation Analysis
 *
 * HTTP wrapper around the reusable pronunciation analysis module.
 * The core logic is in /api/_utils/pronunciation/ for easy reuse.
 */

import { analyzePronunciation } from './_utils/pronunciation/index.js';
import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  jsonResponse
} from './_utils/http.js';

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
      audio_url,
      target_text,
      analysis_language = 'fr-fr',
      native_language = 'en',
      session_id,
      feedback_tone = 'encouraging',
      detailed = false
    } = payload;

    if (!audio_url || !target_text) {
      return errorResponse(400, 'audio_url and target_text are required', headers);
    }

    const result = await analyzePronunciation({
      audioUrl: audio_url,
      targetText: target_text,
      analysisLanguage: analysis_language,
      nativeLanguage: native_language,
      includeFeedback: true,
      feedbackTone: feedback_tone,
      detailedReport: detailed,
      userId: session_id
    });

    return jsonResponse(200, {
      success: true,
      data: {
        analysis: result.analysis,
        ai_feedback: result.feedback?.feedback,
        encouragement: result.feedback?.encouragement,
        overall_score: result.score,
        category: result.feedback?.category,
        metadata: result.metadata
      }
    }, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to analyze pronunciation');
  }
}
