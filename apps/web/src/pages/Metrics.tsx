import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Nav } from '../components/Nav';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { observabilityAPI, type MetricQueryParams, api } from '../lib/api';
import { useToast } from '../lib/useToast';

export function Metrics() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('avg(http_requests_total)');
  
  // Seed metrics mutation
  const seedMetricsMutation = useMutation({
    mutationFn: async (count: number) => {
      return (await api.post('/playground/seed/metrics', { count })).data;
    },
    onSuccess: () => {
      showToast('success', 'Metrics generated successfully! Querying results...');
      queryClient.invalidateQueries({ queryKey: ['metric-catalog'] });
      // Automatically trigger query execution after generating metrics
      setTimeout(() => {
        console.log('🚀 Auto-triggering metrics query after generation');
        setExecuteTrigger(prev => prev + 1);
      }, 1000); // 1 second delay to ensure database insertion completes
    },
    onError: (error: any) => {
      showToast('error', error.response?.data?.message || 'Failed to generate metrics');
    },
  });
  const [timeRange, setTimeRange] = useState('1h');
  const [step, setStep] = useState('1m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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
  const buildQueryParams = (): MetricQueryParams => {
    const { start, end } = getTimeRange();
    return {
      query,
      start,
      end,
      step
    };
  };

  const [executeTrigger, setExecuteTrigger] = useState(0);

  // Fetch metrics - triggered by executeTrigger
  const { data: metricsData, isLoading, error } = useQuery({
    queryKey: ['metrics', query, timeRange, step, executeTrigger],
    queryFn: async () => {
      const params = buildQueryParams();
      console.log('🔍 Fetching metrics with params:', params);
      const response = await observabilityAPI.queryMetrics(params);
      console.log('📦 Raw metrics response:', response);
      console.log('📊 Response data:', response.data);
      console.log('🔑 Response data keys:', response.data ? Object.keys(response.data) : 'no data');
      if (response.data?.results) {
        console.log('✅ Results array length:', response.data.results.length);
        if (response.data.results.length > 0) {
          console.log('📈 First result:', response.data.results[0]);
          console.log('📈 Last result:', response.data.results[response.data.results.length - 1]);
        } else {
          console.log('⚠️ Results array is empty');
        }
      }
      return response.data;
    },
    retry: false,
    enabled: executeTrigger > 0 && !!query?.trim() // Only fetch when triggered and query exists
  });

  // Fetch metric catalog
  const { data: catalogData } = useQuery({
    queryKey: ['metric-catalog'],
    queryFn: async () => {
      const response = await observabilityAPI.getMetricCatalog();
      return response.data;
    },
    retry: false
  });

  const handleExecuteQuery = () => {
    if (!query?.trim()) {
      return;
    }
    setExecuteTrigger(prev => prev + 1); // Trigger query execution
  };

  // Example queries
  const exampleQueries = [
    { label: 'Average HTTP Requests', query: 'avg(http_requests_total)' },
    { label: 'Sum Response Time', query: 'sum(http_response_time_ms)' },
    { label: 'Max CPU Usage', query: 'max(cpu_usage_percent)' },
    { label: 'Request Rate', query: 'rate(http_requests_total)' },
    { label: 'Error Rate', query: 'sum(http_errors_total) / sum(http_requests_total)' }
  ];

  // Handle both possible response formats (results or data)
  const metrics = metricsData?.results || metricsData?.data || [];
  const catalog = catalogData?.metrics || [];

  // Debug logging
  console.log('Metrics page state:', {
    metricsData,
    metricsDataKeys: metricsData ? Object.keys(metricsData) : [],
    metricsDataResults: metricsData?.results,
    metricsDataData: metricsData?.data,
    metricsCount: metrics.length,
    catalogCount: catalog.length,
    isLoading,
    error,
    executeTrigger,
  });

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
            Metrics Explorer
          </h1>
          <p style={{ 
            margin: 0, 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Query and visualize time-series metrics using PromQL-style syntax
          </p>
        </div>

        {/* Generate Demo Data Button - Always visible helper */}
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
            📊 {catalog.length === 0 ? 'No metrics data found. Generate demo metrics to get started:' : 'Generate demo metrics for testing:'}
          </p>
          <button
            onClick={() => seedMetricsMutation.mutate(1000)}
            disabled={seedMetricsMutation.isPending}
            style={{
              padding: '10px 20px',
              backgroundColor: seedMetricsMutation.isPending ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: seedMetricsMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: seedMetricsMutation.isPending ? 0.6 : 1
            }}
          >
            {seedMetricsMutation.isPending ? 'Generating...' : '🚀 Generate 1000 Demo Metrics'}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '24px'
        }}>
          {/* Main query area */}
          <div>
            {/* Query Editor */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                PromQL Query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., avg(http_requests_total{service='api'})"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
              />

              {/* Time range and step */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
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

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)'
                  }}>
                    Step Interval
                  </label>
                  <select
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      backgroundColor: 'var(--bg-primary)'
                    }}
                  >
                    <option value="30s">30 seconds</option>
                    <option value="1m">1 minute</option>
                    <option value="5m">5 minutes</option>
                    <option value="15m">15 minutes</option>
                    <option value="1h">1 hour</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={handleExecuteQuery}
                    disabled={!query?.trim() || isLoading}
                    style={{
                      width: '100%',
                    padding: '8px 20px',
                      backgroundColor: (!query?.trim() || isLoading) ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                      color: (!query?.trim() || isLoading) ? 'var(--text-tertiary)' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: (!query?.trim() || isLoading) ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isLoading ? 'Executing...' : 'Execute Query'}
                  </button>
                </div>
              </div>

              {/* Example queries */}
              <div>
                <div style={{ 
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px'
                }}>
                  Example queries:
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {exampleQueries.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(example.query)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#F5F5F5',
                        color: 'var(--accent-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h2 style={{ 
                margin: '0 0 20px 0',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Results
              </h2>

              {isLoading ? (
                <div style={{ 
                  padding: '80px', 
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  Loading metrics...
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
                  <strong>Query Error:</strong> {error instanceof Error ? error.message : (error as any)?.response?.data?.message || 'Failed to execute query. Make sure you\'re logged in and have logs:read permission.'}
                </div>
              ) : metrics.length === 0 ? (
                <div style={{ 
                  padding: '80px', 
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  No data found. Try adjusting your query or time range.
                  {catalog.length === 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <button
                        onClick={() => seedMetricsMutation.mutate(1000)}
                        disabled={seedMetricsMutation.isPending}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: seedMetricsMutation.isPending ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: seedMetricsMutation.isPending ? 'not-allowed' : 'pointer',
                          opacity: seedMetricsMutation.isPending ? 0.6 : 1
                        }}
                      >
                        {seedMetricsMutation.isPending ? 'Generating...' : '🚀 Generate 1000 Demo Metrics'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <TimeSeriesChart 
                  data={metrics.map((m: any) => ({
                    timestamp: m.timestamp,
                    value: m.value
                  }))}
                  title={query}
                  height={400}
                  yLabel="Value"
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Metric Catalog */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Available Metrics
              </h3>

              {catalog.length === 0 ? (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '13px'
                }}>
                  No metrics found
                </div>
              ) : (
                <div style={{ 
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}>
                  {catalog.map((metric: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px',
                        marginBottom: '8px',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => setQuery(`avg(${metric.metric})`)}
                    >
                      <div style={{ 
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--accent-primary)',
                        marginBottom: '4px',
                        wordBreak: 'break-word'
                      }}>
                        {metric.metric}
                      </div>
                      <div style={{ 
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}>
                        {metric.sample_count} samples
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Query Syntax Help */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
              marginTop: '16px'
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Query Syntax
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>Aggregations:</strong><br/>
                  <code style={{ 
                    backgroundColor: '#F5F5F5', 
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    avg(), sum(), min(), max(), count()
                  </code>
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong>Label Filters:</strong><br/>
                  <code style={{ 
                    backgroundColor: '#F5F5F5', 
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    {'metric{service="api"}'}
                  </code>
                </p>
                <p style={{ margin: '0' }}>
                  <strong>Functions:</strong><br/>
                  <code style={{ 
                    backgroundColor: '#F5F5F5', 
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    rate(), increase()
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

