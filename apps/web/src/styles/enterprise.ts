// Enterprise Design System - Color Palette and Styles

export const colors = {
  // Primary - Professional Blue
  primary: {
    main: '#1565C0',
    light: '#1976D2',
    dark: '#0D47A1',
    contrast: '#FFFFFF',
  },
  
  // Neutral Grays
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Semantic Colors
  success: {
    main: '#2E7D32',
    light: '#4CAF50',
    bg: '#E8F5E9',
  },
  warning: {
    main: '#ED6C02',
    light: '#FF9800',
    bg: '#FFF3E0',
  },
  error: {
    main: '#D32F2F',
    light: '#F44336',
    bg: '#FFEBEE',
  },
  info: {
    main: '#0288D1',
    light: '#03A9F4',
    bg: '#E3F2FD',
  },
  
  // Role Colors (Muted)
  roles: {
    admin: { bg: '#E8EAF6', text: '#3F51B5' },
    analyst: { bg: '#FFF3E0', text: '#F57C00' },
    user: { bg: '#F3E5F5', text: '#7B1FA2' },
  },
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  monoFamily: '"SF Mono", Monaco, Menlo, Consolas, "Courier New", monospace',
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '15px',     // Changed from 14px to 15px
    lg: '17px',
    xl: '20px',
    xxl: '28px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '-0.01em',
    wide: '0.01em',
  },
};

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

export const borderRadius = {
  sm: '2px',
  md: '4px',
  lg: '6px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
};

// Common component styles
export const tableStyles = {
  container: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.neutral[50],
    borderBottom: `1px solid ${colors.neutral[300]}`,
  },
  cell: {
    padding: '12px 16px',
    fontSize: typography.fontSize.base,
    color: colors.neutral[800],
  },
  headerCell: {
    padding: '12px 16px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral[700],
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
};

export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary.main,
    color: colors.primary.contrast,
    border: 'none',
    padding: '10px 20px',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[700],
    border: `1px solid ${colors.neutral[300]}`,
    padding: '10px 20px',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  danger: {
    backgroundColor: colors.error.bg,
    color: colors.error.main,
    border: `1px solid ${colors.error.light}`,
    padding: '8px 16px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export const badgeStyles = {
  default: {
    display: 'inline-block' as const,
    padding: '4px 10px',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
};

