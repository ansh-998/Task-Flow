// ============================================================================
// File: server/src/middleware/validate.js
// Description: Zod schema request validation middleware
// ============================================================================

export function validate(schema) {
  return (req, res, next) => {
    // 1. Direct Zod schema (body validation)
    if (schema && typeof schema.safeParse === 'function') {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const issues = result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: issues[0]?.message || 'Validation failed',
          details: issues
        });
      }
      req.body = result.data;
      return next();
    }

    // 2. Composite object: { body, params, query }
    if (schema && typeof schema === 'object') {
      const targets = ['params', 'query', 'body'];
      for (const target of targets) {
        if (schema[target]) {
          const result = schema[target].safeParse(req[target]);
          if (!result.success) {
            const issues = result.error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }));
            return res.status(400).json({
              error: issues[0]?.message || `${target} validation failed`,
              details: issues
            });
          }
          req[target] = result.data;
        }
      }
      return next();
    }

    next();
  };
}

export default validate;
