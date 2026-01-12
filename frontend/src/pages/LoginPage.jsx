import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState({ title: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (err) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;
    const message = detail?.message || detail;

    // Check for specific error messages from backend
    if (message?.includes('Invalid username or password')) {
      return {
        title: 'Incorrect Credentials',
        message: 'The username/email or password you entered is incorrect. Please try again.'
      };
    }
    
    if (message?.includes('Account is locked')) {
      return {
        title: 'Account Locked',
        message: message || 'Your account has been locked due to too many failed login attempts. Please try again later.'
      };
    }
    
    if (message?.includes('Account is disabled')) {
      return {
        title: 'Account Disabled',
        message: 'Your account has been disabled. Please contact the administrator.'
      };
    }

    if (status === 401) {
      return {
        title: 'Authentication Failed',
        message: 'Invalid username or password. Please check your credentials and try again.'
      };
    }

    if (status === 422) {
      return {
        title: 'Invalid Input',
        message: 'Please enter a valid username and password.'
      };
    }

    if (status >= 500) {
      return {
        title: 'Server Error',
        message: 'Unable to connect to the server. Please try again later.'
      };
    }

    return {
      title: 'Login Failed',
      message: message || 'An unexpected error occurred. Please try again.'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ title: '', message: '' });

    // Basic validation
    if (!formData.username.trim()) {
      setError({ title: 'Username Required', message: 'Please enter your username or email address.' });
      return;
    }

    if (!formData.password) {
      setError({ title: 'Password Required', message: 'Please enter your password.' });
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error.message) {
      setError({ title: '', message: '' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(0,119,200,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,119,200,0.3) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="glass-panel p-8 animate-fadeIn">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="/tessolve-logo.png" 
              alt="Tessolve" 
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
            <p className="text-slate-500 text-sm">Executive Portal</p>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to access your dashboard</p>
          </div>

          {/* Error Message */}
          {error.message && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fadeIn">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">{error.title}</p>
                <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input pl-12"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input pl-12 pr-12"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-dark-700/50">
            <p className="text-xs text-slate-500 text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="glass-sm p-2">
                <p className="text-xs font-medium text-accent-400">Admin</p>
                <p className="text-[10px] text-slate-500 mt-0.5">admin / Admin@123!</p>
              </div>
              <div className="glass-sm p-2">
                <p className="text-xs font-medium text-primary-400">Manager</p>
                <p className="text-[10px] text-slate-500 mt-0.5">manager / Manager@123!</p>
              </div>
              <div className="glass-sm p-2">
                <p className="text-xs font-medium text-emerald-400">Engineer</p>
                <p className="text-[10px] text-slate-500 mt-0.5">engineer / Engineer@123!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Silicon & Systems Solutions Partner
        </p>
      </div>
    </div>
  );
}
