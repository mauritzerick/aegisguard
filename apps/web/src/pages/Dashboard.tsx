import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Nav } from '../components/Nav';
import { useToast } from '../lib/useToast';

export function Dashboard() {
  const { showToast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        return (await api.get('/stats/dashboard')).data;
      } catch {
        return {
          logs_24h: 0,
          metrics_24h: 0,
          traces_24h: 0,
          active_monitors: 0,
          slo_count: 0
        };
      }
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Even if API call fails, proceed with logout on client side
        console.error('Logout API error:', error);
      }
      // Clear all cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      // Clear query cache
      window.location.href = '/login';
    },
    onSuccess: () => {
      showToast('success', 'Logged out successfully');
    },
    onError: () => {
      // Still redirect to login even if there's an error
      showToast('info', 'Logging out...');
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const features = [
    {
      title: 'Logs',
      description: 'Search and analyze application logs in real-time',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      link: '/logs',
      color: '#1565C0',
      stat: stats?.logs_24h ? `${(stats.logs_24h / 1000).toFixed(1)}k today` : null
    },
    {
      title: 'Metrics',
      description: 'Query and visualize time-series metrics',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      link: '/metrics',
      color: '#2E7D32',
      stat: stats?.metrics_24h ? `${(stats.metrics_24h / 1000).toFixed(1)}k today` : null
    },
    {
      title: 'Traces',
      description: 'Distributed tracing and waterfall views',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 17 10 11 14 15 22 7"/>
          <polyline points="18 7 22 7 22 11"/>
        </svg>
      ),
      link: '/traces',
      color: '#7B1FA2',
      stat: stats?.traces_24h ? `${stats.traces_24h} traces today` : null
    },
    {
      title: 'RUM',
      description: 'Real User Monitoring and Core Web Vitals',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      link: '/rum',
      color: '#D84315',
      stat: null
    },
    {
      title: 'Monitors',
      description: 'Configure alerts and notifications',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
      link: '/monitors',
      color: '#F57C00',
      stat: stats?.active_monitors ? `${stats.active_monitors} active` : null
    },
    {
      title: 'SLOs',
      description: 'Service Level Objectives and error budgets',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      link: '/slo',
      color: '#00897B',
      stat: stats?.slo_count ? `${stats.slo_count} configured` : null
    },
    {
      title: 'Users',
      description: 'Manage user accounts and roles',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      link: '/users',
      color: '#5E35B1',
      stat: null
    },
    {
      title: 'API Keys',
      description: 'Manage API keys for programmatic access',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
      ),
      link: '/api-keys',
      color: '#C62828',
      stat: null
    },
    {
      title: 'Security Events',
      description: 'Monitor security alerts and incidents',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      link: '/events',
      color: '#AD1457',
      stat: null
    },
    {
      title: 'Audit Logs',
      description: 'Complete audit trail of all activities',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      ),
      link: '/audit',
      color: '#455A64',
      stat: null
    },
    {
      title: 'Usage',
      description: 'Track usage metrics and billing',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      link: '/usage',
      color: '#558B2F',
      stat: null
    },
    {
      title: 'Settings',
      description: 'Account settings and security preferences',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6m-7-7h6m6 0h6"/>
          <path d="M19 19l-4.35-4.35m0-5.3L19 5M5 5l4.35 4.35m0 5.3L5 19"/>
        </svg>
      ),
      link: '/settings/security',
      color: '#6D4C41',
      stat: null
    },
    {
      title: 'Demo Hub',
      description: 'Explore demo features and one-click actions',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
      link: '/demo',
      color: '#FF6F00',
      stat: '🎪 Try it!'
    },
    {
      title: 'API Docs',
      description: 'Complete API reference and examples',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      ),
      link: '/docs',
      color: '#0277BD',
      stat: null
    },
    {
      title: 'Codebase Explanation',
      description: 'Explore the platform architecture',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
      link: '/codebase-explanation',
      color: '#00695C',
      stat: null
    },
    {
      title: 'Lessons Learned',
      description: 'Journal of mistakes, recovery, and wisdom gained',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      ),
      link: '/lessons',
      color: '#C62828',
      stat: '🎓 Learn'
    },
    {
      title: 'Developer Journal',
      description: 'Complete log of feature improvements and development timeline',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      link: '/developer-journal',
      color: '#1565C0',
      stat: '📝 Log'
    }
  ];

  return (
    <>
      <Nav />
      <div style={{
        padding: '32px 24px',
        maxWidth: '1600px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <h1 style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  AegisGuard
                </h1>
                <p style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  margin: 0
                }}>
                  Full-Stack Observability & Security Platform
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              style={{
                padding: '10px 20px',
                backgroundColor: logoutMutation.isPending ? 'var(--bg-tertiary)' : 'var(--error)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: logoutMutation.isPending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                opacity: logoutMutation.isPending ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!logoutMutation.isPending) {
                  e.currentTarget.style.backgroundColor = 'var(--error)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = logoutMutation.isPending ? 'var(--bg-tertiary)' : 'var(--error)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {logoutMutation.isPending ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" opacity="0.3"/>
                    <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round"/>
                  </svg>
                  Logging out...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {features.map((feature, idx) => (
            <Link
              key={idx}
              to={feature.link}
              style={{
                padding: '24px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = feature.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.1)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    backgroundColor: `${feature.color}15`,
                    color: feature.color
                  }}
                >
                  {feature.icon}
                </div>
                {feature.stat && (
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: `${feature.color}20`,
                    color: feature.color
                  }}>
                    {feature.stat}
                  </span>
                )}
              </div>

              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  marginBottom: '6px'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {feature.description}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: feature.color,
                fontSize: '13px',
                fontWeight: 500,
                marginTop: 'auto'
              }}>
                Open
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Banner */}
        <div style={{
          marginTop: '40px',
          padding: '24px',
          backgroundColor: 'rgba(21, 101, 192, 0.1)',
          border: '1px solid var(--accent-primary)',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            {[
              { label: 'Uptime', value: '99.9%' },
              { label: 'Response Time', value: '<50ms' },
              { label: 'Data Retention', value: '30 days' },
              { label: 'Support', value: '24/7' }
            ].map((stat, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  marginBottom: '4px'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          marginTop: '40px',
          padding: '24px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            Quick Links
          </h2>
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {[
              { label: '📚 Documentation', link: '/docs' },
              { label: '🔍 Codebase Guide', link: '/codebase-explanation' },
              { label: '🎓 Lessons Learned', link: '/lessons' },
              { label: '📝 Developer Journal', link: '/developer-journal' },
              { label: '📖 README', link: '/readme' },
              { label: '🎪 Demo Features', link: '/demo' },
              { label: '⚡ Live Tail', link: '/live-tail' },
              { label: '🪝 Webhook Playground', link: '/webhook' }
            ].map((quickLink, idx) => (
              <Link
                key={idx}
                to={quickLink.link}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                {quickLink.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
