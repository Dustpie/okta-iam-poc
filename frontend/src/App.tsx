import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';
import Profile from './Profile';
import { useEffect, useState } from 'react';

function App() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTimeout(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoadingTimeout(true);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [isLoading]);

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
        <h1 className="main-title">Welcome to Sample0</h1>
        
        {isAuthenticated ? (
          <div className="logged-in-section">
            <div className="logged-in-message">✅ Successfully authenticated!</div>
            <h2 className="profile-section-title">Your Profile</h2>
            <div className="profile-card">
              <Profile />
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
