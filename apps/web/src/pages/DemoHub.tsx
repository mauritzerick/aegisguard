import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Nav } from '../components/Nav';
import { useToast } from '../lib/useToast';

export function DemoHub() {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateLogsMutation = useMutation({
    mutationFn: async (count: number) => {
      setIsGenerating(true);
      return (await api.post('/playground/seed/logs', { count })).data;
    },
    onSuccess: () => {
      showToast('success', 'Logs generated successfully');
      setIsGenerating(false);
    },
    onError: (error: any) => {
      console.error('Generate logs error:', error);
      showToast('error', error.response?.data?.message || 'Failed to generate logs');
      setIsGenerating(false);
    }
  });

  const triggerSpikeMutation = useMutation({
    mutationFn: async (pattern: string) => {
      setIsGenerating(true);
      return (await api.post('/playground/seed/logs', { count: 1000, pattern })).data;
    },
    onSuccess: () => {
      showToast('success', 'Spike triggered successfully');
      setIsGenerating(false);
    },
    onError: (error: any) => {
      console.error('Trigger spike error:', error);
      showToast('error', error.response?.data?.message || 'Failed to trigger spike');
      setIsGenerating(false);
    }
  });

  const demoFeatures = [
    {
      title: 'Live Tail',
      description: 'Real-time log streaming via WebSocket with auto-scroll and filtering',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      link: '/live-tail',
      color: '#1565C0',
      badge: 'Real-time'
    },
    {
      title: 'Webhook Playground',
      description: 'Test HMAC signing and verification locally with instant feedback',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
      link: '/webhook',
      color: '#7B1FA2',
      badge: 'Interactive'
    },
    {
      title: 'Synthetic Checks',
      description: 'Local health monitoring with cron scheduler and alert inbox',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      link: '/checks',
      color: '#2E7D32',
      badge: 'Automated'
    }
  ];

  const demoActions = [
    {
      title: 'Generate 10k Logs',
      description: 'Create 10,000 synthetic log events across multiple services',
      action: () => {
        if (!isGenerating) {
          generateLogsMutation.mutate(10000);
        }
      },
      color: '#0277BD',
      icon: '📝'
    },
    {
      title: 'Trigger Auth Spike',
      description: 'Simulate authentication errors and failed login attempts',
      action: () => {
        if (!isGenerating) {
          triggerSpikeMutation.mutate('auth');
        }
      },
      color: '#D84315',
      icon: '🔐'
    },
    {
      title: 'Trigger DB Errors',
      description: 'Generate database timeout and connection error patterns',
      action: () => {
        if (!isGenerating) {
          triggerSpikeMutation.mutate('db');
        }
      },
      color: '#C62828',
      icon: '💾'
    },
    {
      title: 'Trigger Latency Spike',
      description: 'Create slow query and high latency event patterns',
      action: () => {
        if (!isGenerating) {
          triggerSpikeMutation.mutate('latency');
        }
      },
      color: '#F57C00',
      icon: '⏱️'
    }
  ];

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
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 111, 0, 0.1)',
              fontSize: '32px'
            }}>
              🎪
            </div>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Demo Hub
              </h1>
              <p style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Explore wow-factor features running 100% locally
              </p>
            </div>
          </div>

          <div style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(21, 101, 192, 0.1)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: '1.6'
            }}>
              <strong style={{ color: 'var(--accent-primary)' }}>💡 Tip:</strong> All demo features run offline with no external services. Perfect for demos, development, and learning!
            </p>
          </div>
        </div>

        {/* Demo Features Section */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px'
          }}>
            Interactive Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {demoFeatures.map((feature, idx) => (
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
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = feature.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
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
                  <span style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '12px',
                    backgroundColor: `${feature.color}20`,
                    color: feature.color
                  }}>
                    {feature.badge}
                  </span>
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
                  Try it now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* One-Click Actions Section */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px'
          }}>
            One-Click Actions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {demoActions.map((action, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  action.action();
                }}
                disabled={isGenerating}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: `2px solid ${action.color}`,
                  borderRadius: '8px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  opacity: isGenerating ? 0.6 : 1,
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.backgroundColor = `${action.color}10`;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '24px' }}>{action.icon}</span>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {action.title}
                  </h3>
                  {isGenerating && (
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--warning)',
                      fontWeight: 500
                    }}>
                      ⏳ Processing...
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {action.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Theme & Features Section */}
        <div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '20px'
          }}>
            Additional Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {[
              {
                title: 'Dark Mode',
                description: 'Instant theme switching with localStorage persistence and system preference detection',
                icon: '🌙',
                note: 'Toggle in navbar'
              },
              {
                title: 'Screenshot Export',
                description: 'Client-side PNG export of any dashboard using html-to-image library',
                icon: '📸',
                note: 'Coming soon'
              },
              {
                title: 'Mobile Responsive',
                description: 'Fully responsive design with swipeable cards and touch-optimized interactions',
                icon: '📱',
                note: 'Try it!'
              },
              {
                title: 'Offline First',
                description: 'All demo features run locally without any cloud services or external APIs',
                icon: '✈️',
                note: '100% Local'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '28px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0,
                      marginBottom: '4px'
                    }}>
                      {item.title}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      borderRadius: '8px',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: 'var(--success)'
                    }}>
                      {item.note}
                    </span>
                  </div>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div style={{
          marginTop: '48px',
          padding: '24px',
          backgroundColor: 'rgba(255, 111, 0, 0.1)',
          border: '1px solid #FF6F00',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <span style={{ fontSize: '32px' }}>💡</span>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '8px'
              }}>
                Development & Demo Tips
              </h3>
              <ul style={{
                paddingLeft: '20px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.8',
                margin: 0
              }}>
                <li>All demo data is stored locally in SQLite and localStorage</li>
                <li>Webhook playground uses Node crypto for HMAC signing</li>
                <li>Live tail connects to local WebSocket server on port 3001</li>
                <li>Synthetic checks use node-cron for scheduling</li>
                <li>No external API calls or cloud services required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
