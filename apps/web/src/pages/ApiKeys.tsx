import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Nav } from '../components/Nav';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../lib/useToast';

interface ApiKey {
  id: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  revokedAt: string | null;
}

export function ApiKeys() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:events']);
  const [createdKey, setCreatedKey] = useState<{ key: string; prefix: string } | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => (await api.get('/api-keys')).data
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; scopes: string[] }) =>
      (await api.post('/api-keys', data)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey({ key: data.key, prefix: data.prefix });
      setShowCreate(false);
      setNewKeyName('');
      setSelectedScopes(['read:events']);
      showToast('success', 'API key created successfully');
    },
    onError: () => {
      showToast('error', 'Failed to create API key');
    }
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setRevokeKeyId(null);
      showToast('success', 'API key revoked successfully');
    },
    onError: () => {
      showToast('error', 'Failed to revoke API key');
    }
  });

  const availableScopes = [
    'read:events',
    'write:events',
    'read:logs',
    'write:logs',
    'read:metrics',
    'write:metrics',
    'admin'
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied to clipboard');
  };

  return (
    <>
      <Nav />
      <div style={{
        padding: '32px 24px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: '8px'
            }}>
              API Keys
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Manage API keys for programmatic access
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Create API Key
          </button>
        </div>

        {/* Created Key Display */}
        {createdKey && (
          <div style={{
            padding: '24px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid var(--success)',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--success)',
              margin: 0,
              marginBottom: '12px'
            }}>
              API Key Created Successfully
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              Make sure to copy your API key now. You won't be able to see it again!
            </p>
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              marginBottom: '12px'
            }}>
              {createdKey.key}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => copyToClipboard(createdKey.key)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setCreatedKey(null)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div style={{
            padding: '24px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: '20px'
            }}>
              Create New API Key
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production Server"
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
                Scopes
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableScopes.map(scope => (
                  <label key={scope} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: selectedScopes.includes(scope)
                      ? 'rgba(21, 101, 192, 0.1)'
                      : 'var(--bg-primary)',
                    border: `1px solid ${selectedScopes.includes(scope) ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: 'var(--text-primary)'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScopes([...selectedScopes, scope]);
                        } else {
                          setSelectedScopes(selectedScopes.filter(s => s !== scope));
                        }
                      }}
                    />
                    {scope}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => createMutation.mutate({ name: newKeyName, scopes: selectedScopes })}
                disabled={!newKeyName || selectedScopes.length === 0}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: (!newKeyName || selectedScopes.length === 0)
                    ? 'var(--text-tertiary)'
                    : 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!newKeyName || selectedScopes.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewKeyName('');
                  setSelectedScopes(['read:events']);
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

        {/* Keys Table */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading API keys...
            </div>
          ) : !keys || keys.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                No API keys yet
              </p>
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Your First API Key
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Prefix
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Scopes
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Created
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key: ApiKey, idx: number) => (
                  <tr
                    key={key.id}
                    style={{
                      borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      color: 'var(--text-primary)'
                    }}>
                      {key.prefix}...
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {key.scopes.map(scope => (
                          <span
                            key={scope}
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              backgroundColor: 'rgba(21, 101, 192, 0.1)',
                              color: 'var(--accent-primary)',
                              borderRadius: '4px'
                            }}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        backgroundColor: key.revokedAt
                          ? 'rgba(198, 40, 40, 0.1)'
                          : 'rgba(76, 175, 80, 0.1)',
                        color: key.revokedAt ? 'var(--error)' : 'var(--success)'
                      }}>
                        {key.revokedAt ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px',
                      textAlign: 'right'
                    }}>
                      {!key.revokedAt && (
                        <button
                          onClick={() => setRevokeKeyId(key.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: 500,
                            backgroundColor: 'transparent',
                            color: 'var(--error)',
                            border: '1px solid var(--error)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {revokeKeyId && (
        <ConfirmModal
          isOpen={!!revokeKeyId}
          title="Revoke API Key"
          message="Are you sure you want to revoke this API key? This action cannot be undone and any applications using this key will lose access immediately."
          onConfirm={() => revokeMutation.mutate(revokeKeyId)}
          onCancel={() => setRevokeKeyId(null)}
          confirmText="Revoke"
          danger={true}
        />
      )}
    </>
  );
}
