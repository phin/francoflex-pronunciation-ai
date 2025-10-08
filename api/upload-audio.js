import multipart from 'lambda-multipart-parser';
import {
  createCorsHeaders,
  ensureAllowedMethod,
  errorResponse,
  handleCors,
  handleError,
  jsonResponse
} from './_utils/http.js';
import { requireAuth, requireUserId } from './_utils/auth.js';
import { getStorageBucket } from './_utils/firestore.js';

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
    const { uid } = await requireAuth(event);
    const userId = requireUserId(result, uid);
    const sessionId = result.session_id;

    if (!file) {
      return errorResponse(400, 'No file uploaded', headers);
    }

    const timestamp = Date.now();
    const filename = `${userId}/${sessionId || 'audio'}/${timestamp}-${file.filename}`;

    const bucket = getStorageBucket();
    const storageFile = bucket.file(filename);

    await storageFile.save(file.content, {
      resumable: false,
      contentType: file.contentType || 'audio/mpeg',
      metadata: {
        firebaseStorageDownloadTokens: filename.replace(/\//g, '-')
      }
    });

    await storageFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURI(filename)}`;

    return jsonResponse(200, {
      success: true,
      data: {
        audio_url: publicUrl,
        filename: filename
      }
    }, headers);
  } catch (error) {
    return handleError(error, headers, 'Failed to upload audio');
  }
}
