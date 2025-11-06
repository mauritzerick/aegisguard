import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Nav } from '../components/Nav';
import { api } from '../lib/api';

export function SLOs() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch SLOs
  const { data: slosData } = useQuery({
    queryKey: ['slos'],
    queryFn: async () => {
      const response = await api.get('/slo');
      return response.data;
    }
  });

  const slos = slosData?.slos || [];

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
              Service Level Objectives (SLOs)
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              Track reliability targets and error budgets
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Create SLO'}
          </button>
        </div>

        {/* SLO Cards */}
        {slos.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '60px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              No SLOs configured
            </div>
            <div style={{ fontSize: '14px' }}>
              Create your first SLO to start tracking reliability
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {slos.map((slo: any) => (
              <SLOCard key={slo.id} slo={slo} />
            ))}
          </div>
        )}

        {/* Example SLOs for demonstration */}
        {slos.length === 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ 
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}>
              Example SLOs
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '24px'
            }}>
              <SLOCard slo={{
                id: 'example-1',
                name: 'API Availability',
                target: 99.9,
                window: '30d',
                current: 99.95,
                errorBudget: 80,
                status: 'healthy'
              }} isExample />
              <SLOCard slo={{
                id: 'example-2',
                name: 'Request Latency P95',
                target: 95,
                window: '7d',
                current: 92.3,
                errorBudget: -15,
                status: 'at-risk'
              }} isExample />
              <SLOCard slo={{
                id: 'example-3',
                name: 'Error Rate',
                target: 99.5,
                window: '30d',
                current: 98.1,
                errorBudget: -80,
                status: 'breached'
              }} isExample />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SLOCard({ slo, isExample = false }: { slo: any; isExample?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#388E3C';
      case 'at-risk': return '#F57C00';
      case 'breached': return '#D32F2F';
      default: return '#757575';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return '✓ Healthy';
      case 'at-risk': return '⚠ At Risk';
      case 'breached': return '✗ Breached';
      default: return 'Unknown';
    }
  };

  const errorBudgetPercent = Math.max(0, Math.min(100, slo.errorBudget));

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '20px',
      opacity: isExample ? 0.6 : 1
    }}>
      {isExample && (
        <div style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          backgroundColor: '#F5F5F5',
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-block',
          marginBottom: '12px'
        }}>
          EXAMPLE
        </div>
      )}
      
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{ 
            margin: '0 0 4px 0',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {slo.name}
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Target: {slo.target}% • {slo.window}
          </div>
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: getStatusColor(slo.status),
          textTransform: 'uppercase'
        }}>
          {getStatusLabel(slo.status)}
        </div>
      </div>

      {/* Current Achievement */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '32px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '4px'
        }}>
          {slo.current}%
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Current achievement
        </div>
      </div>

      {/* Error Budget */}
      <div>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Error Budget
          </span>
          <span style={{ 
            fontSize: '13px',
            fontWeight: 600,
            color: errorBudgetPercent > 20 ? '#388E3C' : errorBudgetPercent > 0 ? '#F57C00' : '#D32F2F'
          }}>
            {slo.errorBudget}%
          </span>
        </div>
        <div style={{
          height: '8px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${errorBudgetPercent}%`,
            backgroundColor: errorBudgetPercent > 20 ? '#388E3C' : errorBudgetPercent > 0 ? '#F57C00' : '#D32F2F',
            transition: 'width 0.3s'
          }} />
        </div>
      </div>
    </div>
  );
}

