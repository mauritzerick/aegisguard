import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.mfaRequired) {
        setMfaRequired(true);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/mfa/verify', { email, mfaToken });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (mfaRequired) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary, #FFFFFF)',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: 'var(--bg-secondary, #F5F5F7)',
          border: '1px solid var(--border-color, #E0E0E0)',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.16))'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary, #1D1D1F)',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Two-Factor Authentication
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #6E6E73)',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            Enter the 6-digit code from your authenticator app
          </p>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(198, 40, 40, 0.1)',
              border: '1px solid var(--error)',
              borderRadius: '4px',
              marginBottom: '24px',
              color: 'var(--error)',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleMfaVerify}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                MFA Code
              </label>
              <input
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="000000"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '18px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || mfaToken.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: loading ? 'var(--text-tertiary)' : 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: mfaToken.length !== 6 ? 0.5 : 1
              }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => setMfaRequired(false)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary, #FFFFFF)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: 'var(--bg-secondary, #F5F5F7)',
        border: '1px solid var(--border-color, #E0E0E0)',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-lg, 0 4px 16px rgba(0,0,0,0.16))'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary, #1D1D1F)',
            marginBottom: '8px'
          }}>
            Welcome to AegisGuard
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #6E6E73)'
          }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(198, 40, 40, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: '4px',
            marginBottom: '24px',
            color: 'var(--error)',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary, #1D1D1F)',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aegis.local"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid var(--border-color, #E0E0E0)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary, #FFFFFF)',
                color: 'var(--text-primary, #1D1D1F)',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary, #1D1D1F)',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                border: '1px solid var(--border-color, #E0E0E0)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary, #FFFFFF)',
                color: 'var(--text-primary, #1D1D1F)',
                outline: 'none'
              }}
              required
            />
          </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: loading ? 'var(--text-tertiary, #86868B)' : 'var(--accent-primary, #1565C0)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
        </form>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: 'rgba(21, 101, 192, 0.1)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '4px'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            <strong style={{ color: 'var(--accent-primary)' }}>Demo Credentials:</strong><br />
            Email: admin@aegis.local<br />
            Password: ChangeMeNow!123
          </p>
        </div>
      </div>
    </div>
  );
}
