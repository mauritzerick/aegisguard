import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Nav } from '../components/Nav';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { observabilityAPI } from '../lib/api';

export function RUM() {
  const [timeRange, setTimeRange] = useState('24h');
  const [eventType, setEventType] = useState('');

  const getTimeRange = (): { start: string; end: string } => {
    const end = new Date();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    const start = new Date(end.getTime() - (ranges[timeRange] || ranges['24h']));
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  };

  const { data: rumData, isLoading } = useQuery({
    queryKey: ['rum', timeRange, eventType],
    queryFn: async () => {
      const { start, end } = getTimeRange();
      const response = await observabilityAPI.searchRUM({
        start,
        end,
        ...(eventType && { event_type: eventType }),
        limit: 1000
      });
      return response.data;
    },
    retry: false
  });

  const events = rumData?.events || [];

  // Calculate Web Vitals and metrics
  const pageviews = events.filter((e: any) => e.event_type === 'pageview');
  const errors = events.filter((e: any) => e.event_type === 'error');
  const clicks = events.filter((e: any) => e.event_type === 'click');

  // Performance metrics (example aggregations)
  const avgLoadTime = pageviews.length > 0
    ? pageviews.reduce((sum: number, e: any) => sum + (e.performance_metrics?.load_time || 0), 0) / pageviews.length
    : 0;

  const topPages = pageviews.reduce((acc: any, e: any) => {
    const url = e.page_url || 'Unknown';
    acc[url] = (acc[url] || 0) + 1;
    return acc;
  }, {});

  const topPagesArray = Object.entries(topPages)
    .map(([url, count]) => ({ url, count }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

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
            Real User Monitoring (RUM)
          </h1>
          <p style={{ 
            margin: 0, 
            color: 'var(--text-secondary)',
            fontSize: '14px'
          }}>
            Monitor frontend performance, errors, and user behavior
          </p>
        </div>

        {/* Time Range Selector */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
            Time Range:
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginLeft: 'auto' }}>
            Event Type:
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <option value="">All events</option>
            <option value="pageview">Pageviews</option>
            <option value="click">Clicks</option>
            <option value="error">Errors</option>
            <option value="performance">Performance</option>
          </select>
        </div>

        {/* Web Vitals Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <MetricCard
            title="Pageviews"
            value={pageviews.length.toLocaleString()}
            color="#1565C0"
          />
          <MetricCard
            title="Errors"
            value={errors.length.toLocaleString()}
            color="#D32F2F"
          />
          <MetricCard
            title="Avg Load Time"
            value={`${avgLoadTime.toFixed(0)} ms`}
            color="#F57C00"
          />
          <MetricCard
            title="Total Events"
            value={events.length.toLocaleString()}
            color="#388E3C"
          />
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px'
        }}>
          {/* Main content */}
          <div>
            {/* Recent Errors */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h2 style={{ 
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Recent Errors
              </h2>

              {errors.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No errors found
                </div>
              ) : (
                <div>
                  {errors.slice(0, 10).map((error: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px',
                        borderBottom: i < Math.min(errors.length, 10) - 1 ? '1px solid #E0E0E0' : 'none',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ 
                        color: 'var(--error)',
                        fontWeight: 500,
                        marginBottom: '4px'
                      }}>
                        {error.error_message || 'Unknown error'}
                      </div>
                      <div style={{ 
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        marginBottom: '4px'
                      }}>
                        {error.page_url}
                      </div>
                      <div style={{ 
                        color: 'var(--text-tertiary)',
                        fontSize: '11px'
                      }}>
                        {new Date(error.ts).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Timeline */}
            {pageviews.length > 0 && (
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
                  Page Load Performance
                </h2>
                <TimeSeriesChart
                  data={pageviews.map((e: any) => ({
                    timestamp: e.ts,
                    value: e.performance_metrics?.load_time || 0
                  })).slice(0, 100)}
                  height={300}
                  yLabel="Load Time (ms)"
                  color="#F57C00"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Top Pages */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Top Pages
              </h3>

              {topPagesArray.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No data
                </div>
              ) : (
                <div>
                  {topPagesArray.map((page: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px',
                        marginBottom: '8px',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ 
                        color: 'var(--accent-primary)',
                        marginBottom: '4px',
                        wordBreak: 'break-word'
                      }}>
                        {page.url}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {page.count} views
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Browser Stats */}
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
                Browsers
              </h3>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                {events.length > 0 ? (
                  <div>Coming soon: Browser breakdown</div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>No data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '20px'
    }}>
      <div style={{ 
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginBottom: '8px'
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '28px',
        fontWeight: 600,
        color
      }}>
        {value}
      </div>
    </div>
  );
}

