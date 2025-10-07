import { getSupabaseClient } from './_utils/supabase.js';
import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  jsonResponse,
  successResponse
} from './_utils/http.js';
import { ensureSessionOwnership, requireUserId } from './_utils/auth.js';

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
    const { session_id: sessionId } = params;

    if (!sessionId) {
      return errorResponse(400, 'session_id is required', headers);
    }

    const supabase = getSupabaseClient();

    const session = await ensureSessionOwnership({
      supabase,
      sessionId,
      userId,
      columns: 'content,user'
    });

    const content = session.content || [];

    for (let i = 0; i < content.length; i++) {
      if (content[i].status !== 'done') {
        const completedQuestions = content.filter(q => q.status === 'done').length;

        return successResponse({
          index: i,
          question: content[i],
          total_questions: content.length,
          completed_questions: completedQuestions
        }, headers);
      }
    }

    return jsonResponse(200, {
      success: true,
      data: null,
      message: 'All questions completed'
    }, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to get next question');
  }
}
