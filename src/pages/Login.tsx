import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { type Language } from '../i18n';

type AuthMode = 'login' | 'register' | 'forgot';

const Login: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const { t, language, setLanguage } = useLanguage();
    const [mode, setMode] = useState<AuthMode>('login');

    // Form fields
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [licenseKey, setLicenseKey] = useState('');

    // Status
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setEmail('');
        setLicenseKey('');
        setStatus('');
        setIsSuccess(false);
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
        resetForm();
    };

    // Login with username/password
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        setLoading(true);
        setStatus(t.login.checking);
        setIsSuccess(false);

        try {
            const result = await window.ipcRenderer.invoke('auth:login-credentials', { username, password });

            if (result.success) {
                setIsSuccess(true);
                setStatus(t.login.success);
                setTimeout(onLoginSuccess, 1000);
            } else {
                setStatus(`${t.login.error}: ${result.message}`);
            }
        } catch (err: any) {
            setStatus(`${t.login.error}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Register with license key + username + password + email
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password || !email || !licenseKey) return;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setStatus(`${t.login.error}: Invalid email format`);
            return;
        }

        setLoading(true);
        setStatus(t.login.checking);
        setIsSuccess(false);

        try {
            const result = await window.ipcRenderer.invoke('auth:register', {
                username,
                password,
                email,
                licenseKey,
            });

            if (result.success) {
                setIsSuccess(true);
                setStatus(t.login.registerSuccess);
                // Switch to login mode after 2 seconds
                setTimeout(() => switchMode('login'), 2000);
            } else {
                setStatus(`${t.login.error}: ${result.message}`);
            }
        } catch (err: any) {
            setStatus(`${t.login.error}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Forgot password
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !email) return;

        setLoading(true);
        setStatus(t.login.checking);
        setIsSuccess(false);

        try {
            const result = await window.ipcRenderer.invoke('auth:forgot-password', { username, email });

            if (result.success) {
                setIsSuccess(true);
                setStatus(t.login.resetSuccess);
            } else {
                setStatus(`${t.login.error}: ${result.message}`);
            }
        } catch (err: any) {
            setStatus(`${t.login.error}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: 'var(--surface-300)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        transition: 'all var(--transition-fast)',
        boxSizing: 'border-box',
        outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        color: 'var(--text-secondary)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase' as const,
        marginBottom: '6px',
    };

    const renderForm = () => {
        switch (mode) {
            case 'login':
                return (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={labelStyle}>{t.login.username}</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t.login.usernamePlaceholder}
                                className="focus-ring"
                                style={inputStyle}
                                autoComplete="username"
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={labelStyle}>{t.login.password}</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.login.passwordPlaceholder}
                                className="focus-ring"
                                style={inputStyle}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            style={{
                                width: '100%',
                                background: loading || !username || !password
                                    ? 'var(--surface-200)'
                                    : 'var(--accent-primary)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-3)',
                                color: loading || !username || !password
                                    ? 'var(--text-muted)'
                                    : 'var(--surface-base)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
                                transition: 'var(--transition-fast)',
                            }}
                        >
                            {loading ? t.login.checking : t.login.loginButton}
                        </button>

                        {/* Forgot password link */}
                        <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
                            <button
                                type="button"
                                onClick={() => switchMode('forgot')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-primary)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                            >
                                {t.login.forgotLink}
                            </button>
                        </div>
                    </form>
                );

            case 'register':
                return (
                    <form onSubmit={handleRegister}>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={labelStyle}>{t.login.licenseKey} *</label>
                            <input
                                type="text"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                placeholder={t.login.licensePlaceholder}
                                className="focus-ring"
                                style={{ ...inputStyle, fontFamily: 'var(--font-data)' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={labelStyle}>{t.login.username} *</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t.login.usernamePlaceholder}
                                className="focus-ring"
                                style={inputStyle}
                                autoComplete="username"
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={labelStyle}>{t.login.email} *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.login.emailPlaceholder}
                                className="focus-ring"
                                style={inputStyle}
                                autoComplete="email"
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={labelStyle}>{t.login.password} *</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.login.passwordPlaceholder}
                                className="focus-ring"
                                style={inputStyle}
                                autoComplete="new-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !username || !password || !email || !licenseKey}
                            style={{
                                width: '100%',
                                background: loading || !username || !password || !email || !licenseKey
                                    ? 'var(--surface-200)'
                                    : 'var(--success)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-3)',
                                color: loading || !username || !password || !email || !licenseKey
                                    ? 'var(--text-muted)'
                                    : 'var(--text-primary)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading || !username || !password || !email || !licenseKey ? 'not-allowed' : 'pointer',
                                transition: 'var(--transition-fast)',
                            }}
                        >
                            {loading ? t.login.checking : t.login.registerButton}
                        </button>
                    </form>
                );

            case 'forgot':
                return (
                    <form onSubmit={handleForgotPassword}>
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            marginBottom: 'var(--space-4)',
                            textAlign: 'center',
                        }}>
                            {language === 'tr'
                                ? 'Kayıt olurken kullandığınız kullanıcı adı ve e-posta adresini girin.'
                                : 'Enter your username and the email you used during registration.'
                            }
                        </p>

                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={labelStyle}>{t.login.username}</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t.login.usernamePlaceholder}
                                className="focus-ring"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={labelStyle}>{t.login.email}</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.login.emailPlaceholder}
                                className="focus-ring"
                                style={inputStyle}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !username || !email}
                            style={{
                                width: '100%',
                                background: loading || !username || !email
                                    ? 'var(--surface-200)'
                                    : 'var(--accent-primary)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: 'var(--space-3)',
                                color: loading || !username || !email
                                    ? 'var(--text-muted)'
                                    : 'var(--surface-base)',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading || !username || !email ? 'not-allowed' : 'pointer',
                                transition: 'var(--transition-fast)',
                            }}
                        >
                            {loading ? t.login.checking : t.login.resetButton}
                        </button>

                        {/* Back to login link */}
                        <div style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-primary)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                            >
                                {t.login.backToLogin}
                            </button>
                        </div>
                    </form>
                );
        }
    };

    return (
        <div
            style={{
                background: 'var(--surface-base)',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background gradient orbs */}
            <div style={{
                position: 'absolute', top: '-20%', left: '-10%',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-30%', right: '-15%',
                width: '600px', height: '600px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            {/* Language Switcher */}
            <div
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {t.common.language}:
                </span>
                <div
                    style={{
                        display: 'flex',
                        background: 'var(--surface-200)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px',
                    }}
                >
                    {(['en', 'tr'] as Language[]).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang)}
                            style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: 500,
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                transition: 'var(--transition-fast)',
                                background: language === lang ? 'var(--accent-primary)' : 'transparent',
                                color: language === lang ? 'var(--surface-base)' : 'var(--text-muted)',
                            }}
                        >
                            {lang.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Login Card */}
            <div
                className="animate-fadeIn"
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    margin: '0 16px',
                    background: 'var(--surface-100)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-6) var(--space-6) var(--space-5)',
                    boxShadow: 'var(--shadow-xl)',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '52px',
                            height: '52px',
                            background: 'var(--gradient-primary)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--space-4)',
                            boxShadow: 'var(--shadow-glow)',
                        }}
                    >
                        <svg
                            style={{ width: '24px', height: '24px' }}
                            fill="none"
                            stroke="#0F1117"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                    </div>

                    <h1
                        style={{
                            color: 'var(--text-primary)',
                            fontSize: '22px',
                            fontWeight: 600,
                            marginBottom: 'var(--space-2)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {t.login.title}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        {t.login.subtitle}
                    </p>
                </div>

                {/* Mode Tabs */}
                {mode !== 'forgot' && (
                    <div
                        style={{
                            display: 'flex',
                            background: 'var(--surface-200)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '3px',
                            marginBottom: 'var(--space-5)',
                        }}
                    >
                        {(['login', 'register'] as AuthMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                style={{
                                    flex: 1,
                                    padding: 'var(--space-2) var(--space-3)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    transition: 'var(--transition-fast)',
                                    background: mode === m ? 'var(--surface-base)' : 'transparent',
                                    color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                                }}
                            >
                                {m === 'login' ? t.login.tabLogin : t.login.tabRegister}
                            </button>
                        ))}
                    </div>
                )}

                {/* Forgot Password Header */}
                {mode === 'forgot' && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <h2 style={{
                            color: 'var(--text-primary)',
                            fontSize: '16px',
                            fontWeight: 600,
                            textAlign: 'center',
                        }}>
                            {t.login.tabForgot}
                        </h2>
                    </div>
                )}

                {/* Form */}
                {renderForm()}

                {/* Status Message */}
                {status && (
                    <div
                        className="animate-fadeIn"
                        style={{
                            marginTop: 'var(--space-4)',
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '13px',
                            textAlign: 'center',
                            background: isSuccess ? 'var(--success-muted)' : 'var(--error-muted)',
                            color: isSuccess ? 'var(--success)' : 'var(--error)',
                            border: `1px solid ${isSuccess ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                        }}
                    >
                        {status}
                    </div>
                )}

                {/* Footer Links */}
                {mode === 'login' && (
                    <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            {t.login.noAccount}{' '}
                            <button
                                onClick={() => switchMode('register')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-primary)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                {t.login.tabRegister}
                            </button>
                        </span>
                    </div>
                )}

                {mode === 'register' && (
                    <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            {t.login.hasAccount}{' '}
                            <button
                                onClick={() => switchMode('login')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-primary)',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                {t.login.tabLogin}
                            </button>
                        </span>
                    </div>
                )}

                {/* Powered By Footer */}
                <div
                    style={{
                        marginTop: 'var(--space-6)',
                        paddingTop: 'var(--space-4)',
                        borderTop: '1px solid var(--border-subtle)',
                        textAlign: 'center',
                    }}
                >
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {t.login.poweredBy}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
