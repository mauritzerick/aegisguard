import { useState, useEffect, useRef } from 'react';
import { Nav } from '../components/Nav';
import { getWebSocketClient } from '../lib/ws';

type LogEvent = {
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
  attrs?: Record<string, any>;
};

export function LiveTail() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [rate, setRate] = useState(0);
  const [filters, setFilters] = useState({
    level: 'all',
    service: 'all',
    search: '',
  });
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsClient = useRef(getWebSocketClient());
  const rateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageCountRef = useRef(0);

  useEffect(() => {
    const client = wsClient.current;

    const unsubscribe = client.onMessage((log) => {
      if (!isPaused) {
        messageCountRef.current += 1;
        setLogs((prev) => {
          const newLogs = [log, ...prev];
          return newLogs.slice(0, 1000); // Keep max 1000 logs
        });
      }
    });

    client.connect();
    setIsConnected(true);

    // Track rate (logs per second)
    rateIntervalRef.current = setInterval(() => {
      setRate(messageCountRef.current);
      messageCountRef.current = 0; // Reset counter
    }, 1000);

    return () => {
      unsubscribe();
      client.disconnect();
      setIsConnected(false);
      if (rateIntervalRef.current) {
        clearInterval(rateIntervalRef.current);
      }
      messageCountRef.current = 0;
    };
  }, [isPaused]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filters.level !== 'all' && log.level !== filters.level) return false;
    if (filters.service !== 'all' && log.service !== filters.service) return false;
    if (filters.search && !log.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const services = Array.from(new Set(logs.map((log) => log.service)));

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'var(--error)';
      case 'warn':
        return 'var(--warning)';
      case 'info':
        return 'var(--info)';
      case 'debug':
        return 'var(--text-tertiary)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error':
        return 'rgba(198, 40, 40, 0.1)';
      case 'warn':
        return 'rgba(245, 124, 0, 0.1)';
      case 'info':
        return 'rgba(2, 119, 189, 0.1)';
      case 'debug':
        return 'var(--bg-secondary)';
      default:
        return 'var(--bg-secondary)';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-tail-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Nav />
      <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Live Tail</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Real-time log streaming • {isConnected ? '🟢 Connected' : '🔴 Disconnected'} • {filteredLogs.length} / {logs.length} logs • ~{rate} events/sec
          </p>
          {rate > 15 && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(245, 124, 0, 0.1)',
              border: '1px solid var(--warning)',
              borderRadius: '6px',
              marginTop: '12px',
              fontSize: '14px',
              color: 'var(--warning)'
            }}>
              ⚠️ High log rate detected ({rate} events/sec). Use filters or pause to manage.
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: isPaused ? 'var(--warning)' : 'var(--success)',
              color: '#FFF',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: autoScroll ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: autoScroll ? '#FFF' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid var(--border-color)',
            }}
          >
            {autoScroll ? '✓ Auto-scroll' : 'Auto-scroll'}
          </button>

          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
            }}
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>

          <select
            value={filters.service}
            onChange={(e) => setFilters({ ...filters, service: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
            }}
          >
            <option value="all">All Services</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontSize: '14px',
              minWidth: '200px',
              flex: 1,
            }}
          />

          <button
            onClick={clearLogs}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid var(--border-color)',
            }}
          >
            🗑 Clear
          </button>

          <button
            onClick={exportLogs}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid var(--border-color)',
            }}
          >
            💾 Export
          </button>
        </div>

        {/* Logs */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'auto',
            maxHeight: '600px',
          }}
        >
          {filteredLogs.length === 0 && (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '14px',
              }}
            >
              {logs.length === 0 ? 'Waiting for logs...' : 'No logs match the current filters'}
            </div>
          )}

          {filteredLogs.map((log, index) => (
            <div
              key={`${log.ts}-${index}`}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                fontFamily: 'monospace',
                fontSize: '13px',
                background: getLevelBg(log.level),
                display: 'grid',
                gridTemplateColumns: '160px 80px 100px 1fr',
                gap: '12px',
                alignItems: 'start',
              }}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>
                {new Date(log.ts).toLocaleTimeString()}.{new Date(log.ts).getMilliseconds()}
              </span>
              <span
                style={{
                  color: getLevelColor(log.level),
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {log.level}
              </span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{log.service}</span>
              <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {log.message}
                {log.attrs && (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--accent-primary)' }}>
                      Attributes
                    </summary>
                    <pre
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: 'var(--bg-primary)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        overflow: 'auto',
                      }}
                    >
                      {JSON.stringify(log.attrs, null, 2)}
                    </pre>
                  </details>
                )}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </>
  );
}

