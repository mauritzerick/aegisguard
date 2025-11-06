import { useState, useEffect } from 'react';
import { Nav } from '../components/Nav';
import { api } from '../lib/api';

interface WebhookHistory {
  timestamp: string;
  signature: string;
  valid: boolean;
  body: any;
}

export function WebhookPlayground() {
  const [payload, setPayload] = useState(JSON.stringify({ event: 'test', data: { message: 'Hello World' } }, null, 2));
  const [secret, setSecret] = useState('demo-webhook-secret-12345');
  const [target, setTarget] = useState('/playground/webhook/receive');
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<WebhookHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/playground/webhook/history');
      setHistory(response.data.webhooks || []);
    } catch (error) {
      console.error('Failed to fetch webhook history:', error);
    }
  };

  const sendWebhook = async () => {
    setLoading(true);
    setResult(null);

    try {
      const parsedPayload = JSON.parse(payload);
      // Send both the parsed payload AND the original string to preserve exact JSON format
      // This ensures the signature matches what was actually written in the editor
      const response = await api.post('/playground/webhook/send', {
        target,
        body: parsedPayload,
        bodyString: payload, // Send original JSON string to preserve formatting
        secret,
      });

      setResult(response.data);
      await fetchHistory();
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        details: error.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await api.post('/playground/webhook/clear-history');
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const isValidJSON = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      <Nav />
      <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Webhook Playground</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Test HMAC signature signing and verification locally
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Left Panel: Payload Editor */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>📝 Payload</h3>
            
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              style={{
                width: '100%',
                height: '300px',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '13px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: `2px solid ${isValidJSON(payload) ? 'var(--success)' : 'var(--error)'}`,
                borderRadius: '6px',
                resize: 'vertical',
              }}
              placeholder='{"event": "test", "data": {"message": "Hello World"}}'
            />
            
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                🔐 Secret Key
              </label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
                placeholder="Enter your secret key"
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                🎯 Target Endpoint
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                }}
              />
            </div>

            <button
              onClick={sendWebhook}
              disabled={loading || !isValidJSON(payload)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                background: loading ? 'var(--text-tertiary)' : 'var(--accent-primary)',
                color: '#FFF',
                fontWeight: 600,
                fontSize: '15px',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: !isValidJSON(payload) ? 0.5 : 1,
              }}
            >
              {loading ? '⏳ Sending...' : '🚀 Sign & Send Webhook'}
            </button>
          </div>

          {/* Right Panel: Result & Verification */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>✅ Result & Verification</h3>
            
            {!result && (
              <div
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  fontSize: '14px',
                }}
              >
                Click "Sign & Send Webhook" to test
              </div>
            )}

            {result && (
              <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                <div
                  style={{
                    padding: '16px',
                    background: result.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    border: `2px solid ${result.success ? 'var(--success)' : 'var(--error)'}`,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {result.success ? '✓ Signature Valid' : '✗ Signature Invalid'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Latency: {result.latency_ms}ms
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    Signature:
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      background: 'var(--bg-primary)',
                      borderRadius: '6px',
                      wordBreak: 'break-all',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {result.signature}
                  </div>
                </div>

                {result.verification && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                      Verification Details:
                    </div>
                    <pre
                      style={{
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                        overflow: 'auto',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {JSON.stringify(result.verification, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Panel: History */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>📜 Webhook History ({history.length})</h3>
            <button
              onClick={clearHistory}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
              }}
            >
              Clear History
            </button>
          </div>

          {history.length === 0 && (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '14px',
              }}
            >
              No webhook history yet
            </div>
          )}

          {history.length > 0 && (
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {history.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    background: 'var(--bg-primary)',
                    borderRadius: '6px',
                    border: `1px solid ${item.valid ? 'var(--success)' : 'var(--error)'}`,
                    borderLeft: `4px solid ${item.valid ? 'var(--success)' : 'var(--error)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: item.valid ? 'var(--success)' : 'var(--error)' }}>
                      {item.valid ? '✓ Valid' : '✗ Invalid'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    Signature: {item.signature}
                  </div>
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '13px' }}>
                      View Payload
                    </summary>
                    <pre
                      style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        overflow: 'auto',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {JSON.stringify(item.body, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

