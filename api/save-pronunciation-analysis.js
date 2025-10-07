import { getSupabaseClient } from './_utils/supabase.js';
import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  successResponse
} from './_utils/http.js';
import { requireUserId } from './_utils/auth.js';

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
    const userId = requireUserId(payload);
    const {
      level,
      analysis_content: analysisContent,
      analysis_type: analysisType = 'repeat'
    } = payload;

    if (!level || !analysisContent) {
      return errorResponse(400, 'level and analysis_content are required', headers);
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('pronunciation_analysis')
      .insert({
        user: userId,
        type: analysisType,
        level: level,
        content: analysisContent,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to save pronunciation analysis');
  }
}
