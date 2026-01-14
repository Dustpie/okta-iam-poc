# Okta IAM PoC (Auth0 SDK)

This PoC uses the Auth0 React SDK for developer accessibility and maps cleanly to Okta Workforce IAM concepts (OIDC, policies, group/role claims, MFA). The backend is a resource server that validates JWTs and enforces authorization server-side.

## Architecture

```
┌──────────────────────────────┐
│  Browser (React + Auth0 SDK) │
│  - login/logout              │
│  - gets access token         │
└──────────────┬───────────────┘
			   │ OIDC (Auth0)
			   ▼
┌──────────────────────────────┐
│ Auth0 Tenant (OIDC Provider) │
│ - issuer, JWKS               │
│ - roles/groups claims        │
└──────────────┬───────────────┘
			   │ Bearer JWT
			   ▼
┌──────────────────────────────┐
│ API (Express Resource Server)│
│ - JWT validation             │
│ - /me (auth required)        │
│ - /admin (role required)     │
└──────────────────────────────┘
```

## Quickstart (one command)

1) Copy .env.example → .env and fill in your tenant values.
2) Run:

```bash
docker compose up --build
```

Then open http://localhost:3000.

## Environment variables

- VITE_AUTH0_DOMAIN: Auth0 tenant domain
- VITE_AUTH0_CLIENT_ID: SPA client ID
- VITE_AUTH0_AUDIENCE: API audience
- VITE_AUTH0_REDIRECT_URI: SPA redirect URI
- VITE_API_BASE_URL: API base URL

- OIDC_ISSUER: OIDC issuer (Auth0 or Okta)
- OIDC_AUDIENCE: API audience (must match access token aud)
- FRONTEND_ORIGIN: CORS allowlist origin

## Security/correctness checks

The backend explicitly validates:

- JWT signature using JWKS
- issuer (iss)
- audience (aud)
- expiration (exp) via JWT verification

Authorization is enforced server-side:

- /me requires a valid token → 401 if missing/invalid
- /admin requires admin claim → 403 if authenticated but not authorized

Logout behavior is session-based (OIDC logout) and local token clearance. This is not token revocation.

## Demo script (5–7 minutes)

1) Log in as a normal user.
2) /me succeeds (200) and shows claims.
3) /admin returns 403.
4) Log out, then log in as admin.
5) /admin succeeds (200).
6) Show claims in /me and how roles/groups drive authorization.
7) Trigger MFA challenge (if enabled in tenant) and show it in the login flow.
8) Log out and point out what changed (session ended + local tokens cleared).

## Auth0 ↔ Okta Workforce mapping

| Auth0 Concept | Okta Workforce Concept |
| --- | --- |
| Tenant | Okta Org |
| Application (SPA/API) | Okta Application |
| Rules/Actions | Sign-on / Access Policies |
| Roles/Permissions Claims | Groups / App Role Claims |
| MFA | Okta MFA Policies |

Implementation note: this PoC uses Auth0 to keep signup simple, but the OIDC patterns map directly to Okta Workforce.

## Threat model (what’s validated and why)

- Validate issuer & audience to prevent token substitution attacks.
- Validate signature via JWKS to prevent forged tokens.
- Enforce authorization on the server so UI hiding isn’t trusted.
- Distinguish 401 vs 403 for proper authZ semantics.

## What I’d do next in production

- JWKS caching and key rotation strategy.
- Refresh token handling (rotation + reuse detection).
- Least-privilege scopes and per-route scope checks.
- Audit logging for auth events and admin actions.
