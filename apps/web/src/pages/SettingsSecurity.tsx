import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Nav } from '../components/Nav';
import { useToast } from '../lib/useToast';
import { ValidationMessage } from '../components/ValidationMessage';

export function SettingsSecurity() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [validationError, setValidationError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/auth/profile')).data
  });

  const setupMfaMutation = useMutation({
    mutationFn: async () => (await api.post('/auth/mfa/setup')).data,
    onSuccess: (data) => {
      setMfaQrCode(data.qrCode);
      setMfaSecret(data.secret);
      setShowMfaSetup(true);
    },
    onError: () => {
      showToast('error', 'Failed to setup MFA');
    }
  });

  const verifyMfaMutation = useMutation({
    mutationFn: async (token: string) =>
      (await api.post('/auth/mfa/verify-setup', { token })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setShowMfaSetup(false);
      setMfaToken('');
      setMfaQrCode('');
      setMfaSecret('');
      showToast('success', 'MFA enabled successfully');
    },
    onError: () => {
      showToast('error', 'Invalid MFA token');
    }
  });

  const disableMfaMutation = useMutation({
    mutationFn: async () => api.post('/auth/mfa/disable'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('success', 'MFA disabled successfully');
    },
    onError: () => {
      showToast('error', 'Failed to disable MFA');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwords) =>
      (await api.post('/auth/change-password', data)).data,
    onSuccess: () => {
      setPasswords({ current: '', new: '', confirm: '' });
      setValidationError('');
      showToast('success', 'Password changed successfully');
    },
    onError: (err: any) => {
      setValidationError(err.response?.data?.message || 'Failed to change password');
    }
  });

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      setValidationError('Passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    setValidationError('');
    changePasswordMutation.mutate(passwords);
  };

  return (
    <>
      <Nav />
      <div style={{
        padding: '32px 24px',
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '8px'
          }}>
            Security Settings
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Manage your account security and authentication
          </p>
        </div>

        {/* MFA Section */}
        <div style={{
          padding: '24px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '4px'
              }}>
                Two-Factor Authentication
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Add an extra layer of security to your account
              </p>
            </div>
            <span style={{
              padding: '6px 16px',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '12px',
              backgroundColor: profile?.mfaEnabled
                ? 'rgba(76, 175, 80, 0.1)'
                : 'rgba(158, 158, 158, 0.1)',
              color: profile?.mfaEnabled ? 'var(--success)' : 'var(--text-secondary)'
            }}>
              {profile?.mfaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!showMfaSetup && (
            <button
              onClick={() => {
                if (profile?.mfaEnabled) {
                  disableMfaMutation.mutate();
                } else {
                  setupMfaMutation.mutate();
                }
              }}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: profile?.mfaEnabled ? 'transparent' : 'var(--accent-primary)',
                color: profile?.mfaEnabled ? 'var(--error)' : 'white',
                border: profile?.mfaEnabled ? '1px solid var(--error)' : 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {profile?.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
            </button>
          )}

          {showMfaSetup && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '16px'
              }}>
                Setup Instructions
              </h3>
              <ol style={{
                color: 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.8',
                paddingLeft: '20px',
                margin: '0 0 20px 0'
              }}>
                <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code below or enter the secret key manually</li>
                <li>Enter the 6-digit code from your app to verify</li>
              </ol>

              {mfaQrCode && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <img
                    src={mfaQrCode}
                    alt="MFA QR Code"
                    style={{
                      width: '200px',
                      height: '200px',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px',
                      backgroundColor: 'white'
                    }}
                  />
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    wordBreak: 'break-all',
                    textAlign: 'center'
                  }}>
                    {mfaSecret}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Verification Code
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
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => verifyMfaMutation.mutate(mfaToken)}
                  disabled={mfaToken.length !== 6}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: mfaToken.length === 6 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: mfaToken.length === 6 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Verify & Enable
                </button>
                <button
                  onClick={() => {
                    setShowMfaSetup(false);
                    setMfaToken('');
                    setMfaQrCode('');
                    setMfaSecret('');
                  }}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div style={{
          padding: '24px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '4px'
          }}>
            Change Password
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: '0 0 20px 0'
          }}>
            Update your password regularly to keep your account secure
          </p>

          {validationError && (
            <ValidationMessage message={validationError} type="error" />
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Current Password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              New Password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '8px'
            }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={!passwords.current || !passwords.new || !passwords.confirm}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: (passwords.current && passwords.new && passwords.confirm)
                ? 'var(--accent-primary)'
                : 'var(--text-tertiary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (passwords.current && passwords.new && passwords.confirm) ? 'pointer' : 'not-allowed'
            }}
          >
            Change Password
          </button>
        </div>
      </div>
    </>
  );
}
