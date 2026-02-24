import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import ResultsTable from '../components/ResultsTable';
import type { Place, ScraperProgress, SelectedLocation, CountryOption, StateOption, CityOption } from '../types/scraper';

const MainPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { t } = useLanguage();

    const [keywordText, setKeywordText] = useState('');
    const [countries, setCountries] = useState<CountryOption[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
    const [states, setStates] = useState<StateOption[]>([]);
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
    const [cities, setCities] = useState<CityOption[]>([]);
    const [selectedCityIds, setSelectedCityIds] = useState<Set<number>>(new Set());
    const [fetchDetails, setFetchDetails] = useState(false);
    const [maxPages, setMaxPages] = useState(100);
    const [maxConcurrent, setMaxConcurrent] = useState(50);
    const [results, setResults] = useState<Place[]>([]);
    const resultsRef = useRef<Place[]>([]);
    const [progress, setProgress] = useState<ScraperProgress>({
        status: 'idle', currentQuery: '', processedQueries: 0, totalQueries: 0, totalResults: 0,
    });

    // Load countries
    useEffect(() => {
        window.ipcRenderer.invoke('location:countries').then((data: CountryOption[]) => setCountries(data));
    }, []);

    // Load states
    useEffect(() => {
        if (!selectedCountryId) { setStates([]); return; }
        window.ipcRenderer.invoke('location:states', selectedCountryId).then((data: StateOption[]) => {
            setStates(data);
            setSelectedStateId(null);
            setCities([]);
            setSelectedCityIds(new Set());
        });
    }, [selectedCountryId]);

    // Load cities
    useEffect(() => {
        if (!selectedCountryId || !selectedStateId) { setCities([]); setSelectedCityIds(new Set()); return; }
        window.ipcRenderer.invoke('location:cities', selectedCountryId, selectedStateId).then((data: CityOption[]) => {
            setCities(data);
            setSelectedCityIds(new Set());
        });
    }, [selectedCountryId, selectedStateId]);

    // IPC listeners
    useEffect(() => {
        const handleData = (place: Place) => {
            resultsRef.current = [...resultsRef.current, place];
            if (resultsRef.current.length % 10 === 0 || resultsRef.current.length <= 5) {
                setResults([...resultsRef.current]);
            }
        };
        const handleProgress = (p: ScraperProgress) => {
            setProgress(p);
            if (resultsRef.current.length !== results.length) setResults([...resultsRef.current]);
        };
        const handleComplete = () => setResults([...resultsRef.current]);

        window.ipcRenderer.on('scraper:data', handleData);
        window.ipcRenderer.on('scraper:progress', handleProgress);
        window.ipcRenderer.on('scraper:complete', handleComplete);
        return () => {
            window.ipcRenderer.removeAllListeners('scraper:data');
            window.ipcRenderer.removeAllListeners('scraper:progress');
            window.ipcRenderer.removeAllListeners('scraper:complete');
        };
    }, []);

    const getSelectedLocations = useCallback((): SelectedLocation[] => {
        if (selectedCityIds.size > 0) {
            return cities.filter(c => selectedCityIds.has(c.id)).map(c => ({ name: c.name, lat: c.lat, lng: c.lng }));
        }
        if (selectedStateId) {
            const state = states.find(s => s.id === selectedStateId);
            return state ? [{ name: state.name, lat: state.lat, lng: state.lng }] : [];
        }
        return [];
    }, [cities, states, selectedCityIds, selectedStateId]);

    const handleStart = useCallback(async () => {
        const keywords = keywordText.trim().split('\n').filter(l => l.trim()).map(l => l.trim());
        if (!keywords.length) return;
        resultsRef.current = [];
        setResults([]);

        let locations = getSelectedLocations();
        let filterState: string | undefined;

        // Ülke seçili ama il seçilmemişse → TÜM ÜLKEYİ TARA
        if (selectedCountryId && !selectedStateId && locations.length === 0) {
            try {
                const allCities: { name: string; lat: number; lng: number; stateName: string }[] =
                    await window.ipcRenderer.invoke('location:allCities', selectedCountryId);
                locations = allCities.map(c => ({ name: c.name, lat: c.lat, lng: c.lng }));
                // Tüm ülke taramasında filterState kullanma (tüm iller gelecek)
                filterState = undefined;
                console.log(`[UI] Tüm ülke tarama: ${allCities.length} lokasyon`);
            } catch (err) {
                console.error('allCities error:', err);
            }
        } else {
            // İl seçiliyse o ilin adını filtre olarak gönder
            const selectedState = selectedStateId ? states.find(s => s.id === selectedStateId) : null;
            filterState = selectedState?.name ?? undefined;
        }

        try { await window.ipcRenderer.invoke('scraper:start', { keywords, locations, fetchDetails, maxConcurrent, maxPages, filterState }); }
        catch (err: any) { console.error('Start error:', err); }
    }, [keywordText, fetchDetails, maxConcurrent, maxPages, getSelectedLocations, selectedStateId, selectedCountryId, states]);

    const handleStop = useCallback(async () => {
        try { await window.ipcRenderer.invoke('scraper:stop'); } catch { }
    }, []);

    const handleExportCSV = useCallback(() => {
        if (!results.length) return;
        const headers = ['Name', 'Address', 'Phone', 'Rating', 'Reviews', 'Category', 'Website', 'URL', 'Query'];
        const rows = results.map(p => [
            p.title, p.address ?? '', p.phone_number ?? '', p.rating_score?.toString(),
            p.review_count?.toString(), p.category ?? '', p.website ?? '', p.url ?? '', p.query ?? '',
        ]);
        const csv = [headers, ...rows].map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scraper_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [results]);

    const handleClear = useCallback(() => {
        resultsRef.current = [];
        setResults([]);
        setProgress(p => ({ ...p, status: 'idle', totalResults: 0, processedQueries: 0, message: undefined }));
    }, []);

    const handleLogout = async () => {
        try { await window.ipcRenderer.invoke('auth:logout'); onLogout(); } catch { }
    };

    const isRunning = progress.status === 'running';
    const keywords = keywordText.trim().split('\n').filter(l => l.trim());
    const locations = getSelectedLocations();
    const totalQueryCount = keywords.length * Math.max(locations.length, 1);
    const canStart = keywords.length > 0 && !isRunning;
    const progressPercent = progress.totalQueries > 0 ? Math.min(100, (progress.processedQueries / progress.totalQueries) * 100) : 0;

    const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
        idle: { color: 'var(--text-muted)', label: t.scraper.statusIdle, bg: 'transparent' },
        running: { color: 'var(--accent-primary)', label: t.scraper.statusRunning, bg: 'var(--accent-muted)' },
        completed: { color: 'var(--success)', label: t.scraper.statusCompleted, bg: 'var(--success-muted)' },
        stopped: { color: 'var(--warning)', label: t.scraper.statusStopped, bg: 'var(--warning-muted)' },
        error: { color: 'var(--error)', label: t.scraper.statusError, bg: 'var(--error-muted)' },
    };
    const status = statusConfig[progress.status] ?? statusConfig.idle;

    return (
        <div style={{ background: 'var(--surface-base)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 20px', background: 'var(--surface-100)',
                borderBottom: '1px solid var(--border-default)', flexShrink: 0,
                gap: 16,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 12px var(--accent-glow)',
                    }}>
                        <svg width="16" height="16" fill="none" stroke="#0F1117" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                    </div>
                    <div>
                        <h1 style={{ fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                            LokalBoost <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Maps Scraper</span>
                        </h1>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Enterprise Data Extraction</p>
                    </div>
                </div>

                {/* Live Stats in Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, justifyContent: 'center' }}>
                    {progress.status !== 'idle' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className={isRunning ? 'dot dot-pulse' : 'dot'} style={{ background: status.color }} />
                                <span style={{
                                    color: status.color, fontSize: 12, fontWeight: 600,
                                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                                    background: status.bg,
                                }}>{status.label}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>
                                    {progress.processedQueries.toLocaleString()}/{progress.totalQueries.toLocaleString()}
                                </span>
                                <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                    {results.length.toLocaleString()} results
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <button onClick={handleLogout} className="btn-ghost" style={{ flexShrink: 0 }}>
                    {t.main.logout}
                </button>
            </header>

            {/* Progress Bar */}
            {isRunning && (
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
            )}

            <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Panel */}
                <aside className="panel" style={{
                    width: 300, flexShrink: 0, display: 'flex',
                    flexDirection: 'column', overflow: 'auto',
                }}>
                    {/* Location */}
                    <div className="section-header">
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {t.scraper.location}
                    </div>
                    <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                            <label className="label-sm">{t.scraper.country}</label>
                            <select className="select-premium" value={selectedCountryId ?? ''} disabled={isRunning}
                                onChange={e => setSelectedCountryId(e.target.value ? parseInt(e.target.value) : null)}>
                                <option value="">{t.scraper.countryPlaceholder}</option>
                                {countries.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                            </select>
                        </div>

                        {selectedCountryId && (
                            <div className="animate-fadeIn">
                                <label className="label-sm">{t.scraper.state}</label>
                                <select className="select-premium" value={selectedStateId ?? ''} disabled={isRunning}
                                    onChange={e => setSelectedStateId(e.target.value ? parseInt(e.target.value) : null)}>
                                    <option value="">{t.scraper.statePlaceholder}</option>
                                    {states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.cityCount})</option>)}
                                </select>
                            </div>
                        )}

                        {selectedStateId && cities.length > 0 && (
                            <div className="animate-fadeIn">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label className="label-sm" style={{ margin: 0 }}>
                                        {t.scraper.city}
                                        {selectedCityIds.size > 0 && (
                                            <span className="badge badge-accent" style={{ marginLeft: 6, textTransform: 'none' }}>
                                                {selectedCityIds.size}
                                            </span>
                                        )}
                                    </label>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button onClick={() => setSelectedCityIds(new Set(cities.map(c => c.id)))}
                                            disabled={isRunning} className="btn-ghost"
                                            style={{ padding: '2px 8px', fontSize: 10 }}>{t.scraper.selectAllCities}</button>
                                        <button onClick={() => setSelectedCityIds(new Set())}
                                            disabled={isRunning} className="btn-ghost"
                                            style={{ padding: '2px 8px', fontSize: 10 }}>{t.scraper.deselectAll}</button>
                                    </div>
                                </div>
                                <div style={{
                                    maxHeight: 120, overflow: 'auto',
                                    background: 'var(--surface-300)', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-default)', padding: 4,
                                }}>
                                    {cities.map(c => (
                                        <label key={c.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 7,
                                            padding: '4px 8px', cursor: 'pointer', fontSize: 12,
                                            borderRadius: 'var(--radius-xs)',
                                            background: selectedCityIds.has(c.id) ? 'var(--accent-muted)' : 'transparent',
                                            color: selectedCityIds.has(c.id) ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            transition: 'all var(--transition-fast)',
                                        }}>
                                            <input type="checkbox" className="checkbox-premium"
                                                checked={selectedCityIds.has(c.id)} disabled={isRunning}
                                                onChange={() => {
                                                    const next = new Set(selectedCityIds);
                                                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                                                    setSelectedCityIds(next);
                                                }} />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keywords */}
                    <div className="section-header">
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197M15.803 15.803A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        {t.scraper.keywords}
                        <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                            {keywords.length}
                        </span>
                    </div>
                    <div style={{ padding: '12px 18px' }}>
                        <textarea
                            value={keywordText}
                            onChange={e => setKeywordText(e.target.value)}
                            placeholder={t.scraper.keywordPlaceholder}
                            disabled={isRunning}
                            className="input-premium"
                            style={{
                                height: 90, resize: 'vertical',
                                fontFamily: 'var(--font-data)', fontSize: 12, lineHeight: 1.8,
                            }}
                        />
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '4px 0 0' }}>{t.scraper.keywordHelp}</p>
                    </div>

                    {/* Query Count */}
                    <div style={{
                        padding: '10px 18px', borderTop: '1px solid var(--border-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'var(--surface-200)',
                    }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {keywords.length} kw × {Math.max(locations.length, 1)} loc
                        </span>
                        <span className="badge badge-accent" style={{ fontSize: 12 }}>
                            = {totalQueryCount.toLocaleString()} {t.scraper.totalQueries}
                        </span>
                    </div>

                    {/* Options */}
                    <div className="section-header">
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                        </svg>
                        {t.scraper.options}
                    </div>
                    <div style={{ padding: '12px 18px' }}>
                        <label style={{
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                            cursor: 'pointer', marginBottom: 12,
                        }}>
                            <input type="checkbox" className="checkbox-premium" style={{ marginTop: 2 }}
                                checked={fetchDetails} onChange={e => setFetchDetails(e.target.checked)} disabled={isRunning} />
                            <div>
                                <span style={{ fontSize: 12, fontWeight: 500 }}>{t.scraper.fetchDetails}</span>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{t.scraper.fetchDetailsHelp}</p>
                            </div>
                        </label>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <label className="label-sm">{t.scraper.maxPages}</label>
                                <input type="number" className="input-premium" value={maxPages}
                                    onChange={e => setMaxPages(parseInt(e.target.value) || 100)}
                                    disabled={isRunning} min={1} max={10000}
                                    style={{ fontFamily: 'var(--font-data)', fontSize: 12 }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="label-sm">{t.scraper.maxConcurrent}</label>
                                <input type="number" className="input-premium" value={maxConcurrent}
                                    onChange={e => setMaxConcurrent(parseInt(e.target.value) || 50)}
                                    disabled={isRunning} min={1} max={200}
                                    style={{ fontFamily: 'var(--font-data)', fontSize: 12 }} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: 'auto', padding: '14px 18px', borderTop: '1px solid var(--border-subtle)' }}>
                        {!isRunning ? (
                            <button onClick={handleStart} disabled={!canStart} className="btn-premium"
                                style={{ width: '100%', padding: '12px', fontSize: 13 }}>
                                ▶ {t.scraper.startButton}
                            </button>
                        ) : (
                            <button onClick={handleStop} style={{
                                width: '100%', padding: '12px',
                                background: 'var(--error-muted)', color: 'var(--error)',
                                border: '1px solid var(--error)', borderRadius: 'var(--radius-md)',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                            }}
                                onMouseEnter={e => (e.target as HTMLElement).style.background = 'rgba(248,113,113,0.2)'}
                                onMouseLeave={e => (e.target as HTMLElement).style.background = 'var(--error-muted)'}
                            >■ {t.scraper.stopButton}</button>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={handleExportCSV} disabled={!results.length} className="btn-ghost" style={{ flex: 1, fontSize: 12 }}>
                                📄 {t.scraper.exportCSV}
                            </button>
                            <button onClick={handleClear} disabled={!results.length || isRunning} className="btn-ghost" style={{ flex: 1, fontSize: 12 }}>
                                🗑 {t.scraper.clearResults}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Right Panel */}
                <section style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Stats Bar */}
                    <div style={{
                        padding: '12px 20px', background: 'var(--surface-100)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                            <div className="stat-card" style={{ minWidth: 90 }}>
                                <span className="stat-label">{t.scraper.totalResults}</span>
                                <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                                    {results.length.toLocaleString()}
                                </span>
                            </div>
                            <div className="stat-card" style={{ minWidth: 90 }}>
                                <span className="stat-label">{t.scraper.processedQueries}</span>
                                <span className="stat-value" style={{ fontSize: 14 }}>
                                    {progress.processedQueries.toLocaleString()}/{progress.totalQueries.toLocaleString()}
                                </span>
                            </div>
                            {isRunning && (
                                <div className="stat-card animate-fadeIn" style={{ minWidth: 90 }}>
                                    <span className="stat-label">Progress</span>
                                    <span className="stat-value" style={{ fontSize: 14, color: 'var(--accent-primary)' }}>
                                        {progressPercent.toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>

                        {progress.message && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                                {progress.message}
                            </span>
                        )}
                    </div>

                    {/* Table */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
                        <ResultsTable results={results} showDetails={fetchDetails} />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MainPage;
