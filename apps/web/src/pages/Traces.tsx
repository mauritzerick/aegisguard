import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { observabilityAPI, type TraceSearchParams, api } from '../lib/api';
import { useToast } from '../lib/useToast';

export function Traces() {
  const { traceId } = useParams<{ traceId: string }>();
  const navigate = useNavigate();
  
  const [searchTraceId, setSearchTraceId] = useState(traceId || '');
  const [timeRange, setTimeRange] = useState('1h');
  const [service, setService] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [status, setStatus] = useState('');

  // Calculate time range
  const getTimeRange = (): { start: string; end: string } => {
    const end = new Date();
    const ranges: Record<string, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    const start = new Date(end.getTime() - (ranges[timeRange] || ranges['1h']));
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  // Fetch single trace if traceId is provided
  const { data: traceData, isLoading: traceLoading } = useQuery({
    queryKey: ['trace', traceId],
    queryFn: async () => {
      if (!traceId) return null;
      const response = await observabilityAPI.getTrace(traceId);
      return response.data;
    },
    enabled: !!traceId,
    retry: false
  });

  // Search traces
  const buildSearchParams = (): TraceSearchParams => {
    const { start, end } = getTimeRange();
    return {
      start,
      end,
      ...(service && { service }),
      ...(minDuration && { min_duration_ms: Number(minDuration) }),
      ...(status && { status }),
      limit: 50
    };
  };

  const { data: searchData, isLoading: searchLoading, refetch } = useQuery({
    queryKey: ['traces-search', buildSearchParams()],
    queryFn: async () => {
      const params = buildSearchParams();
      const response = await observabilityAPI.searchTraces(params);
      return response.data;
    },
    enabled: !traceId,
    retry: false
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Seed traces mutation
  const seedTracesMutation = useMutation({
    mutationFn: async (count: number) => {
      return (await api.post('/playground/seed/traces', { count })).data;
    },
    onSuccess: () => {
      showToast('success', 'Traces generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['traces-search'] });
      refetch();
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Failed to generate traces');
    },
  });

  const handleSearch = () => {
    if (searchTraceId) {
      navigate(`/traces/${searchTraceId}`);
    } else {
      refetch();
    }
  };

  const handleTraceClick = (id: string) => {
    navigate(`/traces/${id}`);
  };

  const handleBackToSearch = () => {
    navigate('/traces');
  };

  // If viewing a specific trace
  if (traceId && traceData) {
    return (
      <div>
        <Nav />
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '24px'
        }}>
          <button
            onClick={handleBackToSearch}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--accent-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            ← Back to Search
          </button>

          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '28px', 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Trace Details
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {traceId}
            </p>
          </div>

          <TraceWaterfall spans={traceData.spans || []} />
        </div>
      </div>
    );
  }

  // Search view
  const traces = searchData?.traces || [];

  return (
    <div>
      <Nav />
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '24px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '28px', 
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Traces Explorer
          </h1>
          <p style={{ 
            margin: 0, 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Search and analyze distributed traces
          </p>
        </div>

        {/* Generate Demo Data Button */}
        {traces.length === 0 && !searchLoading && (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(21, 101, 192, 0.1)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ 
              margin: '0 0 12px 0', 
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}>
              🔍 No traces found. Generate demo traces to get started:
            </p>
            <button
              onClick={() => seedTracesMutation.mutate(100)}
              disabled={seedTracesMutation.isPending}
              style={{
                padding: '10px 20px',
                backgroundColor: seedTracesMutation.isPending ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: seedTracesMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: seedTracesMutation.isPending ? 0.6 : 1
              }}
            >
              {seedTracesMutation.isPending ? 'Generating...' : '🚀 Generate 100 Demo Traces'}
            </button>
          </div>
        )}

        {/* Search Filters */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                Trace ID
              </label>
              <input
                type="text"
                value={searchTraceId}
                onChange={(e) => setSearchTraceId(e.target.value)}
                placeholder="Search by trace ID..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="15m">Last 15 minutes</option>
                <option value="1h">Last hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                Service
              </label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g., api, web"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                Min Duration (ms)
              </label>
              <input
                type="number"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                placeholder="e.g., 1000"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="">All statuses</option>
                <option value="ok">OK</option>
                <option value="error">Error</option>
                <option value="unset">Unset</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={handleSearch}
                style={{
                  width: '100%',
                  padding: '8px 20px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {searchLoading ? 'Loading...' : `${traces.length} traces`}
          </h2>

          {searchLoading ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              Loading traces...
            </div>
          ) : traces.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              No traces found
            </div>
          ) : (
            <div>
              {traces.map((trace: any, index: number) => (
                <div
                  key={index}
                  onClick={() => handleTraceClick(trace.trace_id)}
                  style={{
                    padding: '16px',
                    borderBottom: index < traces.length - 1 ? '1px solid #E0E0E0' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ 
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      color: 'var(--accent-primary)',
                      fontWeight: 500
                    }}>
                      {trace.trace_id}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(trace.start_time).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{trace.span_count} spans</span>
                    <span>{trace.total_duration_ms.toFixed(2)} ms</span>
                    {trace.error_count > 0 && (
                      <span style={{ color: 'var(--error)' }}>
                        {trace.error_count} errors
                      </span>
                    )}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Services: {trace.services.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Waterfall visualization component
function TraceWaterfall({ spans }: { spans: any[] }) {
  if (!spans || spans.length === 0) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}>
        No spans found
      </div>
    );
  }

  // Calculate trace duration
  const timestamps = spans.map(s => new Date(s.ts).getTime());
  const durations = spans.map(s => s.duration_ms);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps.map((t, i) => t + durations[i]));
  const traceDuration = maxTime - minTime;

  // Build span tree (parent-child relationships)
  const spansById = new Map(spans.map(s => [s.span_id, s]));
  const rootSpans = spans.filter(s => !s.parent_span_id || !spansById.has(s.parent_span_id));

  const getStatusColor = (status: string) => {
    if (status === 'error') return '#D32F2F';
    if (status === 'ok') return '#388E3C';
    return '#757575';
  };

  const renderSpan = (span: any, depth: number = 0) => {
    const startOffset = new Date(span.ts).getTime() - minTime;
    const leftPercent = (startOffset / traceDuration) * 100;
    const widthPercent = (span.duration_ms / traceDuration) * 100;
    const children = spans.filter(s => s.parent_span_id === span.span_id);

    return (
      <div key={span.span_id}>
        <div style={{
          padding: '8px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--bg-primary)'
        }}>
          {/* Service & Operation */}
          <div style={{ 
            width: '300px', 
            paddingLeft: `${depth * 20}px`,
            fontSize: '13px'
          }}>
            <div style={{ 
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '2px'
            }}>
              {span.service}
            </div>
            <div style={{ 
              color: 'var(--text-secondary)',
              fontSize: '12px'
            }}>
              {span.operation}
            </div>
          </div>

          {/* Waterfall bar */}
          <div style={{ flex: 1, position: 'relative', height: '24px' }}>
            <div
              style={{
                position: 'absolute',
                left: `${leftPercent}%`,
                width: `${Math.max(widthPercent, 0.5)}%`,
                height: '100%',
                backgroundColor: getStatusColor(span.status),
                borderRadius: '2px',
                opacity: 0.8
              }}
            />
          </div>

          {/* Duration */}
          <div style={{ 
            width: '80px', 
            textAlign: 'right',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {span.duration_ms.toFixed(2)} ms
          </div>

          {/* Status */}
          <div style={{ 
            width: '60px',
            fontSize: '12px',
            color: getStatusColor(span.status),
            fontWeight: 500,
            textTransform: 'uppercase'
          }}>
            {span.status}
          </div>
        </div>

        {/* Render children */}
        {children.map(child => renderSpan(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ 
          margin: '0 0 8px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          Trace Waterfall
        </h2>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Total duration: {traceDuration.toFixed(2)} ms • {spans.length} spans
        </div>
      </div>

      <div>
        {rootSpans.map(span => renderSpan(span, 0))}
      </div>
    </div>
  );
}

