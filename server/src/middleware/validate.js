export const validate = (schema, source = 'body') => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync(req[source]);
    req[source] = parsed;
    next();
  } catch (err) {
    if (err.errors) {
      const messages = err.errors.map(e => `${e.path.join('.') || 'field'}: ${e.message}`);
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: messages.join('; '),
          details: err.errors
        }
      });
    }
    next(err);
  }
};
