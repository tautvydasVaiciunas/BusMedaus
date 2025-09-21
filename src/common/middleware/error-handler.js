export async function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Internal Server Error',
  };
  if (err.code) {
    payload.code = err.code;
  }
  if (err.details) {
    payload.details = err.details;
  }
  res.status(status).json(payload);
}

export default errorHandler;
