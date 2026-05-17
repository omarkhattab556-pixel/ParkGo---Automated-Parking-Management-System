/**
 * Build an Express middleware that validates `req[source]` against a Zod schema.
 * Replaces `req[source]` with the parsed (and coerced) value on success.
 */
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
    }
    req[source] = result.data;
    next();
  };
