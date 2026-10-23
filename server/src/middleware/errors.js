export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found.` } });
}

export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'A record with that unique value already exists.' } });
  }

  if (err.name === 'ValidationError' || err.name === 'CastError' || err.name === 'ZodError' || err.issues) {
    const issues = err.issues || err.errors;
    const msg = issues ? issues.map(e => `${(e.path || []).join('.') || 'field'}: ${e.message}`).join('; ') : err.message;
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: msg,
        details: issues
      }
    });
  }

  res.status(err.status || 500).json({
    error: {
      code: err.codeName || 'INTERNAL_ERROR',
      message: err.status ? err.message : 'Unexpected server error.'
    }
  });
}
