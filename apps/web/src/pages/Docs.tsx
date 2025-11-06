import { useState } from 'react';
import { Nav } from '../components/Nav';

export function Docs() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'authentication', title: 'Authentication' },
    { id: 'ingestion', title: 'Ingestion API' },
    { id: 'query', title: 'Query API' },
    { id: 'admin', title: 'Admin API' },
    { id: 'webhooks', title: 'Webhooks' },
    { id: 'examples', title: 'Examples' }
  ];

  return (
    <>
      <Nav />
      <div style={{
        display: 'flex',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '250px',
          padding: '24px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>
            Documentation
          </h2>
          <nav>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  marginBottom: '4px',
                  fontSize: '14px',
                  backgroundColor: activeSection === section.id
                    ? 'rgba(21, 101, 192, 0.1)'
                    : 'transparent',
                  color: activeSection === section.id
                    ? 'var(--accent-primary)'
                    : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: activeSection === section.id ? 500 : 400
                }}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '32px 40px',
          maxWidth: '900px'
        }}>
          {activeSection === 'overview' && (
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                API Documentation
              </h1>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '24px'
              }}>
                AegisGuard provides a comprehensive REST API for ingesting telemetry data (logs, metrics, traces, RUM), querying data, and managing your account.
              </p>

              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(21, 101, 192, 0.1)',
                border: '1px solid var(--accent-primary)',
                borderRadius: '4px',
                marginBottom: '24px'
              }}>
                <strong style={{ color: 'var(--accent-primary)' }}>Base URL:</strong>{' '}
                <code style={{
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}>
                  https://api.aegisguard.io/v1
                </code>
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '32px',
                marginBottom: '12px'
              }}>
                API Endpoints
              </h2>
              <ul style={{
                paddingLeft: '24px',
                color: 'var(--text-primary)',
                lineHeight: '1.8'
              }}>
                <li><strong>Ingestion:</strong> POST /v1/logs, /v1/metrics, /v1/traces, /v1/rum</li>
                <li><strong>Query:</strong> POST /logs/search, /metrics/query, /traces/search</li>
                <li><strong>Admin:</strong> GET/POST /users, /api-keys, /monitors, /slo</li>
                <li><strong>Auth:</strong> POST /auth/login, /auth/logout, /auth/refresh</li>
              </ul>
            </div>
          )}

          {activeSection === 'authentication' && (
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Authentication
              </h1>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '24px',
                marginBottom: '12px'
              }}>
                API Keys
              </h2>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '16px'
              }}>
                Use API keys for programmatic access to the ingestion and query APIs.
              </p>

              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto'
                }}>
{`curl -X POST https://api.aegisguard.io/v1/logs \\
  -H "x-api-key: aegis_live_abc123..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "timestamp": "2025-10-31T12:00:00Z",
    "level": "info",
    "message": "User login successful",
    "service": "auth-api"
  }'`}
                </pre>
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '24px',
                marginBottom: '12px'
              }}>
                HMAC Signatures
              </h2>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '16px'
              }}>
                For high-security environments, sign your requests with HMAC-SHA256:
              </p>

              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto'
                }}>
{`const crypto = require('crypto');

const payload = JSON.stringify({ ... });
const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(payload)
  .digest('hex');

fetch('https://api.aegisguard.io/v1/logs', {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'x-signature': \`sha256=\${signature}\`,
    'Content-Type': 'application/json'
  },
  body: payload
});`}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'ingestion' && (
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Ingestion API
              </h1>

              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  POST /v1/logs
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}>
                  Ingest log events in JSON format.
                </p>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    overflow: 'auto'
                  }}>
{`{
  "timestamp": "2025-10-31T12:00:00Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "api",
  "attributes": {
    "host": "prod-01",
    "user_id": "user_123"
  }
}`}
                  </pre>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  POST /v1/metrics
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}>
                  Ingest metric data points.
                </p>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    overflow: 'auto'
                  }}>
{`{
  "metric": "http.request.duration",
  "value": 142.5,
  "timestamp": "2025-10-31T12:00:00Z",
  "labels": {
    "method": "GET",
    "status": "200",
    "service": "api"
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  POST /v1/traces
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}>
                  Ingest distributed traces (OpenTelemetry compatible).
                </p>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    overflow: 'auto'
                  }}>
{`{
  "traceId": "abc123...",
  "spanId": "span_001",
  "parentSpanId": null,
  "name": "GET /api/users",
  "startTime": "2025-10-31T12:00:00.000Z",
  "duration": 42,
  "service": "api",
  "kind": "server"
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'query' && (
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Query API
              </h1>

              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  POST /logs/search
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}>
                  Search logs with filters and full-text search.
                </p>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    overflow: 'auto'
                  }}>
{`{
  "query": "error database",
  "filters": {
    "level": ["error", "critical"],
    "service": "api"
  },
  "timeRange": {
    "from": "2025-10-31T00:00:00Z",
    "to": "2025-10-31T23:59:59Z"
  },
  "limit": 100
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  POST /metrics/query
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px'
                }}>
                  Query metrics with PromQL-lite syntax.
                </p>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    overflow: 'auto'
                  }}>
{`{
  "query": "avg(http_request_duration_ms{service='api'})",
  "from": "2025-10-31T00:00:00Z",
  "to": "2025-10-31T23:59:59Z",
  "step": "1m"
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'admin' && (
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Admin API
              </h1>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '24px'
              }}>
                Manage users, API keys, monitors, and other administrative resources.
              </p>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '12px'
              }}>
                Endpoints
              </h2>
              <ul style={{
                paddingLeft: '24px',
                color: 'var(--text-primary)',
                lineHeight: '2',
                fontSize: '15px'
              }}>
                <li><code style={{ fontFamily: 'monospace' }}>GET /users</code> - List all users</li>
                <li><code style={{ fontFamily: 'monospace' }}>POST /users</code> - Create a new user</li>
                <li><code style={{ fontFamily: 'monospace' }}>PATCH /users/:id</code> - Update user</li>
                <li><code style={{ fontFamily: 'monospace' }}>DELETE /users/:id</code> - Delete user</li>
                <li><code style={{ fontFamily: 'monospace' }}>GET /api-keys</code> - List API keys</li>
                <li><code style={{ fontFamily: 'monospace' }}>POST /api-keys</code> - Create API key</li>
                <li><code style={{ fontFamily: 'monospace' }}>DELETE /api-keys/:id</code> - Revoke API key</li>
                <li><code style={{ fontFamily: 'monospace' }}>GET /audit</code> - Fetch audit logs</li>
              </ul>
            </div>
          )}

          {activeSection === 'webhooks' && (
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Webhooks
              </h1>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '24px'
              }}>
                Configure webhooks to receive notifications for monitors, alerts, and other events.
              </p>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '12px'
              }}>
                Webhook Payload
              </h2>
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto'
                }}>
{`{
  "event": "monitor.triggered",
  "timestamp": "2025-10-31T12:00:00Z",
  "monitor": {
    "id": "mon_123",
    "name": "High Error Rate"
  },
  "details": {
    "current_value": 15.2,
    "threshold": 10.0
  }
}`}
                </pre>
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '12px'
              }}>
                Signature Verification
              </h2>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                marginBottom: '16px'
              }}>
                All webhooks are signed with HMAC-SHA256. Verify the signature using the <code style={{ fontFamily: 'monospace' }}>x-signature</code> header.
              </p>
            </div>
          )}

          {activeSection === 'examples' && (
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px'
              }}>
                Code Examples
              </h1>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '24px',
                marginBottom: '12px'
              }}>
                Node.js
              </h2>
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                marginBottom: '24px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto'
                }}>
{`const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.aegisguard.io/v1',
  headers: {
    'x-api-key': process.env.AEGIS_API_KEY
  }
});

// Ingest a log
await client.post('/logs', {
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Order processed',
  service: 'checkout',
  attributes: { order_id: 'ord_123' }
});

// Query logs
const { data } = await client.post('/logs/search', {
  query: 'checkout error',
  timeRange: {
    from: new Date(Date.now() - 3600000).toISOString(),
    to: new Date().toISOString()
  }
});`}
                </pre>
              </div>

              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '24px',
                marginBottom: '12px'
              }}>
                Python
              </h2>
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  overflow: 'auto'
                }}>
{`import requests
from datetime import datetime

headers = {'x-api-key': 'aegis_live_...'}
base_url = 'https://api.aegisguard.io/v1'

# Ingest a log
requests.post(
    f'{base_url}/logs',
    headers=headers,
    json={
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'level': 'error',
        'message': 'Payment failed',
        'service': 'billing'
    }
)

# Query logs
resp = requests.post(
    f'{base_url}/logs/search',
    headers=headers,
    json={'query': 'payment error', 'limit': 100}
)
logs = resp.json()`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
