import { getSupabaseClient } from './_utils/supabase.js';
import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  jsonResponse
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
    const {
      learning,
      native,
      industry,
      job,
      name
    } = payload;

    const userId = requireUserId(payload);

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('preferences')
      .upsert({
        user: userId,  // Column name is "user" not "user_id"
        learning: learning,
        native: native,
        industry,
        job,
        name,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse(200, {
      success: true,
      message: 'Preferences saved successfully',
      data
    }, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to save preferences');
  }
}
