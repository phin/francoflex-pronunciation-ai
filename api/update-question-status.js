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
      session_id: sessionId,
      question_index: questionIndex,
      status = 'done',
      user_id
    } = payload;

    const userId = requireUserId({ user_id });

    if (questionIndex === undefined) {
      return errorResponse(400, 'question_index is required', headers);
    }

    const supabase = getSupabaseClient();

    const session = await ensureSessionOwnership({
      supabase,
      sessionId,
      userId,
      columns: 'id,user,content'
    });

    const content = session.content || [];

    if (questionIndex < 0 || questionIndex >= content.length) {
      return errorResponse(400, 'Invalid question_index', headers);
    }

    content[questionIndex] = {
      ...content[questionIndex],
      status: status
    };

    const { data: updatedSession, error: updateError } = await supabase
      .from('sessions')
      .update({
        content: content,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return successResponse(updatedSession, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to update question status');
  }
}
