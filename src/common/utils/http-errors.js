export function createHttpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  if (details) {
    error.details = details;
  }
  return error;
}

export const HttpError = {
  badRequest(message = 'Bad Request', details) {
    return createHttpError(400, message, details);
  },
  unauthorized(message = 'Unauthorized') {
    return createHttpError(401, message);
  },
  forbidden(message = 'Forbidden') {
    return createHttpError(403, message);
  },
  notFound(message = 'Not Found') {
    return createHttpError(404, message);
  },
  conflict(message = 'Conflict') {
    return createHttpError(409, message);
  },
  unprocessable(message = 'Unprocessable Entity', details) {
    return createHttpError(422, message, details);
  },
  internal(message = 'Internal Server Error') {
    return createHttpError(500, message);
  },
};

export default HttpError;
