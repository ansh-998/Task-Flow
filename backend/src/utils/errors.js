// ============================================================================
// File: server/src/utils/errors.js
// Description: Custom application error class with HTTP status code
// ============================================================================

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
