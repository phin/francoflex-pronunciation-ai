import { BadRequestError, ForbiddenError, NotFoundError } from './http.js';

export function requireUserId(source) {
  const userId = source?.user_id || source?.userId;
  if (!userId) {
    throw new BadRequestError('user_id is required');
  }
  return userId;
}

export async function ensureSessionOwnership({ supabase, sessionId, userId, columns = '*' }) {
  if (!sessionId) {
    throw new BadRequestError('session_id is required');
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .select(columns)
    .eq('id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Session not found');
    }

    throw error;
  }

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.user && userId && session.user !== userId) {
    throw new ForbiddenError('You do not have access to this session');
  }

  return session;
}
