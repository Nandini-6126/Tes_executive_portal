import { useState, useEffect } from 'react';
import { Settings, Bell, Moon, Sun, Globe, Monitor, Palette, Save, CheckCircle, Loader2, RotateCcw, Info, Type } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import Button from '../components/common/Button';
import { PageLoader } from '../components/common/LoadingSpinner';

export default function SettingsPage() {
  const { settings: savedSettings, updateSettings, resetSettings, isLoaded } = useSettings();
  const [settings, setSettings] = useState(savedSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync local state with context when loaded
  useEffect(() => {
    if (isLoaded) {
      setSettings(savedSettings);
    }
  }, [savedSettings, isLoaded]);

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaved(false);
    
    // Apply changes immediately for preview
    applyPreview(newSettings);
  };

  // Apply preview without saving
  const applyPreview = (newSettings) => {
    const root = document.documentElement;
    const body = document.body;

    // Apply theme preview
    if (newSettings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.setAttribute('data-theme', 'light');
    } else if (newSettings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      body.setAttribute('data-theme', 'dark');
    }

    // Apply animations preview
    if (newSettings.show_animations) {
      body.classList.remove('no-animations');
    } else {
      body.classList.add('no-animations');
    }

    // Apply compact view preview
    if (newSettings.compact_view) {
      body.classList.add('compact-view');
    } else {
      body.classList.remove('compact-view');
    }

    // Apply high contrast preview
    if (newSettings.high_contrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }

    // Apply font size preview
    root.classList.remove('font-small', 'font-medium', 'font-large');
    const fontSize = newSettings.font_size || 'medium';
    root.classList.add(`font-${fontSize}`);
    
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[fontSize] || '16px');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save settings. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      setSettings({
        theme: 'dark',
        language: 'en',
        compact_view: false,
        show_animations: true,
        high_contrast: false,
        font_size: 'medium',
        notify_email: true,
        notify_browser: false,
        notify_service_updates: true,
        notify_new_customers: true,
        notify_weekly_report: false,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to reset settings.');
    }
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-primary-500' : 'bg-dark-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  if (!isLoaded) {
    return <PageLoader text="Loading settings..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary-400" />
          Settings
        </h1>
        <p className="text-slate-400 mt-1">Manage your preferences and application settings</p>
      </div>

      {/* Preview Notice */}
      <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 text-primary-400 mt-0.5" />
        <div>
          <p className="text-sm text-primary-400 font-medium">Live Preview Enabled</p>
          <p className="text-xs text-primary-400/70 mt-0.5">Changes are previewed immediately. Click "Save Settings" to keep them.</p>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-sm text-emerald-400">Settings saved successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 animate-fadeIn">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary-400" />
            Appearance
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleChange('theme', 'light')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <Sun className={`w-5 h-5 ${settings.theme === 'light' ? 'text-primary-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${settings.theme === 'light' ? 'text-primary-400' : 'text-slate-500'}`}>Light</span>
                </button>
                <button
                  onClick={() => handleChange('theme', 'dark')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <Moon className={`w-5 h-5 ${settings.theme === 'dark' ? 'text-primary-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${settings.theme === 'dark' ? 'text-primary-400' : 'text-slate-500'}`}>Dark</span>
                </button>
                <button
                  onClick={() => handleChange('theme', 'system')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    settings.theme === 'system'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <Monitor className={`w-5 h-5 ${settings.theme === 'system' ? 'text-primary-400' : 'text-slate-500'}`} />
                  <span className={`text-xs ${settings.theme === 'system' ? 'text-primary-400' : 'text-slate-500'}`}>System</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="select"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Type className="w-4 h-4 inline mr-1" />
                Font Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleChange('font_size', 'small')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    settings.font_size === 'small'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <span className={`text-xs ${settings.font_size === 'small' ? 'text-primary-400' : 'text-slate-500'}`}>A</span>
                  <span className={`text-xs ${settings.font_size === 'small' ? 'text-primary-400' : 'text-slate-500'}`}>Small</span>
                </button>
                <button
                  onClick={() => handleChange('font_size', 'medium')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    (settings.font_size === 'medium' || !settings.font_size)
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <span className={`text-sm ${(settings.font_size === 'medium' || !settings.font_size) ? 'text-primary-400' : 'text-slate-500'}`}>A</span>
                  <span className={`text-xs ${(settings.font_size === 'medium' || !settings.font_size) ? 'text-primary-400' : 'text-slate-500'}`}>Medium</span>
                </button>
                <button
                  onClick={() => handleChange('font_size', 'large')}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${
                    settings.font_size === 'large'
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-700 hover:border-dark-600'
                  }`}
                >
                  <span className={`text-base ${settings.font_size === 'large' ? 'text-primary-400' : 'text-slate-500'}`}>A</span>
                  <span className={`text-xs ${settings.font_size === 'large' ? 'text-primary-400' : 'text-slate-500'}`}>Large</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary-400" />
            Display Options
          </h2>
          
          <div className="divide-y divide-dark-700/50">
            <ToggleSwitch
              enabled={settings.compact_view}
              onChange={() => handleChange('compact_view', !settings.compact_view)}
              label="Compact View"
              description="Show more content in less space"
            />
            <ToggleSwitch
              enabled={settings.show_animations}
              onChange={() => handleChange('show_animations', !settings.show_animations)}
              label="Show Animations"
              description="Enable smooth transitions and effects"
            />
            <ToggleSwitch
              enabled={settings.high_contrast}
              onChange={() => handleChange('high_contrast', !settings.high_contrast)}
              label="High Contrast"
              description="Improve visibility with higher contrast"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-400" />
            Notifications
            <span className="text-xs text-slate-500 font-normal ml-2">(Email integration coming soon)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="divide-y divide-dark-700/50">
              <ToggleSwitch
                enabled={settings.notify_email}
                onChange={() => handleChange('notify_email', !settings.notify_email)}
                label="Email Notifications"
                description="Receive updates via email"
              />
              <ToggleSwitch
                enabled={settings.notify_browser}
                onChange={() => handleChange('notify_browser', !settings.notify_browser)}
                label="Browser Notifications"
                description="Show desktop notifications"
              />
            </div>
            <div className="divide-y divide-dark-700/50">
              <ToggleSwitch
                enabled={settings.notify_service_updates}
                onChange={() => handleChange('notify_service_updates', !settings.notify_service_updates)}
                label="Service Updates"
                description="Notify when services are updated"
              />
              <ToggleSwitch
                enabled={settings.notify_new_customers}
                onChange={() => handleChange('notify_new_customers', !settings.notify_new_customers)}
                label="New Customers"
                description="Notify when new customers are added"
              />
              <ToggleSwitch
                enabled={settings.notify_weekly_report}
                onChange={() => handleChange('notify_weekly_report', !settings.notify_weekly_report)}
                label="Weekly Report"
                description="Receive weekly summary reports"
              />
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="glass-card p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-400" />
            Data & Privacy
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-800/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Reset to Defaults</p>
                <p className="text-xs text-slate-500 mt-0.5">Reset all settings to their default values</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleReset} leftIcon={<RotateCcw className="w-4 h-4" />}>
                Reset
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-800/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">Clear Cache</p>
                <p className="text-xs text-slate-500 mt-0.5">Clear locally stored data and cache</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => { localStorage.clear(); window.location.reload(); }}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="primary" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
