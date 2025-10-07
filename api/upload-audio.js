import { getSupabaseClient } from './_utils/supabase.js';
import multipart from 'lambda-multipart-parser';
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
  const headers = createCorsHeaders(allowedMethods, {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });

  const cors = handleCors(event, headers);
  if (cors) return cors;

  const methodError = ensureAllowedMethod(event, headers, allowedMethods);
  if (methodError) return methodError;

  try {
    const result = await multipart.parse(event);

    const file = result.files?.[0];
    const userId = requireUserId(result);
    const sessionId = result.session_id;

    if (!file) {
      return errorResponse(400, 'No file uploaded', headers);
    }

    const supabase = getSupabaseClient();

    const timestamp = Date.now();
    const filename = `${userId}/${sessionId || 'audio'}/${timestamp}-${file.filename}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('audio')
      .upload(filename, file.content, {
        contentType: file.contentType,
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase
      .storage
      .from('audio')
      .getPublicUrl(filename);

    return jsonResponse(200, {
      success: true,
      data: {
        audio_url: urlData.publicUrl,
        filename: filename
      }
    }, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to upload audio');
  }
}
