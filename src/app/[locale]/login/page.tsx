'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { Zap, Eye, EyeOff, Globe, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        login(data.user);
        router.push(`/${locale}/dashboard`);
      } else {
        setError(data.error || t('auth.invalidCredentials'));
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    router.push(`/${newLocale}/login`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(59, 130, 246, 0.04) 0%, transparent 50%)'
      }} />

      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 floating-orb-1" style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent)',
        filter: 'blur(60px)'
      }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-15 floating-orb-2" style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent)',
        filter: 'blur(80px)'
      }} />

      {/* Language toggle */}
      <button
        onClick={toggleLocale}
        className="absolute top-6 right-6 btn btn-ghost flex items-center gap-2 text-sm z-10"
        style={{ position: 'absolute' }}
        id="language-toggle"
      >
        <Globe size={16} />
        {locale === 'en' ? 'العربية' : 'English'}
      </button>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="glass-card p-8 md:p-10">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <Zap size={32} className="text-primary-400" />
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-1">
              {t('common.appName')}
            </h1>
            <p className="text-surface-400 text-sm">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg text-sm animate-fade-in" style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171'
              }}>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                {t('common.email')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="input-field"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                {t('common.password')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="input-field"
                  style={{ paddingRight: '44px' }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.loginButton')
              )}
            </button>
          </form>

          {/* Footer hint */}
          <div className="mt-6 text-center">
            <p className="text-surface-600 text-xs">
              Default: admin@saab.com / saab2024
            </p>
          </div>
        </div>

        {/* Version tag */}
        <div className="text-center mt-4">
          <span className="text-surface-600 text-xs">v1.0.0 • Offline POS System</span>
        </div>
      </div>

    </div>
  );
}
