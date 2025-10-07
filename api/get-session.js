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
    const userId = requireUserId(params);

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
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

      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert({
          user: userId,
          level: 'beginner',
          type: 'repeat',
          content: sessionContent,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return successResponse(newSession, headers);
    }

    return successResponse(data, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to get session');
  }
}
