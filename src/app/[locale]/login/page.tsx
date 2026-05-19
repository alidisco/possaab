'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { Zap, Eye, EyeOff, Globe, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const login = useAuthStore(s => s.login);

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
    router.push(`/${locale === 'en' ? 'ar' : 'en'}/login`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* Dotted grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Ambient glow orbs */}
      <div className="absolute floating-orb-1" style={{
        top: '10%', left: '8%',
        width: 420, height: 420,
        background: 'radial-gradient(circle, rgba(59,130,246,0.14), transparent 70%)',
        filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div className="absolute floating-orb-2" style={{
        bottom: '10%', right: '8%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)',
        filter: 'blur(70px)', borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div className="absolute floating-orb-3" style={{
        top: '55%', left: '55%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(34,197,94,0.07), transparent 70%)',
        filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Language toggle */}
      <button
        onClick={toggleLocale}
        className="absolute top-5 right-5 btn btn-ghost login-lang-btn text-sm z-10 gap-2"
      >
        <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>{locale === 'en' ? 'العربية' : 'English'}</span>
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 animate-fade-up">

        {/* Glow ring behind card */}
        <div className="login-card-glow" />

        <div className="login-card">

          {/* Logo */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="login-logo">
              <Zap size={28} style={{ color: '#93c5fd' }} />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold gradient-text mb-1">{t('common.appName')}</h1>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('auth.loginSubtitle')}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="login-error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('common.email')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="glass-input"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                {t('common.password')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="glass-input"
                  style={{ paddingRight: 44 }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.28)', padding: 4 }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full btn-lg"
              >
                {loading ? (
                  <><Loader2 size={17} className="animate-spin" />{t('auth.loggingIn')}</>
                ) : t('auth.loginButton')}
              </button>
            </div>
          </form>

          {/* Hint */}
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-center text-xs" style={{ color: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}>
              admin@saab.com · saab2024
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-center mt-4 text-xs" style={{ color: 'var(--text-disabled)' }}>
          v1.0.0 · Offline POS System
        </p>
      </div>
    </div>
  );
}