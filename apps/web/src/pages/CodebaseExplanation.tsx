import { useState } from 'react';
import { Nav } from '../components/Nav';

export function CodebaseExplanation() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', title: 'Overview' },
    { id: 'architecture', title: 'Architecture' },
    { id: 'backend', title: 'Backend' },
    { id: 'frontend', title: 'Frontend' },
    { id: 'security', title: 'Security' },
    { id: 'database', title: 'Database' }
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
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '8px'
          }}>
            Codebase Explanation
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Comprehensive guide to the AegisGuard platform architecture and implementation
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '2px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : 'none',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          padding: '32px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          {activeTab === 'overview' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Platform Overview
              </h2>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '24px'
              }}>
                AegisGuard is a full-stack observability platform built with enterprise-grade security and multi-tenant isolation. The codebase is organized into several key areas:
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                {[
                  {
                    title: 'Ingestion Layer',
                    desc: 'REST API endpoints with HMAC verification, rate limiting, and data validation for logs, metrics, traces, and RUM.',
                    files: '4 controllers, 3 guards, 2 DTOs'
                  },
                  {
                    title: 'Processing Layer',
                    desc: 'Background workers using Redis Streams for PII scrubbing, data enrichment, and normalization.',
                    files: '1 worker, 2 services'
                  },
                  {
                    title: 'Storage Layer',
                    desc: 'Multi-database architecture: ClickHouse for logs/traces, TimescaleDB for metrics, PostgreSQL for metadata.',
                    files: '3 storage services, 1 ORM'
                  },
                  {
                    title: 'Query Layer',
                    desc: 'Query APIs supporting LogQL-lite, PromQL-lite, and trace search with org-level isolation.',
                    files: '1 controller, 1 DTO'
                  },
                  {
                    title: 'Security Layer',
                    desc: 'JWT auth, MFA/TOTP, RBAC, CSRF protection, API keys, audit logging, and IP allowlisting.',
                    files: '7 controllers, 5 guards, 2 services'
                  },
                  {
                    title: 'Frontend',
                    desc: 'React SPA with TanStack Query, custom charts, real-time updates, and responsive design.',
                    files: '15 pages, 8 components, 5 utilities'
                  }
                ].map((area, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px'
                    }}
                  >
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>
                      {area.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6',
                      marginBottom: '12px'
                    }}>
                      {area.desc}
                    </p>
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--accent-primary)',
                      fontWeight: 500
                    }}>
                      {area.files}
                    </span>
                  </div>
                ))}
              </div>

              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '16px'
              }}>
                Key Statistics
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {[
                  { label: 'Backend Files', value: '60+' },
                  { label: 'Frontend Files', value: '28+' },
                  { label: 'API Endpoints', value: '50+' },
                  { label: 'Database Models', value: '14' },
                  { label: 'Guards & Middleware', value: '8' },
                  { label: 'Background Workers', value: '3' }
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '20px',
                      backgroundColor: 'rgba(21, 101, 192, 0.1)',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      marginBottom: '4px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      fontSize: '13px',
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
          )}

          {activeTab === 'architecture' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                System Architecture
              </h2>
              
              <div style={{
                padding: '20px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                marginBottom: '24px',
                overflow: 'auto'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.6'
                }}>
{`┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                         │
│  (Agents, SDKs, Browser, Mobile, Server-side collectors)       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │      INGESTION GATEWAY            │
         │  ┌─────────────────────────────┐  │
         │  │  NestJS API (:3000)         │  │
         │  │  - POST /v1/logs            │  │
         │  │  - POST /v1/metrics         │  │
         │  │  - POST /v1/traces          │  │
         │  │  - POST /v1/rum             │  │
         │  └─────────────────────────────┘  │
         │  ┌─────────────────────────────┐  │
         │  │  Guards & Middleware        │  │
         │  │  - IngestAuthGuard (HMAC)   │  │
         │  │  - RateLimitGuard           │  │
         │  │  - IdempotencyService       │  │
         │  └─────────────────────────────┘  │
         └────────────┬──────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │    REDIS STREAMS           │
         │    Message Queue           │
         │  - logs-stream             │
         │  - metrics-stream          │
         │  - traces-stream           │
         └────────────┬───────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   NORMALIZER WORKER        │
         │  ┌──────────────────────┐  │
         │  │  PIIScrubberService  │  │
         │  │  - Credit cards      │  │
         │  │  - SSN, Emails, IPs  │  │
         │  └──────────────────────┘  │
         │  ┌──────────────────────┐  │
         │  │  EnrichmentService   │  │
         │  │  - GeoIP lookup      │  │
         │  │  - UA parsing        │  │
         │  └──────────────────────┘  │
         └────────────┬───────────────┘
                      │
         ┌────────────┴───────────────┐
         │                            │
         ▼                            ▼
┌─────────────────┐        ┌─────────────────┐
│   CLICKHOUSE    │        │  TIMESCALEDB    │
│  - Logs table   │        │  - Metrics      │
│  - Spans table  │        │  - Aggregates   │
│  - RUM events   │        └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         QUERY API                   │
│  - POST /logs/search                │
│  - POST /metrics/query              │
│  - GET /traces/:id                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│      REACT FRONTEND (:5173)          │
│  - Dashboard, Logs, Metrics, Traces  │
│  - Monitors, SLOs, Usage             │
│  - Admin: Users, API Keys, Security  │
└──────────────────────────────────────┘`}
                </pre>
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '12px'
              }}>
                Data Flow
              </h2>
              <ol style={{
                paddingLeft: '24px',
                color: 'var(--text-primary)',
                lineHeight: '1.8',
                fontSize: '15px'
              }}>
                <li><strong>Ingestion:</strong> Client sends telemetry data with API key + optional HMAC signature</li>
                <li><strong>Validation:</strong> Ingest guards verify auth, check rate limits, validate schema</li>
                <li><strong>Queueing:</strong> Valid events are pushed to Redis Streams for async processing</li>
                <li><strong>Normalization:</strong> Worker processes events (PII scrubbing, enrichment, dedup)</li>
                <li><strong>Storage:</strong> Normalized data written to ClickHouse/TimescaleDB based on type</li>
                <li><strong>Query:</strong> Frontend queries data via query API with org-level filtering</li>
                <li><strong>Display:</strong> React components render charts, tables, and visualizations</li>
              </ol>
            </div>
          )}

          {activeTab === 'backend' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Backend Structure
              </h2>

              {[
                {
                  title: 'Ingestion Module',
                  path: 'apps/api/src/modules/ingest/',
                  files: [
                    { name: 'ingest.controller.ts', desc: 'REST endpoints for logs, metrics, traces, RUM' },
                    { name: 'ingest-auth.guard.ts', desc: 'HMAC signature verification + API key validation' },
                    { name: 'rate-limit.guard.ts', desc: 'Token bucket rate limiting per org/IP' },
                    { name: 'ingest.dto.ts', desc: 'Zod validation schemas for all telemetry types' }
                  ]
                },
                {
                  title: 'Query Module',
                  path: 'apps/api/src/modules/query/',
                  files: [
                    { name: 'query.controller.ts', desc: 'LogQL-lite, PromQL-lite, trace search endpoints' },
                    { name: 'query.dto.ts', desc: 'Query parameter validation and sanitization' }
                  ]
                },
                {
                  title: 'Normalizer Worker',
                  path: 'apps/api/src/workers/normalizer/',
                  files: [
                    { name: 'normalizer.worker.ts', desc: 'Background processor consuming Redis Streams' },
                    { name: 'pii-scrubber.service.ts', desc: 'PII detection (SSN, CC, email, IP) with redaction' },
                    { name: 'enrichment.service.ts', desc: 'GeoIP lookup, User-Agent parsing, timestamp normalization' }
                  ]
                },
                {
                  title: 'Storage Services',
                  path: 'apps/api/src/services/',
                  files: [
                    { name: 'clickhouse.service.ts', desc: 'ClickHouse client for logs, traces, RUM events' },
                    { name: 'timescale.service.ts', desc: 'TimescaleDB for metrics + continuous aggregates' },
                    { name: 'redis-streams.service.ts', desc: 'Message queue producer/consumer' },
                    { name: 'prisma.service.ts', desc: 'PostgreSQL ORM for metadata' }
                  ]
                },
                {
                  title: 'Auth & Security',
                  path: 'apps/api/src/modules/auth/',
                  files: [
                    { name: 'auth.controller.ts', desc: 'Login, logout, MFA setup/verify, token refresh' },
                    { name: 'auth.service.ts', desc: 'JWT generation, password hashing (Argon2id)' },
                    { name: 'mfa.service.ts', desc: 'TOTP implementation with QR code generation' },
                    { name: 'auth.guard.ts', desc: 'JWT validation from httpOnly cookies' },
                    { name: 'rbac.guard.ts', desc: 'Permission-based access control' },
                    { name: 'csrf.guard.ts', desc: 'Double-submit cookie CSRF protection' },
                    { name: 'ip-allow.guard.ts', desc: 'IP allowlist checking' }
                  ]
                },
                {
                  title: 'Admin Modules',
                  path: 'apps/api/src/modules/',
                  files: [
                    { name: 'users/users.controller.ts', desc: 'User CRUD with role management' },
                    { name: 'apikeys/apikeys.controller.ts', desc: 'API key generation, scoping, revocation' },
                    { name: 'roles/roles.controller.ts', desc: 'Role and permission management' },
                    { name: 'audit/audit.controller.ts', desc: 'Audit log queries with filtering' },
                    { name: 'audit/audit.service.ts', desc: 'Immutable audit logging' }
                  ]
                }
              ].map((module, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '32px',
                    padding: '20px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px'
                  }}
                >
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>
                    {module.title}
                  </h3>
                  <code style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                    marginBottom: '16px'
                  }}>
                    {module.path}
                  </code>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {module.files.map((file, fileIdx) => (
                      <div
                        key={fileIdx}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'var(--accent-primary)',
                          fontFamily: 'monospace',
                          marginBottom: '4px'
                        }}>
                          {file.name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5'
                        }}>
                          {file.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'frontend' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Frontend Structure
              </h2>

              {[
                {
                  title: 'Observability Pages',
                  path: 'apps/web/src/pages/',
                  files: [
                    { name: 'Logs.tsx', desc: 'Log search with filters, full-text search, live tail' },
                    { name: 'Metrics.tsx', desc: 'PromQL query editor with time-series charts' },
                    { name: 'Traces.tsx', desc: 'Trace search + waterfall visualization' },
                    { name: 'RUM.tsx', desc: 'Real User Monitoring dashboard (Core Web Vitals)' },
                    { name: 'Monitors.tsx', desc: 'Alert management with threshold configuration' },
                    { name: 'SLOs.tsx', desc: 'SLO tracking with error budget calculations' },
                    { name: 'Usage.tsx', desc: 'Usage metrics and billing information' }
                  ]
                },
                {
                  title: 'Admin Pages',
                  path: 'apps/web/src/pages/',
                  files: [
                    { name: 'Dashboard.tsx', desc: 'Homepage with 15 quick-access cards' },
                    { name: 'Login.tsx', desc: 'Authentication with MFA support' },
                    { name: 'Users.tsx', desc: 'User management with role assignment' },
                    { name: 'ApiKeys.tsx', desc: 'API key CRUD with scope selection' },
                    { name: 'Events.tsx', desc: 'Security events browser with severity filtering' },
                    { name: 'AuditLogs.tsx', desc: 'Audit trail with pagination' },
                    { name: 'SettingsSecurity.tsx', desc: 'MFA setup, password change' }
                  ]
                },
                {
                  title: 'Demo Features',
                  path: 'apps/web/src/pages/',
                  files: [
                    { name: 'DemoHub.tsx', desc: 'One-click demo actions (seed data, trigger spikes)' },
                    { name: 'LiveTail.tsx', desc: 'Real-time log streaming via WebSocket' },
                    { name: 'WebhookPlayground.tsx', desc: 'HMAC signing/verification tester' },
                    { name: 'SyntheticChecks.tsx', desc: 'Local health check monitoring' }
                  ]
                },
                {
                  title: 'Components',
                  path: 'apps/web/src/components/',
                  files: [
                    { name: 'TimeSeriesChart.tsx', desc: 'Custom SVG time-series chart renderer' },
                    { name: 'LogViewer.tsx', desc: 'Log entry display with JSON expansion' },
                    { name: 'Nav.tsx', desc: 'Main navigation bar with theme toggle' },
                    { name: 'Toast.tsx', desc: 'Notification system (success/error/info)' },
                    { name: 'ConfirmModal.tsx', desc: 'Confirmation dialog for destructive actions' },
                    { name: 'ValidationMessage.tsx', desc: 'Form validation error display' },
                    { name: 'ThemeToggle.tsx', desc: 'Dark/light/system theme switcher' },
                    { name: 'AuthDebug.tsx', desc: 'Debug panel for auth state' }
                  ]
                },
                {
                  title: 'Utilities',
                  path: 'apps/web/src/lib/',
                  files: [
                    { name: 'api.ts', desc: 'Axios client with interceptors and observability API' },
                    { name: 'queryClient.ts', desc: 'TanStack Query configuration' },
                    { name: 'useToast.tsx', desc: 'Toast hook and context provider' },
                    { name: 'ws.ts', desc: 'WebSocket client with auto-reconnect' },
                    { name: 'screenshot.ts', desc: 'Client-side screenshot export utility' },
                    { name: 'themeStore.ts', desc: 'Zustand store for theme state' }
                  ]
                }
              ].map((section, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '32px',
                    padding: '20px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px'
                  }}
                >
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>
                    {section.title}
                  </h3>
                  <code style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                    marginBottom: '16px'
                  }}>
                    {section.path}
                  </code>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {section.files.map((file, fileIdx) => (
                      <div
                        key={fileIdx}
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: 'var(--accent-primary)',
                          fontFamily: 'monospace',
                          marginBottom: '4px'
                        }}>
                          {file.name}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5'
                        }}>
                          {file.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Security Implementation
              </h2>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: '6px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--success)',
                  marginBottom: '12px'
                }}>
                  Security Layers
                </h3>
                <ul style={{
                  paddingLeft: '24px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.8',
                  margin: 0
                }}>
                  <li>Authentication: JWT access (5m) + refresh tokens (7d), TOTP MFA</li>
                  <li>Authorization: RBAC with Admin/Editor/Viewer roles + granular permissions</li>
                  <li>Ingestion: HMAC-SHA256 signature verification + API key validation</li>
                  <li>CSRF: Double-submit cookie pattern</li>
                  <li>Rate Limiting: Token bucket per org + per IP</li>
                  <li>PII Protection: Automatic scrubbing of SSN, CC, emails, IPs</li>
                  <li>Audit Logging: Immutable trail with PostgreSQL triggers</li>
                  <li>IP Allowlisting: Configurable per user/org</li>
                </ul>
              </div>

              {[
                {
                  title: 'Authentication Flow',
                  steps: [
                    'User submits email/password to POST /auth/login',
                    'Server validates credentials (Argon2id hash verification)',
                    'If MFA enabled, return mfaRequired=true',
                    'User submits TOTP code to POST /auth/mfa/verify',
                    'Server issues JWT access token (5m) + refresh token (7d)',
                    'Tokens stored in httpOnly, secure, sameSite cookies',
                    'Client includes cookies automatically on subsequent requests',
                    'Access token validated by AuthGuard on protected routes',
                    'Refresh token rotated on POST /auth/refresh before expiry'
                  ]
                },
                {
                  title: 'HMAC Signature Verification',
                  steps: [
                    'Client generates payload: JSON.stringify(requestBody)',
                    'Client computes: HMAC-SHA256(payload, secretKey)',
                    'Client sends x-signature: sha256={computed_hash}',
                    'Server retrieves secretKey for organization',
                    'Server recomputes HMAC with received payload',
                    'Server compares signatures using constant-time comparison',
                    'Reject request if signatures mismatch',
                    'Check timestamp to prevent replay attacks (±5min window)'
                  ]
                },
                {
                  title: 'PII Scrubbing Process',
                  steps: [
                    'Worker receives event from Redis Stream',
                    'PIIScrubberService scans message and attributes',
                    'Regex patterns detect: SSN, credit cards (Luhn), emails, IPs',
                    'Key-based detection: fields like "password", "token", "secret"',
                    'Detected PII replaced with [REDACTED:type]',
                    'Original hash stored for correlation (optional)',
                    'Scrubbed event written to ClickHouse/TimescaleDB',
                    'Audit log records PII redaction event'
                  ]
                }
              ].map((flow, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '24px',
                    padding: '20px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px'
                  }}
                >
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '16px'
                  }}>
                    {flow.title}
                  </h3>
                  <ol style={{
                    paddingLeft: '24px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.8',
                    margin: 0
                  }}>
                    {flow.steps.map((step, stepIdx) => (
                      <li key={stepIdx} style={{ marginBottom: '8px' }}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Database Architecture
              </h2>

              <div style={{
                display: 'grid',
                gap: '24px',
                marginBottom: '32px'
              }}>
                {[
                  {
                    db: 'ClickHouse',
                    purpose: 'Columnar storage for logs, traces, and RUM events',
                    tables: [
                      { name: 'logs', desc: 'timestamp, org_id, service, level, message, attributes (JSON), trace_id' },
                      { name: 'spans', desc: 'timestamp, org_id, trace_id, span_id, parent_span_id, name, duration_ms' },
                      { name: 'rum_events', desc: 'timestamp, org_id, session_id, event_type, url, metrics (JSON)' }
                    ]
                  },
                  {
                    db: 'TimescaleDB',
                    purpose: 'Time-series database for metrics with automatic aggregation',
                    tables: [
                      { name: 'metrics', desc: 'timestamp, org_id, metric_name, value, labels (JSONB), service' },
                      { name: 'metrics_1h', desc: 'Continuous aggregate: avg, min, max, p50, p95, p99 per hour' },
                      { name: 'metrics_1d', desc: 'Continuous aggregate: daily rollups for long-term storage' }
                    ]
                  },
                  {
                    db: 'PostgreSQL',
                    purpose: 'Metadata, users, organizations, and configuration',
                    tables: [
                      { name: 'users', desc: 'id, email, password_hash, role, mfa_enabled, mfa_secret, created_at' },
                      { name: 'organizations', desc: 'id, name, slug, plan, created_at' },
                      { name: 'api_keys', desc: 'id, org_id, prefix, hash, scopes[], revoked_at' },
                      { name: 'audit_logs', desc: 'id, user_id, action, resource, metadata, ip_address, timestamp' },
                      { name: 'monitors', desc: 'id, org_id, name, type, query, threshold, notification_config' },
                      { name: 'slo', desc: 'id, org_id, name, objective, sli_query, time_window, error_budget' },
                      { name: 'usage_daily', desc: 'date, org_id, logs_bytes, metrics_count, traces_count' },
                      { name: 'ip_allowlist', desc: 'id, org_id, user_id, ip_address, enabled' }
                    ]
                  }
                ].map((dbInfo, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px'
                    }}
                  >
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      marginBottom: '8px'
                    }}>
                      {dbInfo.db}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '16px'
                    }}>
                      {dbInfo.purpose}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {dbInfo.tables.map((table, tableIdx) => (
                        <div
                          key={tableIdx}
                          style={{
                            padding: '12px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px'
                          }}
                        >
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            fontFamily: 'monospace',
                            marginBottom: '4px'
                          }}>
                            {table.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace'
                          }}>
                            {table.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(21, 101, 192, 0.1)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '6px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  marginBottom: '12px'
                }}>
                  Schema Management
                </h3>
                <ul style={{
                  paddingLeft: '24px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.8',
                  margin: 0
                }}>
                  <li>Prisma ORM for PostgreSQL with automatic migrations</li>
                  <li>ClickHouse init scripts in <code style={{ fontFamily: 'monospace' }}>clickhouse/init/</code></li>
                  <li>TimescaleDB init scripts in <code style={{ fontFamily: 'monospace' }}>timescaledb/init/</code></li>
                  <li>Seed scripts for demo data: <code style={{ fontFamily: 'monospace' }}>prisma/seed.ts</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
