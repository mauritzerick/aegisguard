import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      effectiveTheme: getSystemTheme(),
      setTheme: (theme: Theme) => {
        const effectiveTheme = resolveTheme(theme);
        set({ theme, effectiveTheme });
        
        // Update document class for CSS
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(effectiveTheme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute(
            'content',
            effectiveTheme === 'dark' ? '#1A1A1A' : '#FFFFFF'
          );
        }
      },
    }),
    {
      name: 'aegis-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply theme immediately on load
          const effectiveTheme = resolveTheme(state.theme);
          document.documentElement.classList.add(effectiveTheme);
        }
      },
    }
  )
);

// Listen to system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.theme === 'system') {
      state.setTheme('system');
    }
  });
}

