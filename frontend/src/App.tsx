import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import Profile from './Profile';
import { useEffect, useState } from 'react';

type ApiResult = {
  status: number;
  body: unknown;
};

function App() {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently } = useAuth0();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [meResult, setMeResult] = useState<ApiResult | null>(null);
  const [adminResult, setAdminResult] = useState<ApiResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLoadingTimeout(true);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMeResult(null);
      setAdminResult(null);
      setApiError(null);
      return;
    }

    if (!apiBaseUrl) {
      setApiError('Missing VITE_API_BASE_URL; cannot call backend.');
      return;
    }

    let cancelled = false;

    const fetchApi = async () => {
      setApiLoading(true);
      setApiError(null);

      try {
        const token = await getAccessTokenSilently();
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [meResponse, adminResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/me`, { headers }),
          fetch(`${apiBaseUrl}/admin`, { headers }),
        ]);

        const meBody = await meResponse.json().catch(() => null);
        const adminBody = await adminResponse.json().catch(() => null);

        if (!cancelled) {
          setMeResult({ status: meResponse.status, body: meBody });
          setAdminResult({ status: adminResponse.status, body: adminBody });
        }
      } catch (err) {
        if (!cancelled) {
          setApiError(err instanceof Error ? err.message : 'Failed to call API');
        }
      } finally {
        if (!cancelled) {
          setApiLoading(false);
        }
      }
    };

    fetchApi();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, getAccessTokenSilently, isAuthenticated]);

  if (isLoading && !loadingTimeout) {
    return (
      <div className="app-container">
        <div className="loading-state">
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        <div className="error-state">
          <div className="error-title">Oops!</div>
          <div className="error-message">Something went wrong</div>
          <div className="error-sub-message">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-card-wrapper">
        <img 
          src="https://cdn.auth0.com/quantum-assets/dist/latest/logos/auth0/auth0-lockup-en-ondark.png" 
          alt="Auth0 Logo" 
          className="auth0-logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="main-title">Okta IAM PoC (Auth0 SDK)</h1>
        
        {isAuthenticated ? (
          <div className="logged-in-section">
            <div className="logged-in-message">✅ Successfully authenticated!</div>
            <h2 className="profile-section-title">Your Profile</h2>
            <div className="profile-card">
              <Profile />
            </div>
            <div
              style={{
                marginTop: '1.5rem',
                width: '100%',
                background: '#1f232b',
                padding: '1rem',
                borderRadius: '12px',
              }}
            >
              <h2 style={{ marginTop: 0 }}>API Authorization Checks</h2>
              {apiLoading && <div className="loading-text">Calling API...</div>}
              {apiError && (
                <div className="error-sub-message" style={{ marginBottom: '0.75rem' }}>
                  {apiError}
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600 }}>/me</div>
                <div>Status: {meResult?.status ?? '—'}</div>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                  {meResult ? JSON.stringify(meResult.body, null, 2) : 'Not called'}
                </pre>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>/admin</div>
                <div>Status: {adminResult?.status ?? '—'}</div>
                <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                  {adminResult ? JSON.stringify(adminResult.body, null, 2) : 'Not called'}
                </pre>
              </div>
            </div>
            <LogoutButton />
          </div>
        ) : (
          <div className="action-card">
            <p className="action-text">Get started by signing in to your account</p>
            <LoginButton />
          </div>
        )}
        {loadingTimeout && (
          <div
            style={{
              marginTop: '1.5rem',
              fontSize: '0.9rem',
              color: '#cbd5e0',
              background: '#1f232b',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Debug info</div>
            <div>isLoading: {String(isLoading)}</div>
            <div>isAuthenticated: {String(isAuthenticated)}</div>
            <div>origin: {window.location.origin}</div>
            <div>href: {window.location.href}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
