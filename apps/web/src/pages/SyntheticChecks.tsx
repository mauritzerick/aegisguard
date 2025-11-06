import { useState, useEffect } from 'react';
import { Nav } from '../components/Nav';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
});

interface Check {
  id: number;
  name: string;
  url: string;
  interval_sec: number;
  method: string;
  expected_status: number;
  timeout_ms: number;
  enabled: boolean;
  last_status?: string;
  last_latency_ms?: number;
  last_checked_at?: string;
}

interface CheckResult {
  id: number;
  status: 'up' | 'down' | 'degraded';
  latency_ms: number;
  status_code?: number;
  error?: string;
  timestamp: string;
}

export function SyntheticChecks() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null);
  const [history, setHistory] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChecks();
    const interval = setInterval(fetchChecks, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCheckId) {
      fetchHistory(selectedCheckId);
    }
  }, [selectedCheckId]);

  const fetchChecks = async () => {
    try {
      const response = await api.get('/checks');
      setChecks(response.data.checks);
    } catch (error) {
      console.error('Failed to fetch checks:', error);
    }
  };

  const fetchHistory = async (checkId: number) => {
    try {
      const response = await api.get(`/checks/${checkId}/history?limit=20`);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const runCheckNow = async (checkId: number) => {
    setLoading(true);
    try {
      await api.post(`/checks/${checkId}/run`);
      await fetchChecks();
      if (selectedCheckId === checkId) {
        await fetchHistory(checkId);
      }
    } catch (error) {
      console.error('Failed to run check:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'var(--text-tertiary)';
    switch (status) {
      case 'up':
        return 'var(--success)';
      case 'degraded':
        return 'var(--warning)';
      case 'down':
        return 'var(--error)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const getStatusBg = (status?: string) => {
    if (!status) return 'var(--bg-secondary)';
    switch (status) {
      case 'up':
        return 'rgba(76, 175, 80, 0.1)';
      case 'degraded':
        return 'rgba(255, 152, 0, 0.1)';
      case 'down':
        return 'rgba(244, 67, 54, 0.1)';
      default:
        return 'var(--bg-secondary)';
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return '⚪';
    switch (status) {
      case 'up':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'down':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const overallStatus = () => {
    const upCount = checks.filter((c) => c.last_status === 'up').length;
    const degradedCount = checks.filter((c) => c.last_status === 'degraded').length;
    const downCount = checks.filter((c) => c.last_status === 'down').length;

    return { upCount, degradedCount, downCount, total: checks.length };
  };

  const stats = overallStatus();

  return (
    <>
      <Nav />
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Synthetic Checks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Monitor local services with automated health checks
          </p>
        </div>

        {/* Status Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--success)' }}>
              🟢 {stats.upCount}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Healthy</div>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--warning)' }}>
              🟡 {stats.degradedCount}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Degraded</div>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--error)' }}>
              🔴 {stats.downCount}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Down</div>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--accent-primary)' }}>
              📊 {stats.total}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Checks</div>
          </div>
        </div>

        {/* Checks List */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {checks.length === 0 && (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '14px',
              }}
            >
              No checks configured. Checks will be automatically initialized on server start.
            </div>
          )}

          {checks.map((check) => (
            <div
              key={check.id}
              style={{
                padding: '20px',
                borderBottom: '1px solid var(--border-color)',
                background: getStatusBg(check.last_status),
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onClick={() => setSelectedCheckId(check.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{getStatusIcon(check.last_status)}</span>
                    <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{check.name}</h3>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>
                      {check.method} {check.url}
                    </code>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Interval: every {check.interval_sec}s •{' '}
                    {check.last_latency_ms && `Latency: ${check.last_latency_ms}ms • `}
                    {check.last_checked_at && `Last checked: ${new Date(check.last_checked_at).toLocaleTimeString()}`}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    runCheckNow(check.id);
                  }}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent-primary)',
                    color: '#FFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  Run Now
                </button>
              </div>

              {selectedCheckId === check.id && history.length > 0 && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Recent History (Last 20 checks)
                  </h4>

                  {/* Sparkline */}
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '12px', height: '40px', alignItems: 'end' }}>
                    {history
                      .slice()
                      .reverse()
                      .map((result, index) => {
                        const maxLatency = Math.max(...history.map((h) => h.latency_ms));
                        const height = (result.latency_ms / maxLatency) * 100;

                        return (
                          <div
                            key={index}
                            title={`${result.status} - ${result.latency_ms}ms`}
                            style={{
                              flex: 1,
                              height: `${height}%`,
                              background: getStatusColor(result.status),
                              borderRadius: '2px',
                              minHeight: '4px',
                            }}
                          />
                        );
                      })}
                  </div>

                  {/* History Table */}
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {history.map((result, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '8px',
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ color: getStatusColor(result.status), fontWeight: 600 }}>
                          {getStatusIcon(result.status)} {result.status}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {result.latency_ms}ms
                          {result.status_code && ` • ${result.status_code}`}
                        </span>
                        <span style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

