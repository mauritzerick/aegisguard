import React from 'react';

interface DataPoint {
  timestamp: string | Date;
  value: number;
}

interface TimeSeriesChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  color?: string;
  yLabel?: string;
}

export function TimeSeriesChart({ 
  data, 
  title, 
  height = 300, 
  color = '#1565C0',
  yLabel = 'Value'
}: TimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#757575',
        border: '1px solid #E0E0E0',
        borderRadius: '8px',
        backgroundColor: '#FAFAFA'
      }}>
        No data available
      </div>
    );
  }

  // Find min/max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Chart dimensions
  const width = 800;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth + padding.left;
  const yScale = (value: number) => 
    chartHeight - ((value - minValue) / range) * chartHeight + padding.top;

  // Generate path for line chart
  const pathData = data
    .map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.value);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (for gradient fill)
  const areaData = 
    pathData + 
    ` L ${xScale(data.length - 1)} ${chartHeight + padding.top}` +
    ` L ${padding.left} ${chartHeight + padding.top} Z`;

  // Format timestamp for display
  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    value: minValue + ratio * range,
    y: yScale(minValue + ratio * range)
  }));

  return (
    <div style={{ marginBottom: '24px' }}>
      {title && (
        <h3 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '16px', 
          fontWeight: 600,
          color: '#212121'
        }}>
          {title}
        </h3>
      )}
      <div style={{ 
        border: '1px solid #E0E0E0', 
        borderRadius: '8px', 
        padding: '16px',
        backgroundColor: '#FFFFFF'
      }}>
        <svg width={width} height={height} style={{ display: 'block' }}>
          {/* Y-axis grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#E0E0E0"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#757575"
              >
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Area fill with gradient */}
          <defs>
            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d={areaData}
            fill="url(#areaGradient)"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.value)}
              r="4"
              fill={color}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          ))}

          {/* X-axis labels (show every nth label to avoid overlap) */}
          {data
            .filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)
            .map((d, i) => {
              const originalIndex = data.indexOf(d);
              return (
                <text
                  key={originalIndex}
                  x={xScale(originalIndex)}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#757575"
                >
                  {formatTime(d.timestamp)}
                </text>
              );
            })}

          {/* Y-axis label */}
          <text
            x={-height / 2}
            y={20}
            transform={`rotate(-90)`}
            textAnchor="middle"
            fontSize="12"
            fill="#757575"
            fontWeight="500"
          >
            {yLabel}
          </text>
        </svg>
      </div>
    </div>
  );
}

