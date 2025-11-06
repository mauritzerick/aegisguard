import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Nav } from '../components/Nav';
import { api } from '../lib/api';
import { useToast } from '../lib/useToast';

export function Monitors() {
  const { showToast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch monitors
  const { data: monitorsData, refetch } = useQuery({
    queryKey: ['monitors'],
    queryFn: async () => {
      const response = await api.get('/monitors');
      return response.data;
    }
  });

  const monitors = monitorsData?.monitors || [];

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
              Monitors & Alerts
            </h1>
            <p style={{ 
              margin: 0, 
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              Create and manage alert rules for your observability data
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
            {showCreateForm ? 'Cancel' : '+ Create Monitor'}
          </button>
        </div>

        {showCreateForm && (
          <CreateMonitorForm 
            onSuccess={() => {
              setShowCreateForm(false);
              refetch();
              showToast('success', 'Monitor created successfully');
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Monitors List */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px'
        }}>
          {monitors.length === 0 ? (
            <div style={{ 
              padding: '60px', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                No monitors configured
              </div>
              <div style={{ fontSize: '14px' }}>
                Create your first monitor to get started with alerting
              </div>
            </div>
          ) : (
            monitors.map((monitor: any, index: number) => (
              <div
                key={monitor.id}
                style={{
                  padding: '20px',
                  borderBottom: index < monitors.length - 1 ? '1px solid #E0E0E0' : 'none'
                }}
              >
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {monitor.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {monitor.type} • {monitor.status}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--error)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                  backgroundColor: '#F5F5F5',
                  padding: '8px 12px',
                  borderRadius: '4px'
                }}>
                  {monitor.query || monitor.condition}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CreateMonitorForm({ onSuccess, onCancel }: any) {
  const [name, setName] = useState('');
  const [type, setType] = useState('threshold');
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState('');
  const [channel, setChannel] = useState('email');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/monitors', data);
      return response.data;
    },
    onSuccess
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      type,
      query,
      threshold: Number(threshold),
      channel
    });
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px'
    }}>
      <h2 style={{ 
        margin: '0 0 20px 0',
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-primary)'
      }}>
        Create New Monitor
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              Monitor Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Error Rate Alert"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                Monitor Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="threshold">Threshold</option>
                <option value="rate">Rate</option>
                <option value="error-ratio">Error Ratio</option>
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
                Alert Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-primary)'
            }}>
              Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., avg(http_response_time_ms) or sum(errors_total)"
              required
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
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
              Threshold Value
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g., 1000"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
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
              {createMutation.isPending ? 'Creating...' : 'Create Monitor'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

