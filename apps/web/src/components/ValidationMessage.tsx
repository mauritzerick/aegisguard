// Reusable validation message component
interface ValidationMessageProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

export function ValidationMessage({ type, message }: ValidationMessageProps) {
  const styles = {
    error: {
      bg: '#FFEBEE',
      border: '#FFCDD2',
      color: '#D32F2F',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="8"/>
          <path d="M10 6v4M10 14h.01"/>
        </svg>
      )
    },
    success: {
      bg: '#E8F5E9',
      border: '#A5D6A7',
      color: '#2E7D32',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="8"/>
          <path d="M7 10l2 2 4-4"/>
        </svg>
      )
    },
    info: {
      bg: '#E3F2FD',
      border: '#90CAF9',
      color: '#1565C0',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="10" r="8"/>
          <path d="M10 10v4M10 6h.01"/>
        </svg>
      )
    }
  };

  const style = styles[type];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '12px',
      backgroundColor: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '4px',
      color: style.color,
      fontSize: '13px',
      marginBottom: '16px'
    }}>
      <div style={{ flexShrink: 0, marginTop: '1px' }}>
        {style.icon}
      </div>
      <div>{message}</div>
    </div>
  );
}

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '6px',
      fontSize: '12px',
      color: '#D32F2F'
    }}>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="10" r="8"/>
        <path d="M10 6v4M10 14h.01"/>
      </svg>
      {message}
    </div>
  );
}

interface FieldHintProps {
  message: string;
}

export function FieldHint({ message }: FieldHintProps) {
  return (
    <div style={{
      marginTop: '6px',
      fontSize: '12px',
      color: '#757575'
    }}>
      {message}
    </div>
  );
}





