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

// SVG Icons for actions
const ActionIcons = {
  CREATE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
    </svg>
  ),
  DELETE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round"/>
    </svg>
  ),
  UPDATE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
    </svg>
  ),
  LOGIN: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round"/>
    </svg>
  ),
  DEFAULT: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round"/>
    </svg>
  ),
};

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
    if (upper?.startsWith('CREATE')) return { 
      bg: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(56, 142, 60, 0.1) 100%)', 
      color: '#4CAF50',
      border: '1px solid rgba(76, 175, 80, 0.3)',
      glow: '0 0 12px rgba(76, 175, 80, 0.3)',
      icon: ActionIcons.CREATE
    };
    if (upper?.startsWith('DELETE')) return { 
      bg: 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(198, 40, 40, 0.1) 100%)', 
      color: '#F44336',
      border: '1px solid rgba(244, 67, 54, 0.3)',
      glow: '0 0 12px rgba(244, 67, 54, 0.3)',
      icon: ActionIcons.DELETE
    };
    if (upper?.startsWith('UPDATE')) return { 
      bg: 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(21, 101, 192, 0.1) 100%)', 
      color: '#2196F3',
      border: '1px solid rgba(33, 150, 243, 0.3)',
      glow: '0 0 12px rgba(33, 150, 243, 0.3)',
      icon: ActionIcons.UPDATE
    };
    if (upper?.startsWith('LOGIN')) return { 
      bg: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(123, 31, 162, 0.1) 100%)', 
      color: '#9C27B0',
      border: '1px solid rgba(156, 39, 176, 0.3)',
      glow: '0 0 12px rgba(156, 39, 176, 0.3)',
      icon: ActionIcons.LOGIN
    };
    return { 
      bg: 'linear-gradient(135deg, rgba(158, 158, 158, 0.1) 0%, rgba(97, 97, 97, 0.05) 100%)', 
      color: 'var(--text-secondary)',
      border: '1px solid rgba(158, 158, 158, 0.2)',
      glow: 'none',
      icon: ActionIcons.DEFAULT
    };
  };

  const logs = data?.logs || [];
  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <>
      <Nav />
      <div style={{
        padding: '32px 24px',
        maxWidth: '1600px',
        margin: '0 auto',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
        minHeight: '100vh',
        position: 'relative' as const,
      }}>
        {/* Animated background gradient overlay */}
        <div style={{
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(156, 39, 176, 0.05) 50%, rgba(76, 175, 80, 0.05) 100%)',
          opacity: 0.6,
          pointerEvents: 'none' as const,
          zIndex: 0,
        }} />
        
        <div style={{ position: 'relative' as const, zIndex: 1 }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2196F3 0%, #9C27B0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                  <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
              </div>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2196F3 0%, #9C27B0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  margin: 0,
                  marginBottom: '4px',
                  letterSpacing: '-0.02em',
                }}>
                  Audit Logs
                </h1>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  fontWeight: 400,
                }}>
                  Complete audit trail of all system activities • Real-time monitoring
                </p>
              </div>
            </div>
          </div>

          {/* Filters - Glassmorphism Card */}
          <div style={{
            padding: '28px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            marginBottom: '32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                Filter Logs
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '240px', position: 'relative' as const }}>
                <input
                  placeholder="Action (e.g., CREATE_USER)"
                  value={action}
                  onChange={(e) => {
                    setAction(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    fontSize: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    color: 'var(--text-primary)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid var(--accent-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '240px', position: 'relative' as const }}>
                <input
                  placeholder="Resource (e.g., user)"
                  value={resource}
                  onChange={(e) => {
                    setResource(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    fontSize: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    color: 'var(--text-primary)',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.border = '1px solid var(--accent-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <button
                onClick={() => {
                  setAction('');
                  setResource('');
                  setPage(1);
                }}
                style={{
                  padding: '14px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(198, 40, 40, 0.15) 100%)',
                  color: '#F44336',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Logs Table - Futuristic Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}>
            {isLoading ? (
              <div style={{ 
                padding: '64px', 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '3px solid rgba(33, 150, 243, 0.3)',
                  borderTop: '3px solid var(--accent-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>Loading audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div style={{ 
                padding: '64px', 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                    <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                  </svg>
                </div>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>No audit logs found</p>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={{ width: '100%', borderCollapse: 'separate' as const, borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
                        borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                      }}>
                        <th style={{
                          padding: '18px 20px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          width: '200px',
                          fontFamily: 'monospace',
                        }}>
                          Timestamp
                        </th>
                        <th style={{
                          padding: '18px 20px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}>
                          Action
                        </th>
                        <th style={{
                          padding: '18px 20px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}>
                          Resource
                        </th>
                        <th style={{
                          padding: '18px 20px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}>
                          User
                        </th>
                        <th style={{
                          padding: '18px 20px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
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
                              borderTop: idx > 0 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <td style={{
                              padding: '20px',
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                              fontFamily: 'monospace',
                              fontWeight: 500,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.5}>
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="M12 6v6l4 2" strokeLinecap="round"/>
                                </svg>
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </td>
                            <td style={{ padding: '20px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '8px',
                                background: actionStyle.bg,
                                color: actionStyle.color,
                                border: actionStyle.border,
                                fontFamily: 'monospace',
                                boxShadow: actionStyle.glow,
                                transition: 'all 0.3s ease',
                              }}>
                                {actionStyle.icon}
                                {log.action}
                              </span>
                            </td>
                            <td style={{
                              padding: '20px',
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              fontFamily: 'monospace',
                              fontWeight: 500,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.5}>
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                </svg>
                                {log.resource}
                              </div>
                            </td>
                            <td style={{
                              padding: '20px',
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.5}>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                                {log.userEmail}
                              </div>
                            </td>
                            <td style={{
                              padding: '20px',
                              fontSize: '13px',
                              color: 'var(--text-secondary)',
                              fontFamily: 'monospace',
                              fontWeight: 500,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.5}>
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                </svg>
                                {log.ipAddress}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination - Futuristic */}
                {totalPages > 1 && (
                  <div style={{
                    padding: '24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.05)',
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      fontWeight: 500,
                      fontFamily: 'monospace',
                    }}>
                      Page <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{page}</span> of {totalPages}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: 600,
                          background: page === 1 
                            ? 'rgba(158, 158, 158, 0.1)' 
                            : 'linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(156, 39, 176, 0.2) 100%)',
                          color: page === 1 ? 'var(--text-tertiary)' : 'var(--accent-primary)',
                          border: page === 1 
                            ? '1px solid rgba(158, 158, 158, 0.2)' 
                            : '1px solid rgba(33, 150, 243, 0.3)',
                          borderRadius: '10px',
                          cursor: page === 1 ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          if (page !== 1) {
                            e.currentTarget.style.transform = 'translateX(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M15 18l-6-6 6-6" strokeLinecap="round"/>
                        </svg>
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{
                          padding: '12px 20px',
                          fontSize: '14px',
                          fontWeight: 600,
                          background: page === totalPages 
                            ? 'rgba(158, 158, 158, 0.1)' 
                            : 'linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(156, 39, 176, 0.2) 100%)',
                          color: page === totalPages ? 'var(--text-tertiary)' : 'var(--accent-primary)',
                          border: page === totalPages 
                            ? '1px solid rgba(158, 158, 158, 0.2)' 
                            : '1px solid rgba(33, 150, 243, 0.3)',
                          borderRadius: '10px',
                          cursor: page === totalPages ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          if (page !== totalPages) {
                            e.currentTarget.style.transform = 'translateX(2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        Next
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
