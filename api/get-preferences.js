import { getSupabaseClient } from './_utils/supabase.js';
import {
  createCorsHeaders,
  ensureAllowedMethod,
  handleCors,
  handleError,
  successResponse
} from './_utils/http.js';
import { requireUserId } from './_utils/auth.js';

export async function handler(event, context) {
  const allowedMethods = ['GET'];
  const headers = createCorsHeaders(allowedMethods);

  const cors = handleCors(event, headers);
  if (cors) return cors;

  const methodError = ensureAllowedMethod(event, headers, allowedMethods);
  if (methodError) return methodError;

  try {
    const params = event.queryStringParameters || {};
    const userId = requireUserId(params);

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user', userId)  // Column name is "user" not "user_id"
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    return successResponse(data || null, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to get preferences');
  }
}
