import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBranding } from '../contexts/BrandingContext';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { login, register, user, loading } = useAuth();
  const { t } = useLanguage();
  const { branding } = useBranding();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Login successful!');
      } else {
        await register(email, password, fullName, 'super_admin');
        toast.success('Registration successful!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-950"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen noise-texture flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background, #f8fafc)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-xl sm:rounded-2xl border shadow-lg p-6 sm:p-8" style={{ backgroundColor: 'var(--card, white)', borderColor: 'var(--border, #e2e8f0)' }}>
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="Logo" className="w-14 h-14 object-contain" />
            ) : (
              <div className="p-3 sm:p-4 rounded-full" style={{ backgroundColor: 'var(--primary, #2D4F38)' }}>
                <Building2 className="text-white" size={28} />
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-center mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--primary, #1e1b4b)' }}>
            {branding.app_name || 'HR Platform'}
          </h1>
          <p className="text-center mb-6 sm:mb-8 text-sm sm:text-base" style={{ color: 'var(--muted-foreground, #64748b)' }}>
            {isLogin ? t('login') : t('register')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--foreground, #334155)' }}>
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  data-testid="fullname-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 outline-none text-base"
                  style={{ borderColor: 'var(--border, #e2e8f0)', backgroundColor: 'var(--muted, #f8fafc)', color: 'var(--foreground, #0f172a)' }}
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--foreground, #334155)' }}>
                {t('email')}
              </label>
              <input
                type="email"
                data-testid="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border transition-all duration-200 outline-none text-base"
                style={{ borderColor: 'var(--border, #e2e8f0)', backgroundColor: 'var(--muted, #f8fafc)', color: 'var(--foreground, #0f172a)' }}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                {t('password')}
              </label>
              <input
                type="password"
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 outline-none text-base"
                required
              />
            </div>

            <button
              type="submit"
              data-testid="submit-button"
              className="w-full py-3 bg-indigo-950 text-white rounded-full font-medium hover:bg-indigo-900 shadow-lg hover:shadow-xl transition-all duration-300 text-base"
            >
              {isLogin ? t('login') : t('register')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              data-testid="toggle-auth-mode"
              className="text-sm text-slate-600 hover:text-indigo-950 transition-colors"
            >
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
