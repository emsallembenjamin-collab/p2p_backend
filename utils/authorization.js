const AUTHORIZATION_SCHEME = 'Bearer';

class AuthorizationError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

function extractBearerToken(headerValue) {
  if (typeof headerValue !== 'string' || headerValue.trim() === '') {
    throw new AuthorizationError('Authorization header is required');
  }

  const parts = headerValue.trim().split(/\s+/);

  // Preserve compatibility with clients that historically sent a raw JWT.
  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length !== 2 || parts[0].toLowerCase() !== AUTHORIZATION_SCHEME.toLowerCase()) {
    throw new AuthorizationError('Authorization header must use the Bearer scheme');
  }

  return parts[1];
}

function copyIdentityClaims(request, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new AuthorizationError('Token payload is invalid');
  }

  request.email = payload.email;
  request.accountUuid = payload.accountUuid;
  request.isEmailVerified = payload.isEmailVerified;
  request._id = payload._id;

  return request;
}

function sendAuthorizationError(response, error) {
  const statusCode = error instanceof AuthorizationError ? error.statusCode : 401;
  const message = error instanceof AuthorizationError
    ? error.message
    : 'Authentication token is invalid or expired';

  return response.status(statusCode).send({ message });
}

module.exports = {
  AUTHORIZATION_SCHEME,
  AuthorizationError,
  copyIdentityClaims,
  extractBearerToken,
  sendAuthorizationError,
};
