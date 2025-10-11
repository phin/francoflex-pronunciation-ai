import {
  createCorsHeaders,
  ensureAllowedMethod,
  handleCors,
  jsonResponse
} from './_utils/http.js';

export async function handler(event, context) {
  const allowedMethods = ['GET'];
  const headers = createCorsHeaders(allowedMethods);

  const cors = handleCors(event, headers);
  if (cors) return cors;

  const methodError = ensureAllowedMethod(event, headers, allowedMethods);
  if (methodError) return methodError;

  return jsonResponse(200, {
    status: 'healthy',
    message: 'FrancoFlex API is running!',
    timestamp: new Date().toISOString()
  }, headers);
}
