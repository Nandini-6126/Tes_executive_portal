import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { settingsAPI } from '../api/client';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'en',
  compact_view: false,
  show_animations: true,
  high_contrast: false,
  font_size: 'medium', // small, medium, large
  notify_email: true,
  notify_browser: false,
  notify_service_updates: true,
  notify_new_customers: true,
  notify_weekly_report: false,
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Calculate effective theme (what's actually shown)
  const isLightTheme = useMemo(() => {
    if (settings.theme === 'light') return true;
    if (settings.theme === 'dark') return false;
    // System preference
    return !systemPrefersDark;
  }, [settings.theme, systemPrefersDark]);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Not logged in, apply defaults
        applySettings(DEFAULT_SETTINGS);
        setIsLoaded(true);
        return;
      }
      const response = await settingsAPI.get();
      setSettings(response.data);
      applySettings(response.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      // Use defaults on error
      applySettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Apply settings to DOM
  const applySettings = useCallback((newSettings) => {
    const root = document.documentElement;
    const body = document.body;

    // Apply theme
    if (newSettings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.setAttribute('data-theme', 'light');
      // Also set on html element for extra specificity
      root.setAttribute('data-theme', 'light');
    } else if (newSettings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        body.setAttribute('data-theme', 'dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        body.setAttribute('data-theme', 'light');
        root.setAttribute('data-theme', 'light');
      }
    } else {
      // Default to dark
      root.classList.add('dark');
      root.classList.remove('light');
      body.setAttribute('data-theme', 'dark');
      root.setAttribute('data-theme', 'dark');
    }

    // Apply animations
    if (newSettings.show_animations) {
      body.classList.remove('no-animations');
    } else {
      body.classList.add('no-animations');
    }

    // Apply compact view
    if (newSettings.compact_view) {
      body.classList.add('compact-view');
    } else {
      body.classList.remove('compact-view');
    }

    // Apply high contrast
    if (newSettings.high_contrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Apply font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    const fontSize = newSettings.font_size || 'medium';
    root.classList.add(`font-${fontSize}`);
    
    // Set CSS variable for font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[fontSize] || '16px');
  }, []);

  // Update settings
  const updateSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    applySettings(newSettings);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        // Not logged in, just apply locally
        return;
      }
      await settingsAPI.update(newSettings);
    } catch (err) {
      console.error('Failed to save settings:', err);
      throw err;
    }
  }, [applySettings]);

  // Reset settings
  const resetSettings = useCallback(async () => {
    try {
      await settingsAPI.reset();
      setSettings(DEFAULT_SETTINGS);
      applySettings(DEFAULT_SETTINGS);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      throw err;
    }
  }, [applySettings]);

  // Load settings on mount and when auth changes
  useEffect(() => {
    loadSettings();

    // Listen for login/logout
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        loadSettings();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadSettings]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPrefersDark(e.matches);
      if (settings.theme === 'system') {
        applySettings(settings);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings, applySettings]);

  const value = {
    settings,
    isLoaded,
    isLightTheme,
    updateSettings,
    resetSettings,
    loadSettings,
    applySettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export default SettingsContext;
