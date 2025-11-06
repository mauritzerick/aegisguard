import React, { useState } from 'react';

interface LogEntry {
  ts: string;
  org_id: string;
  service: string;
  level: string;
  message: string;
  attrs?: Record<string, any>;
  trace_id?: string;
  span_id?: string;
  host?: string;
  ip?: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  onTraceClick?: (traceId: string) => void;
}

export function LogViewer({ logs, onTraceClick }: LogViewerProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      error: '#D32F2F',
      warn: '#F57C00',
      warning: '#F57C00',
      info: '#1976D2',
      debug: '#616161',
      trace: '#9E9E9E'
    };
    return colors[level.toLowerCase()] || '#616161';
  };

  const getLevelBgColor = (level: string) => {
    const colors: Record<string, string> = {
      error: '#FFEBEE',
      warn: '#FFF3E0',
      warning: '#FFF3E0',
      info: '#E3F2FD',
      debug: '#F5F5F5',
      trace: '#FAFAFA'
    };
    return colors[level.toLowerCase()] || '#F5F5F5';
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (!logs || logs.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#757575',
        border: '1px solid #E0E0E0',
        borderRadius: '8px',
        backgroundColor: '#FAFAFA'
      }}>
        No logs found
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'monospace',
      fontSize: '13px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E0E0E0',
      borderRadius: '8px'
    }}>
      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            borderBottom: index < logs.length - 1 ? '1px solid #E0E0E0' : 'none',
            padding: '12px 16px',
            backgroundColor: expandedLogs.has(index) ? '#FAFAFA' : '#FFFFFF',
            transition: 'background-color 0.2s'
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Timestamp */}
            <span style={{ 
              color: '#757575', 
              minWidth: '140px',
              fontSize: '12px'
            }}>
              {formatTimestamp(log.ts)}
            </span>

            {/* Level badge */}
            <span style={{
              color: getLevelColor(log.level),
              backgroundColor: getLevelBgColor(log.level),
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {log.level}
            </span>

            {/* Service */}
            <span style={{ 
              color: '#1565C0',
              fontWeight: 500,
              minWidth: '80px'
            }}>
              {log.service}
            </span>

            {/* Message */}
            <span style={{ 
              flex: 1, 
              color: '#212121',
              wordBreak: 'break-word'
            }}>
              {log.message}
            </span>

            {/* Expand button */}
            {(log.attrs && Object.keys(log.attrs).length > 0) || log.trace_id ? (
              <button
                onClick={() => toggleExpand(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1565C0',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 8px',
                  lineHeight: '1'
                }}
              >
                {expandedLogs.has(index) ? '−' : '+'}
              </button>
            ) : null}
          </div>

          {/* Expanded details */}
          {expandedLogs.has(index) && (
            <div style={{ 
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #E0E0E0'
            }}>
              {/* Metadata */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '12px'
              }}>
                {log.host && (
                  <div>
                    <span style={{ color: '#757575' }}>Host: </span>
                    <span style={{ color: '#212121' }}>{log.host}</span>
                  </div>
                )}
                {log.ip && (
                  <div>
                    <span style={{ color: '#757575' }}>IP: </span>
                    <span style={{ color: '#212121' }}>{log.ip}</span>
                  </div>
                )}
                {log.trace_id && (
                  <div>
                    <span style={{ color: '#757575' }}>Trace ID: </span>
                    <button
                      onClick={() => onTraceClick?.(log.trace_id!)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1565C0',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}
                    >
                      {log.trace_id}
                    </button>
                  </div>
                )}
                {log.span_id && (
                  <div>
                    <span style={{ color: '#757575' }}>Span ID: </span>
                    <span style={{ color: '#212121', fontFamily: 'monospace' }}>{log.span_id}</span>
                  </div>
                )}
              </div>

              {/* Attributes */}
              {log.attrs && Object.keys(log.attrs).length > 0 && (
                <div>
                  <div style={{ 
                    color: '#757575', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    Attributes:
                  </div>
                  <pre style={{
                    backgroundColor: '#F5F5F5',
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    margin: 0,
                    fontSize: '12px',
                    color: '#212121'
                  }}>
                    {JSON.stringify(log.attrs, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

