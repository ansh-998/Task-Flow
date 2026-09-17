// ============================================================================
// File: backend/src/utils/asyncHandler.js
// Description: Wrapper for async route controllers to automatically catch errors
// ============================================================================

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
