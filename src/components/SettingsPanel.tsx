import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import type { ProxyConfig, AutoSaveConfig, FilterConfig } from '../types/scraper';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    proxy: ProxyConfig;
    onProxyChange: (proxy: ProxyConfig) => void;
    autoSave: AutoSaveConfig;
    onAutoSaveChange: (autoSave: AutoSaveConfig) => void;
    filters: FilterConfig;
    onFiltersChange: (filters: FilterConfig) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    isOpen, onClose, proxy, onProxyChange, autoSave, onAutoSaveChange, filters, onFiltersChange,
}) => {
    const { t } = useLanguage();
    const [proxyTesting, setProxyTesting] = useState(false);
    const [proxyTestResult, setProxyTestResult] = useState<{ success: boolean; message: string } | null>(null);

    if (!isOpen) return null;

    const handleProxyTest = async (proxyUrl: string) => {
        setProxyTesting(true);
        setProxyTestResult(null);
        try {
            const result = await window.ipcRenderer.invoke('scraper:testProxy', proxyUrl);
            setProxyTestResult(result);
        } catch (err: any) {
            setProxyTestResult({ success: false, message: err.message });
        } finally {
            setProxyTesting(false);
        }
    };

    const sectionStyle: React.CSSProperties = {
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
    };

    const sectionTitle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--accent-primary)',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: 4,
        display: 'block',
    };

    const toggleRow: React.CSSProperties = {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '8px 0',
        gap: 12,
    };

    const radioGroup = (
        options: { value: string; label: string }[],
        current: string,
        onChange: (val: string) => void,
    ) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {options.map(opt => (
                <label key={opt.value} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', cursor: 'pointer', fontSize: 12,
                    borderRadius: 'var(--radius-md)',
                    background: current === opt.value ? 'var(--accent-muted)' : 'transparent',
                    color: current === opt.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: current === opt.value ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    transition: 'all var(--transition-fast)',
                }}>
                    <input
                        type="radio"
                        checked={current === opt.value}
                        onChange={() => onChange(opt.value)}
                        style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    {opt.label}
                </label>
            ))}
        </div>
    );

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                className="animate-fadeIn"
                style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                }}
            />

            {/* Panel */}
            <div
                className="animate-slideIn"
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: 360, zIndex: 101,
                    background: 'var(--surface-100)',
                    borderLeft: '1px solid var(--border-default)',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--surface-200)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 'var(--radius-md)',
                            background: 'var(--gradient-primary)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" fill="none" stroke="#0F1117" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{t.settings.title}</h2>
                    </div>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                        ✕ {t.settings.close}
                    </button>
                </div>

                {/* Scrollable Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>

                    {/* ═══ PROXY ═══ */}
                    <div style={sectionStyle}>
                        <div style={sectionTitle}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                            </svg>
                            {t.settings.proxyTitle}
                        </div>

                        {radioGroup(
                            [
                                { value: 'none', label: t.settings.proxyNone },
                                { value: 'rotating', label: t.settings.proxyRotating },
                                { value: 'sticky', label: t.settings.proxySticky },
                            ],
                            proxy.mode,
                            (val) => onProxyChange({ ...proxy, mode: val as ProxyConfig['mode'] }),
                        )}

                        {proxy.mode === 'rotating' && (
                            <div className="animate-fadeIn" style={{ marginTop: 10 }}>
                                <label style={labelStyle}>{t.settings.proxyRotatingUrl}</label>
                                <input
                                    className="input-premium"
                                    value={proxy.rotatingProxy}
                                    onChange={e => { onProxyChange({ ...proxy, rotatingProxy: e.target.value }); setProxyTestResult(null); }}
                                    placeholder={t.settings.proxyRotatingPlaceholder}
                                    style={{ fontFamily: 'var(--font-data)', fontSize: 11 }}
                                />
                                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                        className="btn-premium"
                                        disabled={proxyTesting || !proxy.rotatingProxy.trim()}
                                        onClick={() => handleProxyTest(proxy.rotatingProxy)}
                                        style={{ padding: '4px 12px', fontSize: 11 }}
                                    >
                                        {proxyTesting ? '⏳ Test...' : '🔌 Test Proxy'}
                                    </button>
                                    {proxyTestResult && (
                                        <span style={{ fontSize: 10, color: proxyTestResult.success ? '#22c55e' : '#ef4444' }}>
                                            {proxyTestResult.message}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {proxy.mode === 'sticky' && (
                            <div className="animate-fadeIn" style={{ marginTop: 10 }}>
                                <label style={labelStyle}>{t.settings.proxyStickyList}</label>
                                <textarea
                                    className="input-premium"
                                    value={proxy.stickyProxies.join('\n')}
                                    onChange={e => { onProxyChange({ ...proxy, stickyProxies: e.target.value.split('\n').filter(l => l.trim()) }); setProxyTestResult(null); }}
                                    placeholder={t.settings.proxyStickyPlaceholder}
                                    style={{ height: 80, fontFamily: 'var(--font-data)', fontSize: 11, resize: 'vertical' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                                        {t.settings.proxyStickyHelp} • {proxy.stickyProxies.length} proxy
                                    </p>
                                    {proxy.stickyProxies.length > 0 && (
                                        <button
                                            className="btn-premium"
                                            disabled={proxyTesting}
                                            onClick={() => handleProxyTest(proxy.stickyProxies[0])}
                                            style={{ padding: '4px 12px', fontSize: 11 }}
                                        >
                                            {proxyTesting ? '⏳ Test...' : '🔌 Test'}
                                        </button>
                                    )}
                                </div>
                                {proxyTestResult && (
                                    <p style={{ fontSize: 10, marginTop: 4, color: proxyTestResult.success ? '#22c55e' : '#ef4444' }}>
                                        {proxyTestResult.message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ═══ AUTO-SAVE ═══ */}
                    <div style={sectionStyle}>
                        <div style={sectionTitle}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            {t.settings.autoSaveTitle}
                        </div>

                        {radioGroup(
                            [
                                { value: 'off', label: t.settings.autoSaveOff },
                                { value: 'per-district', label: t.settings.autoSavePerDistrict },
                                { value: 'per-state', label: t.settings.autoSavePerState },
                                { value: 'per-count', label: t.settings.autoSavePerCount },
                            ],
                            autoSave.mode,
                            (val) => onAutoSaveChange({ ...autoSave, mode: val as AutoSaveConfig['mode'] }),
                        )}

                        {autoSave.mode === 'per-count' && (
                            <div className="animate-fadeIn" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <label style={{ ...labelStyle, margin: 0, whiteSpace: 'nowrap' }}>{t.settings.autoSaveCount}</label>
                                <input
                                    type="number"
                                    className="input-premium"
                                    value={autoSave.count}
                                    onChange={e => onAutoSaveChange({ ...autoSave, count: parseInt(e.target.value) || 1000 })}
                                    min={100} max={50000} step={100}
                                    style={{ width: 80, fontFamily: 'var(--font-data)', fontSize: 12, textAlign: 'center' }}
                                />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.settings.autoSaveCountHelp}</span>
                            </div>
                        )}

                        {/* Kayıt Klasörü */}
                        {autoSave.mode !== 'off' && (
                            <div className="animate-fadeIn" style={{ marginTop: 10 }}>
                                <label style={labelStyle}>Kayıt Klasörü</label>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button
                                        className="btn-ghost"
                                        onClick={async () => {
                                            const folder = await window.ipcRenderer.invoke('scraper:selectFolder');
                                            if (folder) onAutoSaveChange({ ...autoSave, savePath: folder });
                                        }}
                                        style={{ padding: '4px 10px', fontSize: 11, whiteSpace: 'nowrap' }}
                                    >
                                        📂 Klasör Seç
                                    </button>
                                    <span style={{
                                        fontSize: 10, color: 'var(--text-muted)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        direction: 'rtl', textAlign: 'left',
                                    }}>
                                        {autoSave.savePath || 'Desktop (varsayılan)'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ═══ FILTERS ═══ */}
                    <div style={sectionStyle}>
                        <div style={sectionTitle}>
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                            </svg>
                            {t.settings.filterTitle}
                        </div>

                        {/* Require Phone */}
                        <div style={toggleRow}>
                            <div>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{t.settings.requirePhone}</span>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t.settings.requirePhoneHelp}</p>
                            </div>
                            <input
                                type="checkbox" className="checkbox-premium"
                                checked={filters.requirePhone}
                                onChange={e => onFiltersChange({ ...filters, requirePhone: e.target.checked })}
                                style={{ marginTop: 2 }}
                            />
                        </div>

                        {/* Require Website */}
                        <div style={toggleRow}>
                            <div>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{t.settings.requireWebsite}</span>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t.settings.requireWebsiteHelp}</p>
                            </div>
                            <input
                                type="checkbox" className="checkbox-premium"
                                checked={filters.requireWebsite}
                                onChange={e => onFiltersChange({ ...filters, requireWebsite: e.target.checked })}
                                style={{ marginTop: 2 }}
                            />
                        </div>

                        {/* Min Rating */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>{t.settings.minRating}</label>
                                <input
                                    type="number" className="input-premium"
                                    value={filters.minRating}
                                    onChange={e => onFiltersChange({ ...filters, minRating: parseFloat(e.target.value) || 0 })}
                                    min={0} max={5} step={0.5}
                                    style={{ fontFamily: 'var(--font-data)', fontSize: 12 }}
                                />
                                <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t.settings.minRatingHelp}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>{t.settings.minReviews}</label>
                                <input
                                    type="number" className="input-premium"
                                    value={filters.minReviews}
                                    onChange={e => onFiltersChange({ ...filters, minReviews: parseInt(e.target.value) || 0 })}
                                    min={0} max={10000} step={1}
                                    style={{ fontFamily: 'var(--font-data)', fontSize: 12 }}
                                />
                                <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '2px 0 0' }}>{t.settings.minReviewsHelp}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPanel;
