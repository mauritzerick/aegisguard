import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '400px',
      width: '100%',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const styles = getToastStyles(toast.type);

  return (
    <div
      style={{
        ...baseToastStyle,
        ...styles,
        animation: isExiting ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.3s ease-out',
        pointerEvents: 'auto',
      }}
      onClick={() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flexShrink: 0 }}>
          {getIcon(toast.type)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 600, 
            color: '#212121',
            marginBottom: toast.message ? '4px' : 0
          }}>
            {toast.title}
          </div>
          {toast.message && (
            <div style={{ 
              fontSize: '13px', 
              color: '#616161',
              lineHeight: '1.5'
            }}>
              {toast.message}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: '#9E9E9E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#212121'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9E9E9E'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const baseToastStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  backgroundColor: '#FFFFFF',
};

function getToastStyles(type: ToastType): React.CSSProperties {
  switch (type) {
    case 'success':
      return {
        borderLeft: '4px solid #4CAF50',
      };
    case 'error':
      return {
        borderLeft: '4px solid #F44336',
      };
    case 'warning':
      return {
        borderLeft: '4px solid #FF9800',
      };
    case 'info':
      return {
        borderLeft: '4px solid #2196F3',
      };
  }
}

function getIcon(type: ToastType) {
  const iconStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
  };

  switch (type) {
    case 'success':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'error':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    case 'warning':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="#FF9800" strokeWidth="2">
          <path d="M12 2L2 20h20L12 2z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      );
    case 'info':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      );
  }
}

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(styleSheet);





