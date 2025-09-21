const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireFields(payload, fields) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
  if (missing.length) {
    throw Object.assign(new Error(`Missing required fields: ${missing.join(', ')}`), {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { missing },
    });
  }
}

export function validateEmail(value) {
  if (!emailRegex.test(String(value).toLowerCase())) {
    throw Object.assign(new Error('Invalid email address'), {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { field: 'email' },
    });
  }
}

export function validateEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw Object.assign(new Error(`Invalid value for ${field}`), {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { field, allowed },
    });
  }
}

export function validateStringLength(value, field, min = 1, max = 255) {
  if (typeof value !== 'string') {
    throw Object.assign(new Error(`${field} must be a string`), {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { field },
    });
  }
  if (value.length < min || value.length > max) {
    throw Object.assign(new Error(`${field} must be between ${min} and ${max} characters`), {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { field, min, max },
    });
  }
}

export function validateOptionalDate(value, field) {
  if (value === undefined || value === null || value === '') {
    return;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw Object.assign(new Error(`${field} must be a valid ISO date`), {
      status: 400,
      code: 'VALIDATION_ERROR',
      details: { field },
    });
  }
}

export function validatePagination(query) {
  const limit = query.limit ? Number.parseInt(query.limit, 10) : 25;
  const page = query.page ? Number.parseInt(query.page, 10) : 1;
  return {
    limit: Number.isNaN(limit) ? 25 : Math.min(Math.max(limit, 1), 100),
    page: Number.isNaN(page) ? 1 : Math.max(page, 1),
  };
}

export function pick(object, fields) {
  return fields.reduce((result, field) => {
    if (object[field] !== undefined) {
      result[field] = object[field];
    }
    return result;
  }, {});
}

export function sanitizeForAudit(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }
  const clone = JSON.parse(JSON.stringify(body));
  if (clone.password) {
    clone.password = '[REDACTED]';
  }
  if (clone.newPassword) {
    clone.newPassword = '[REDACTED]';
  }
  if (clone.confirmPassword) {
    clone.confirmPassword = '[REDACTED]';
  }
  return clone;
}

export default {
  requireFields,
  validateEmail,
  validateEnum,
  validateStringLength,
  validateOptionalDate,
  validatePagination,
  pick,
  sanitizeForAudit,
};
