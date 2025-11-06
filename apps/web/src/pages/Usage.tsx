import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Nav } from '../components/Nav';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { observabilityAPI } from '../lib/api';

export function Usage() {
  const [dateRange, setDateRange] = useState('30d');

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const { data: usageData, isLoading } = useQuery({
    queryKey: ['usage', dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const response = await observabilityAPI.getUsage({
        start_date: start,
        end_date: end
      });
      return response.data;
    }
  });

  const usage = usageData?.usage || [];

  // Calculate totals
  const totals = usage.reduce((acc: any, day: any) => ({
    logs_count: acc.logs_count + (day.logs_count || 0),
    logs_bytes: acc.logs_bytes + (day.logs_bytes || 0),
    metrics_count: acc.metrics_count + (day.metrics_count || 0),
    spans_count: acc.spans_count + (day.spans_count || 0),
    rum_events: acc.rum_events + (day.rum_events || 0)
  }), {
    logs_count: 0,
    logs_bytes: 0,
    metrics_count: 0,
    spans_count: 0,
    rum_events: 0
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toString();
  };

  return (
    <div>
      <Nav />
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '24px'
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '28px', 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Usage & Billing
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              Track your observability data usage and costs
            </p>
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Usage Summary Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <UsageCard
            title="Logs Ingested"
            value={formatNumber(totals.logs_count)}
            subtitle={formatBytes(totals.logs_bytes)}
            color="#1565C0"
          />
          <UsageCard
            title="Metrics Data Points"
            value={formatNumber(totals.metrics_count)}
            subtitle="Time-series data"
            color="#388E3C"
          />
          <UsageCard
            title="Trace Spans"
            value={formatNumber(totals.spans_count)}
            subtitle="Distributed traces"
            color="#F57C00"
          />
          <UsageCard
            title="RUM Events"
            value={formatNumber(totals.rum_events)}
            subtitle="Frontend monitoring"
            color="#7B1FA2"
          />
        </div>

        {/* Charts */}
        {!isLoading && usage.length > 0 && (
          <div style={{ 
            display: 'grid',
            gap: '24px'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <TimeSeriesChart
                data={usage.map((d: any) => ({
                  timestamp: d.date,
                  value: d.logs_count || 0
                }))}
                title="Daily Log Volume"
                height={300}
                color="#1565C0"
                yLabel="Log Count"
              />
            </div>

            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <TimeSeriesChart
                data={usage.map((d: any) => ({
                  timestamp: d.date,
                  value: d.metrics_count || 0
                }))}
                title="Daily Metrics Volume"
                height={300}
                color="#388E3C"
                yLabel="Metric Count"
              />
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <TimeSeriesChart
                  data={usage.map((d: any) => ({
                    timestamp: d.date,
                    value: d.spans_count || 0
                  }))}
                  title="Daily Trace Spans"
                  height={250}
                  color="#F57C00"
                  yLabel="Span Count"
                />
              </div>

              <div style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <TimeSeriesChart
                  data={usage.map((d: any) => ({
                    timestamp: d.date,
                    value: d.rum_events || 0
                  }))}
                  title="Daily RUM Events"
                  height={250}
                  color="#7B1FA2"
                  yLabel="Event Count"
                />
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ 
            padding: '80px', 
            textAlign: 'center',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            Loading usage data...
          </div>
        )}

        {!isLoading && usage.length === 0 && (
          <div style={{ 
            padding: '80px', 
            textAlign: 'center',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px'
          }}>
            No usage data available for the selected period
          </div>
        )}

        {/* Pricing Info */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '24px',
          marginTop: '32px'
        }}>
          <h2 style={{ 
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Pricing Tiers (Example)
          </h2>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Logs
              </div>
              <div>$0.50 per GB ingested</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Metrics
              </div>
              <div>$0.05 per 1M data points</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Traces
              </div>
              <div>$1.25 per 1M spans</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                RUM
              </div>
              <div>$2.50 per 1M events</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ title, value, subtitle, color }: any) {
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
        fontSize: '32px',
        fontWeight: 600,
        color,
        marginBottom: '4px'
      }}>
        {value}
      </div>
      <div style={{ 
        fontSize: '12px',
        color: 'var(--text-tertiary)'
      }}>
        {subtitle}
      </div>
    </div>
  );
}

