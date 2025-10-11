const DEFAULT_ALLOWED_HEADERS = 'Content-Type, Authorization';

export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestError extends HttpError {
  constructor(message, details) {
    super(400, message || 'Bad request', details);
    this.name = 'BadRequestError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message, details) {
    super(403, message || 'Forbidden', details);
    this.name = 'ForbiddenError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message, details) {
    super(401, message || 'Unauthorized', details);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message, details) {
    super(404, message || 'Not found', details);
    this.name = 'NotFoundError';
  }
}

function makeHeaders(baseHeaders = {}) {
  return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': DEFAULT_ALLOWED_HEADERS, ...baseHeaders };
}

export function createCorsHeaders(allowedMethods, extraHeaders = {}) {
  const methods = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
  const normalized = new Set(methods.map(method => method.toUpperCase()));
  normalized.add('OPTIONS');
  return makeHeaders({ 'Access-Control-Allow-Methods': Array.from(normalized).join(', '), ...extraHeaders });
}

export function handleCors(event, headers) {
  if (event.httpMethod !== 'OPTIONS') return null;
  return { statusCode: 200, headers, body: '' };
}

export function ensureAllowedMethod(event, headers, allowedMethods) {
  const methods = Array.isArray(allowedMethods) ? allowedMethods : [allowedMethods];
  if (methods.includes(event.httpMethod)) return null;
  return jsonResponse(405, { error: 'Method not allowed' }, headers);
}

export function jsonResponse(statusCode, payload, headers) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
  return { statusCode, headers, body };
}

export function successResponse(data, headers) {
  return jsonResponse(200, { success: true, data }, headers);
}

export function messageResponse(statusCode, message, headers) {
  return jsonResponse(statusCode, { success: true, message }, headers);
}

export function errorResponse(statusCode, message, headers, details) {
  const payload = details ? { error: message, details } : { error: message };
  return jsonResponse(statusCode, payload, headers);
}

export function handleError(error, headers, fallbackMessage = 'Internal server error') {
  if (error instanceof HttpError) {
    return errorResponse(error.statusCode, error.message, headers, error.details);
  }

  console.error('Unhandled API error:', error);
  return errorResponse(500, fallbackMessage, headers, error?.message);
}
