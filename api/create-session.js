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
    const { level, mode = 'repeat' } = payload;

    if (!level) {
      return errorResponse(400, 'level is required', headers);
    }

    const supabase = getSupabaseClient();

    const sessionContent = generateSessionContent(level);

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user: userId,
        level: level,
        mode: mode,
        content: sessionContent,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to create session');
  }
}

function generateSessionContent(level) {
  const content = {
    beginner: [
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
    ],
    intermediate: [
      {
        learning: "Pouvez-vous m'aider avec ce projet?",
        native: "Can you help me with this project?",
        audio_url: null
      },
      {
        learning: "J'aimerais réserver une table pour deux personnes",
        native: "I would like to reserve a table for two people",
        audio_url: null
      }
    ],
    advanced: [
      {
        learning: "Nous devons discuter des implications stratégiques de cette décision",
        native: "We need to discuss the strategic implications of this decision",
        audio_url: null
      },
      {
        learning: "Je pense que nous devrions reconsidérer notre approche",
        native: "I think we should reconsider our approach",
        audio_url: null
      }
    ]
  };

  return content[level] || content.beginner;
}
