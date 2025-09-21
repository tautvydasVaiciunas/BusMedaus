import crypto from 'crypto';

function base64UrlEncode(input) {
  return Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  const pad = 4 - (str.length % 4 || 4);
  const normalized = `${str}${'='.repeat(pad === 4 ? 0 : pad)}`
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
}

function createSignature(unsignedToken, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwt(payload, secret, options = {}) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  const timestamp = Math.floor(Date.now() / 1000);
  const claims = {
    iat: timestamp,
    ...payload,
  };
  if (options.expiresIn) {
    claims.exp = timestamp + options.expiresIn;
  }
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(claims);
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(unsigned, secret);
  return `${unsigned}.${signature}`;
}

export function verifyJwt(token, secret) {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token format');
  }
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expected = createSignature(unsigned, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Invalid token signature');
  }
  const payload = base64UrlDecode(encodedPayload);
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired');
  }
  return payload;
}

export default {
  signJwt,
  verifyJwt,
};
