function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
}

module.exports = errorHandler;
