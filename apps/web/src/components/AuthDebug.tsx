// Temporary debug component - can be removed later
export function AuthDebug() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const trimmed = cookie.trim();
    if (!trimmed) return acc;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('='); // Handle values with '=' in them
    if (key) {
      acc[key] = value || ''; // Ensure value is always a string
    }
    return acc;
  }, {} as Record<string, string>);

  const hasCookies = Object.keys(cookies).length > 0;
  const hasAuth = 'access_token' in cookies;

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      padding: '12px',
      backgroundColor: hasCookies ? (hasAuth ? '#E8F5E9' : '#FFF3E0') : '#FFEBEE',
      border: '1px solid',
      borderColor: hasCookies ? (hasAuth ? '#4CAF50' : '#FF9800') : '#F44336',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#212121' }}>
        Auth Status
      </div>
      <div style={{ color: '#424242' }}>
        <div>Cookies: {hasCookies ? '✓' : '✗'}</div>
        <div>Access Token: {hasAuth ? '✓' : '✗'}</div>
        <div>Count: {Object.keys(cookies).length}</div>
        {Object.keys(cookies).length > 0 && (
          <details style={{ marginTop: '6px' }}>
            <summary style={{ cursor: 'pointer', color: '#1565C0' }}>
              View Cookies
            </summary>
            <div style={{ marginTop: '4px', fontSize: '10px' }}>
              {Object.keys(cookies).map(key => {
                const value = cookies[key] || '';
                return (
                  <div key={key}>
                    {key}: {value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : '(empty)'}
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}



