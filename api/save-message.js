import { getSupabaseClient } from './_utils/supabase.js';
import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  successResponse
} from './_utils/http.js';
import { ensureSessionOwnership, requireUserId } from './_utils/auth.js';

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

    const userId = requireUserId({ user_id });

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

    const supabase = getSupabaseClient();

    await ensureSessionOwnership({
      supabase,
      sessionId,
      userId,
      columns: 'id,user'
    });

    const messageData = {
      author: author,
      session: sessionId,
      content: messageContent,
      created_at: new Date().toISOString()
    };

    if (audioUrl) {
      messageData.metadata = { audio_url: audioUrl };
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to save message');
  }
}
