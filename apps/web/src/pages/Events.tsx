import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';
import { Nav } from '../components/Nav';

export function Events() {
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const { data, refetch, isLoading, error } = useQuery({ 
    queryKey: ['events', type, severity], 
    queryFn: async () => (await api.get('/security-events', { 
      params: { type: type || undefined, severity: severity || undefined } 
    })).data 
  });

  const getSeverityStyle = (sev: string) => {
    const s = sev?.toUpperCase();
    if (s === 'CRITICAL') return { bg: 'rgba(198, 40, 40, 0.1)', color: 'var(--error)' };
    if (s === 'HIGH') return { bg: 'rgba(245, 124, 0, 0.1)', color: 'var(--warning)' };
    if (s === 'MEDIUM') return { bg: 'rgba(251, 192, 45, 0.1)', color: '#FFA726' };
    if (s === 'LOW') return { bg: 'rgba(76, 175, 80, 0.1)', color: 'var(--success)' };
    return { bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '8px'
          }}>
            Security Events
          </h1>
          <p style={{ 
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Monitor and analyze security events in real-time
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
            Filter Events
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              placeholder="Event type" 
              value={type} 
              onChange={e => setType(e.target.value)}
              style={{ 
                flex: '1', 
                minWidth: '200px',
                padding: '10px 14px', 
                fontSize: '14px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px',
                color: 'var(--text-primary)'
              }}
            />
            <select 
              value={severity} 
              onChange={e => setSeverity(e.target.value)}
              style={{ 
                padding: '10px 14px', 
                fontSize: '14px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '4px',
                minWidth: '150px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <option value="">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <button 
              onClick={() => refetch()}
              style={{ 
                padding: '10px 20px', 
                fontSize: '14px', 
                fontWeight: 500,
                backgroundColor: 'var(--accent-primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Search
            </button>
            {(type || severity) && (
              <button 
                onClick={() => { setType(''); setSeverity(''); }}
                style={{ 
                  padding: '10px 20px', 
                  fontSize: '14px', 
                  fontWeight: 500,
                  backgroundColor: 'transparent', 
                  color: 'var(--text-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {isLoading && <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading events...</p>}
        
        {error && (
          <div style={{ 
            padding: '16px 20px', 
            backgroundColor: 'rgba(198, 40, 40, 0.1)', 
            border: '1px solid var(--error)',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--error)', margin: '0 0 8px 0' }}>
              Unable to Load Events
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              An error occurred while loading security events. Please refresh the page.
            </p>
          </div>
        )}
        
        {data && data.length === 0 && (
          <div style={{ 
            padding: '48px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px'
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#BDBDBD" strokeWidth="2" style={{ margin: '0 auto 16px' }}>
              <path d="M24 44c11 0 20-9 20-20S35 4 24 4 4 13 4 24s9 20 20 20z"/>
              <path d="M16 24l6 6 12-12"/>
            </svg>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              {type || severity ? 'No events match your filters' : 'No security events found'}
            </p>
          </div>
        )}

        {data && data.length > 0 && (
          <>
            <div style={{ 
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px',
                minWidth: '900px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ 
                      padding: '14px 20px', 
                      textAlign: 'left', 
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Timestamp</th>
                    <th style={{ 
                      padding: '14px 20px', 
                      textAlign: 'left', 
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Type</th>
                    <th style={{ 
                      padding: '14px 20px', 
                      textAlign: 'left', 
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Source</th>
                    <th style={{ 
                      padding: '14px 20px', 
                      textAlign: 'left', 
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Severity</th>
                    <th style={{ 
                      padding: '14px 20px', 
                      textAlign: 'left', 
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((event: any) => {
                    const sevStyle = getSeverityStyle(event.severity);
                    return (
                      <tr 
                        key={event.id} 
                        style={{ 
                          borderBottom: '1px solid #F5F5F5',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {new Date(event.receivedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {event.type}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                          {event.source}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '4px 10px', 
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            backgroundColor: sevStyle.bg,
                            color: sevStyle.color
                          }}>
                            {event.severity}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ 
                              color: 'var(--accent-primary)', 
                              fontWeight: 500,
                              fontSize: '13px',
                              listStyle: 'none'
                            }}>
                              View Payload
                            </summary>
                            <pre style={{ 
                              marginTop: '8px',
                              padding: '12px',
                              backgroundColor: '#F5F5F5',
                              borderRadius: '4px',
                              fontSize: '11px',
                              maxWidth: '400px',
                              overflow: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily: 'Monaco, Consolas, monospace'
                            }}>
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ 
              marginTop: '16px', 
              padding: '12px 16px', 
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Total Events:</strong> {data.length} (showing latest 100)
            </div>
          </>
        )}
      </div>
    </>
  );
}
