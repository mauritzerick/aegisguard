import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Nav } from '../components/Nav';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  userId: string;
  userEmail: string;
  metadata: any;
  ipAddress: string;
  timestamp: string;
}

export function AuditLogs() {
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', action, resource, page],
    queryFn: async () =>
      (await api.get('/audit', {
        params: {
          action: action || undefined,
          resource: resource || undefined,
          page,
          limit
        }
      })).data
  });

  const getActionStyle = (action: string) => {
    const upper = action?.toUpperCase();
    if (upper?.startsWith('CREATE')) return { bg: 'rgba(76, 175, 80, 0.1)', color: 'var(--success)' };
    if (upper?.startsWith('DELETE')) return { bg: 'rgba(198, 40, 40, 0.1)', color: 'var(--error)' };
    if (upper?.startsWith('UPDATE')) return { bg: 'rgba(21, 101, 192, 0.1)', color: 'var(--accent-primary)' };
    if (upper?.startsWith('LOGIN')) return { bg: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0' };
    return { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
  };

  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '8px'
          }}>
            Audit Logs
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Complete audit trail of all system activities
          </p>
        </div>

        {/* Filters */}
        <div style={{
          padding: '24px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '16px'
          }}>
            Filter Logs
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              placeholder="Action (e.g., CREATE_USER)"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <input
              placeholder="Resource (e.g., user)"
              value={resource}
              onChange={(e) => {
                setResource(e.target.value);
                setPage(1);
              }}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={() => {
                setAction('');
                setResource('');
                setPage(1);
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
              Clear
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No audit logs found
            </div>
          ) : (
            <>
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
                      letterSpacing: '0.5px',
                      width: '180px'
                    }}>
                      Timestamp
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
                      Action
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
                      Resource
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
                      User
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
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: AuditLog, idx: number) => {
                    const actionStyle = getActionStyle(log.action);
                    return (
                      <tr
                        key={log.id}
                        style={{
                          borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none'
                        }}
                      >
                        <td style={{
                          padding: '16px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace'
                        }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '4px',
                            backgroundColor: actionStyle.bg,
                            color: actionStyle.color,
                            fontFamily: 'monospace'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{
                          padding: '16px',
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          fontFamily: 'monospace'
                        }}>
                          {log.resource}
                        </td>
                        <td style={{
                          padding: '16px',
                          fontSize: '14px',
                          color: 'var(--text-primary)'
                        }}>
                          {log.userEmail}
                        </td>
                        <td style={{
                          padding: '16px',
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace'
                        }}>
                          {log.ipAddress}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    Page {page} of {totalPages}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: page === 1 ? 'var(--bg-tertiary)' : 'transparent',
                        color: page === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        backgroundColor: page === totalPages ? 'var(--bg-tertiary)' : 'transparent',
                        color: page === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        cursor: page === totalPages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
