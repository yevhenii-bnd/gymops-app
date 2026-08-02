import { HttpException, HttpStatus } from "@nestjs/common";

export class AuthProblemException extends HttpException {
  constructor(status: HttpStatus, code: string, detail: string) {
    super({ code, detail }, status);
  }
}

export function invalidCredentials(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_INVALID_CREDENTIALS",
    "Email or password is incorrect."
  );
}

export function tokenMissing(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_TOKEN_MISSING",
    "A bearer access token is required."
  );
}

export function tokenInvalid(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_TOKEN_INVALID",
    "The access token is invalid."
  );
}

export function tokenExpired(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_TOKEN_EXPIRED",
    "The access token has expired."
  );
}

export function sessionStale(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_SESSION_STALE",
    "The authenticated staff session is no longer active."
  );
}

export function refreshMissing(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_REFRESH_MISSING",
    "A refresh token cookie is required."
  );
}

export function refreshInvalid(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_REFRESH_INVALID",
    "The refresh token is invalid."
  );
}

export function refreshExpired(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_REFRESH_EXPIRED",
    "The refresh token has expired."
  );
}

export function refreshReused(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.UNAUTHORIZED,
    "AUTH_REFRESH_REUSED",
    "The refresh token family has been revoked."
  );
}

export function csrfFailed(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.FORBIDDEN,
    "CSRF_VALIDATION_FAILED",
    "The CSRF token is missing or invalid."
  );
}

export function lockedOut(): AuthProblemException {
  return new AuthProblemException(
    HttpStatus.TOO_MANY_REQUESTS,
    "AUTH_RATE_LIMITED",
    "Too many failed login attempts. Try again later."
  );
}
