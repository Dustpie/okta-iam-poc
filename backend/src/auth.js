import { createRemoteJWKSet, jwtVerify } from 'jose';

const issuer = process.env.OIDC_ISSUER;
const audience = process.env.OIDC_AUDIENCE;

if (!issuer || !audience) {
  throw new Error('Missing OIDC_ISSUER or OIDC_AUDIENCE environment variables.');
}

const normalizedIssuer = issuer.replace(/\/$/, '');
let jwks = null;

const adminMarkers = new Set(['admin', 'read:admin', 'admin:read']);
const claimKeys = [
  'roles',
  'groups',
  'permissions',
  'https://example.com/roles',
  'https://example.com/groups',
  'https://example.com/permissions',
];

const getArrayClaim = (payload, key) => {
  const value = payload?.[key];
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value.split(' ').filter(Boolean);
  }
  return [];
};

const loadJwks = async () => {
  if (jwks) {
    return jwks;
  }

  const discoveryUrl = new URL('.well-known/openid-configuration', `${normalizedIssuer}/`);
  const response = await fetch(discoveryUrl);
  if (!response.ok) {
    throw new Error(`Failed to load OIDC discovery document: ${response.status}`);
  }

  const { jwks_uri: jwksUri } = await response.json();
  if (!jwksUri) {
    throw new Error('OIDC discovery document missing jwks_uri.');
  }

  jwks = createRemoteJWKSet(new URL(jwksUri));
  return jwks;
};

export const verifyAccessToken = async (token) => {
  const jwksSet = await loadJwks();
  const { payload } = await jwtVerify(token, jwksSet, {
    issuer: normalizedIssuer,
    audience,
  });
  return payload;
};

export const hasAdminAccess = (payload) => {
  const scopes = getArrayClaim(payload, 'scope');
  const scopeMatch = scopes.some((scope) => adminMarkers.has(scope));

  if (scopeMatch) {
    return true;
  }

  return claimKeys.some((key) => getArrayClaim(payload, key).some((value) => adminMarkers.has(value)));
};

export const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: 'missing_authorization' });
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'invalid_authorization' });
  }

  try {
    const payload = await verifyAccessToken(token);
    req.auth = payload;
    return next();
  } catch (error) {
    return res.status(401).json({
      error: 'invalid_token',
      message: error instanceof Error ? error.message : 'Token validation failed',
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.auth) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  if (!hasAdminAccess(req.auth)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  return next();
};

export const sanitizeClaims = (payload) => ({
  sub: payload.sub,
  iss: payload.iss,
  aud: payload.aud,
  iat: payload.iat,
  exp: payload.exp,
  scope: payload.scope,
  permissions: payload.permissions,
  roles: payload.roles ?? payload['https://example.com/roles'],
  groups: payload.groups ?? payload['https://example.com/groups'],
  email: payload.email,
  name: payload.name,
});
