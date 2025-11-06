import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { LogViewer } from '../components/LogViewer';
import { observabilityAPI, type LogSearchParams } from '../lib/api';
import { useToast } from '../lib/useToast';

export function Logs() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Time range state
  const [timeRange, setTimeRange] = useState('1h');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  
  // Filter state
  const [service, setService] = useState('');
  const [level, setLevel] = useState('');
  const [searchText, setSearchText] = useState('');
  const [traceId, setTraceId] = useState('');
  const [limit, setLimit] = useState(100);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10000);

  // Calculate time range
  const getTimeRange = (): { start: string; end: string } => {
    const end = new Date();
    let start = new Date();
    
    if (timeRange === 'custom') {
      return {
        start: customStart || new Date(Date.now() - 3600000).toISOString(),
        end: customEnd || end.toISOString()
      };
    }
    
    const ranges: Record<string, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    start = new Date(end.getTime() - (ranges[timeRange] || ranges['1h']));
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  // Build query params
  const buildQueryParams = (): LogSearchParams => {
    const { start, end } = getTimeRange();
    return {
      start,
      end,
      ...(service && { service }),
      ...(level && { level }),
      ...(searchText && { search: searchText }),
      ...(traceId && { trace_id: traceId }),
      limit
    };
  };

  const [searchTrigger, setSearchTrigger] = useState(0);

  // Fetch logs - triggered by searchTrigger or auto-refresh
  const { data: logsData, isLoading, error, refetch } = useQuery({
    queryKey: ['logs', buildQueryParams(), searchTrigger],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await observabilityAPI.searchLogs(params);
      return response.data;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: false,
    enabled: true // Always enabled, but queryKey changes trigger refetch
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1); // Trigger new search
    refetch();
  };

  const handleTraceClick = (traceId: string) => {
    navigate(`/traces/${traceId}`);
  };

  const handleClearFilters = () => {
    setService('');
    setLevel('');
    setSearchText('');
    setTraceId('');
    setTimeRange('1h');
  };

  const logs = logsData?.logs || [];

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
            Logs Explorer
          </h1>
          <p style={{ 
            margin: 0, 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Search and analyze application logs in real-time
          </p>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          {/* Time Range */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                <option value="custom">Custom range</option>
              </select>
            </div>

            {timeRange === 'custom' && (
              <>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)'
                  }}>
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={customStart ? new Date(customStart).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCustomStart(new Date(e.target.value).toISOString())}
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
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={customEnd ? new Date(customEnd).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCustomEnd(new Date(e.target.value).toISOString())}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

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
                placeholder="e.g., api, web, worker"
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
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="">All levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="trace">Trace</option>
              </select>
            </div>
          </div>

          {/* Search and Trace ID */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr',
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
                Search Text
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search in log messages..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
                Trace ID
              </label>
              <input
                type="text"
                value={traceId}
                onChange={(e) => setTraceId(e.target.value)}
                placeholder="Filter by trace ID..."
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
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              style={{
                padding: '8px 20px',
                backgroundColor: isLoading ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                color: isLoading ? 'var(--text-tertiary)' : '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '8px 20px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
            <div style={{ 
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh ({refreshInterval / 1000}s)
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="50">50 logs</option>
                <option value="100">100 logs</option>
                <option value="500">500 logs</option>
                <option value="1000">1000 logs</option>
              </select>
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{ 
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              {isLoading ? 'Loading...' : `${logs.length} logs`}
            </h2>
            {error && (
              <span style={{ color: 'var(--error)', fontSize: '14px' }}>
                Error loading logs
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              Loading logs...
            </div>
          ) : error ? (
            <div style={{ 
              padding: '20px', 
              backgroundColor: 'rgba(198, 40, 40, 0.1)',
              border: '1px solid var(--error)',
              borderRadius: '6px',
              color: 'var(--error)',
              fontSize: '14px'
            }}>
              <strong>Search Error:</strong> {error instanceof Error ? error.message : (error as any)?.response?.data?.message || 'Failed to search logs. Make sure you\'re logged in and have logs:read permission.'}
            </div>
          ) : (
            <LogViewer 
              logs={logs} 
              onTraceClick={handleTraceClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

