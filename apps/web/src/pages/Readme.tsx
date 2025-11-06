import { Nav } from '../components/Nav';

export function Readme() {
  return (
    <>
      <Nav />
      <div style={{
        padding: '32px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        <div style={{
          padding: '40px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          <article style={{
            color: 'var(--text-primary)',
            lineHeight: '1.7'
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              AegisGuard — Full-Stack Observability & Security Platform
            </h1>

            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              marginBottom: '32px'
            }}>
              A production-grade, Datadog-style observability platform with enterprise security features. Complete monitoring solution for logs, metrics, traces, and Real User Monitoring (RUM) with multi-tenant isolation.
            </p>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '32px',
              marginBottom: '16px'
            }}>
              One-liner
            </h2>
            <p style={{ fontSize: '15px', marginBottom: '24px' }}>
              Full-stack observability platform with secure ingestion, real-time analysis, and comprehensive security controls: logs, metrics, traces, RUM, monitors, SLOs, auth + MFA, RBAC, API keys, audit logs, and usage tracking.
            </p>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '32px',
              marginBottom: '16px'
            }}>
              Goals
            </h2>
            <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Observability</strong>: Complete telemetry platform (logs, metrics, traces, RUM) with Datadog-style UI
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Security</strong>: Enterprise-grade security with MFA, RBAC, HMAC verification, PII scrubbing
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Multi-tenant</strong>: Organization-level isolation with secure ingestion and query APIs
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Production-ready</strong>: Background workers, rate limiting, columnar storage, time-series DB
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Developer Experience</strong>: OpenAPI docs, React admin UI, TypeScript throughout
              </li>
            </ul>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '32px',
              marginBottom: '16px'
            }}>
              Tech Stack
            </h2>

            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '24px',
              marginBottom: '12px'
            }}>
              Observability Platform
            </h3>
            <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Ingestion</strong>: NestJS REST API with HMAC signature verification, rate limiting, idempotency
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Processing</strong>: Redis Streams message queue, background workers with PII scrubbing & enrichment
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Storage</strong>:
                <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                  <li>ClickHouse (columnar) for logs, traces, and RUM events</li>
                  <li>TimescaleDB (time-series) for metrics with continuous aggregates</li>
                  <li>PostgreSQL for metadata, users, orgs, and usage tracking</li>
                </ul>
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Query</strong>: LogQL-lite for logs, PromQL-lite for metrics, trace waterfall views
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Frontend</strong>: React + TypeScript with custom visualizations (charts, waterfall, log viewer)
              </li>
            </ul>

            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '24px',
              marginBottom: '12px'
            }}>
              Security & Infrastructure
            </h3>
            <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Backend</strong>: NestJS (Express) + TypeScript, Prisma ORM, Redis (BullMQ)
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Auth</strong>: JWT access (5m) + rotating refresh (7d), MFA TOTP, CSRF protection, httpOnly cookies
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Security</strong>: RBAC, API keys, HMAC signing, rate limits, audit logs, PII scrubbing, IP allowlisting
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Frontend</strong>: React + Vite + TypeScript, React Router, TanStack Query
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>DevOps</strong>: Docker Compose (6 services), GitHub Actions, ESLint, Prettier
              </li>
            </ul>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '32px',
              marginBottom: '16px'
            }}>
              Quick Start
            </h2>

            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              marginBottom: '24px'
            }}>
              <pre style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '14px',
                color: 'var(--text-primary)',
                overflow: 'auto'
              }}>
{`# Clone and setup
git clone https://github.com/your-org/aegisguard
cd aegisguard

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start all services
./RUN.sh

# Visit
http://localhost:5173

# Default login
Email: admin@aegis.local
Password: ChangeMeNow!123`}
              </pre>
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '32px',
              marginBottom: '16px'
            }}>
              Features
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              {[
                { title: 'Logs', desc: 'Full-text search, filtering, live tail' },
                { title: 'Metrics', desc: 'PromQL-lite queries, aggregations, charts' },
                { title: 'Traces', desc: 'Distributed tracing, waterfall views' },
                { title: 'RUM', desc: 'Real user monitoring, performance tracking' },
                { title: 'Monitors', desc: 'Threshold and anomaly-based alerts' },
                { title: 'SLOs', desc: 'Error budget tracking, burn rate' },
                { title: 'Users & RBAC', desc: 'Admin, Editor, Viewer roles' },
                { title: 'API Keys', desc: 'Scoped access tokens for services' },
                { title: 'Audit Logs', desc: 'Immutable activity trail' },
                { title: 'MFA/TOTP', desc: 'Two-factor authentication' },
                { title: 'CSRF Protection', desc: 'Double-submit cookies' },
                { title: 'Rate Limiting', desc: 'Per-org and per-IP limits' }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                >
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '4px'
                  }}>
                    {feature.title}
                  </h4>
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    margin: 0
                  }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginTop: '32px',
              marginBottom: '16px'
            }}>
              Security Highlights
            </h2>
            <ul style={{ paddingLeft: '24px', marginBottom: '24px' }}>
              <li style={{ marginBottom: '8px' }}>HMAC-SHA256 signature verification for all ingestion endpoints</li>
              <li style={{ marginBottom: '8px' }}>Multi-factor authentication (TOTP) with QR code setup</li>
              <li style={{ marginBottom: '8px' }}>Role-based access control (RBAC) with granular permissions</li>
              <li style={{ marginBottom: '8px' }}>Automatic PII scrubbing with regex and key-based detection</li>
              <li style={{ marginBottom: '8px' }}>Immutable audit logs with PostgreSQL triggers</li>
              <li style={{ marginBottom: '8px' }}>Rate limiting per organization and per IP</li>
              <li style={{ marginBottom: '8px' }}>CSRF protection with double-submit cookies</li>
              <li style={{ marginBottom: '8px' }}>IP allowlisting for sensitive operations</li>
            </ul>

            <div style={{
              padding: '24px',
              backgroundColor: 'rgba(21, 101, 192, 0.1)',
              border: '1px solid var(--accent-primary)',
              borderRadius: '4px',
              marginTop: '32px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                marginBottom: '12px'
              }}>
                📚 Documentation
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-primary)',
                marginBottom: '12px'
              }}>
                Explore the full documentation for detailed guides, API references, and examples:
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="/docs"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  API Documentation
                </a>
                <a
                  href="/codebase-explanation"
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: 'transparent',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}
                >
                  Codebase Explanation
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}



