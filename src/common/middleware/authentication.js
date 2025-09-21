import HttpError from '../utils/http-errors.js';

export function authenticate(authService, options = {}) {
  return async (req, _res, next) => {
    const header = req.headers['authorization'] || req.headers['Authorization'];
    if (!header) {
      if (options.optional) {
        return next();
      }
      throw HttpError.unauthorized('Authorization header missing');
    }
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw HttpError.unauthorized('Invalid authorization header format');
    }
    const payload = authService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
    };
    return next();
  };
}

export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, _res, next) => {
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw HttpError.forbidden('You do not have access to this resource');
    }
    return next();
  };
}

export default {
  authenticate,
  requireRole,
};
