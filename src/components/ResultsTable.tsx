import React, { useState, useMemo, useCallback } from 'react';
import type { Place } from '../types/scraper';
import { useLanguage } from '../LanguageContext';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
    results: Place[];
    showDetails: boolean;
}

type SortKey = 'title' | 'address' | 'phone_number' | 'rating_score' | 'review_count' | 'category' | 'query';
type SortDir = 'asc' | 'desc';

const ResultsTable: React.FC<ResultsTableProps> = ({ results, showDetails }) => {
    const { t } = useLanguage();

    // Filter state
    const [search, setSearch] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState<'all' | 'yes' | 'no'>('all');
    const [websiteFilter, setWebsiteFilter] = useState<'all' | 'yes' | 'no'>('all');

    // Sort state
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // Export state
    const [showExport, setShowExport] = useState(false);
    const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
    const [exportFileName, setExportFileName] = useState(`scraper_${new Date().toISOString().slice(0, 10)}`);
    const [exportColumns, setExportColumns] = useState({
        title: true, address: true, phone_number: true, rating_score: true,
        review_count: true, category: true, website: true, url: true, query: true,
    });

    // Extract unique cities from addresses
    const cities = useMemo(() => {
        const set = new Set<string>();
        results.forEach(p => {
            if (!p.address) return;
            // Try to extract city/district from address
            const parts = p.address.split(',').map(s => s.trim());
            if (parts.length >= 2) {
                set.add(parts[parts.length - 2]); // Usually city is second-to-last
            }
            if (parts.length >= 3) {
                set.add(parts[parts.length - 3]); // District
            }
        });
        return Array.from(set).sort();
    }, [results]);

    // Filtered results
    const filtered = useMemo(() => {
        let data = results;

        if (search) {
            const q = search.toLowerCase();
            data = data.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.address?.toLowerCase().includes(q) ||
                p.phone_number?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.query?.toLowerCase().includes(q)
            );
        }

        if (cityFilter) {
            data = data.filter(p => p.address?.includes(cityFilter));
        }

        if (phoneFilter === 'yes') data = data.filter(p => p.phone_number);
        else if (phoneFilter === 'no') data = data.filter(p => !p.phone_number);

        if (websiteFilter === 'yes') data = data.filter(p => p.website);
        else if (websiteFilter === 'no') data = data.filter(p => !p.website);

        return data;
    }, [results, search, cityFilter, phoneFilter, websiteFilter]);

    // Sorted results
    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            let av: any = (a as any)[sortKey];
            let bv: any = (b as any)[sortKey];
            if (typeof av === 'string') av = av?.toLowerCase() ?? '';
            if (typeof bv === 'string') bv = bv?.toLowerCase() ?? '';
            if (av == null) av = sortKey === 'rating_score' || sortKey === 'review_count' ? -1 : '';
            if (bv == null) bv = sortKey === 'rating_score' || sortKey === 'review_count' ? -1 : '';
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    // Stats
    const stats = useMemo(() => {
        const withPhone = filtered.filter(p => p.phone_number).length;
        const withWebsite = filtered.filter(p => p.website).length;
        const ratings = filtered.filter(p => p.rating_score > 0);
        const avgRating = ratings.length > 0 ? ratings.reduce((s, p) => s + p.rating_score, 0) / ratings.length : 0;
        return { withPhone, withWebsite, avgRating, total: filtered.length };
    }, [filtered]);

    const handleSort = useCallback((key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    }, [sortKey]);

    const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => {
        if (sortKey !== col) return <span style={{ opacity: 0.25, marginLeft: 4, fontSize: 10 }}>⇅</span>;
        return <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--accent-primary)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
    };

    const handleExport = useCallback((dataSet: Place[]) => {
        const cols = Object.entries(exportColumns).filter(([, v]) => v).map(([k]) => k);
        const headerMap: Record<string, string> = {
            title: 'Name', address: 'Address', phone_number: 'Phone', rating_score: 'Rating',
            review_count: 'Reviews', category: 'Category', website: 'Website', url: 'URL', query: 'Query',
        };

        let content: string | ArrayBuffer;
        let ext: string;

        if (exportFormat === 'xlsx') {
            // XLSX export via SheetJS
            const headers = cols.map(c => headerMap[c]);
            const rows = dataSet.map(p => {
                const row: Record<string, any> = {};
                cols.forEach(c => {
                    const key = headerMap[c];
                    const val = (p as any)[c];
                    row[key] = val ?? '';
                });
                return row;
            });
            const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
            ws['!cols'] = cols.map(c => ({
                wch: c === 'address' || c === 'url' ? 40 : c === 'title' || c === 'website' ? 30 : c === 'phone_number' ? 18 : 12,
            }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Results');
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportFileName}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            setShowExport(false);
            return;
        } else if (exportFormat === 'json') {
            const jsonData = dataSet.map(p => {
                const obj: Record<string, any> = {};
                cols.forEach(c => { obj[headerMap[c]] = (p as any)[c] ?? ''; });
                return obj;
            });
            content = JSON.stringify(jsonData, null, 2);
            ext = 'json';
        } else {
            const headers = cols.map(c => headerMap[c]);
            const rows = dataSet.map(p => cols.map(c => `"${String((p as any)[c] ?? '').replace(/"/g, '""')}"`).join(','));
            content = '\ufeff' + [headers.join(','), ...rows].join('\n');
            ext = 'csv';
        }

        const mimeType = ext === 'json' ? 'application/json' : 'text/csv;charset=utf-8;';
        const blob = new Blob([content as string], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportFileName}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExport(false);
    }, [exportColumns, exportFormat, exportFileName]);

    const formatRating = (score: number) => {
        if (score <= 0) return '—';
        const color = score >= 4.5 ? 'var(--success)' : score >= 3.5 ? 'var(--accent-primary)' : score >= 2.5 ? 'var(--warning)' : 'var(--error)';
        return <span style={{ color, fontWeight: 600 }}>★ {score.toFixed(1)}</span>;
    };

    const formatReviews = (count: number) => {
        if (count <= 0) return '—';
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return count.toLocaleString();
    };

    const chipStyle = (active: boolean): React.CSSProperties => ({
        padding: '3px 10px', fontSize: 11, borderRadius: 'var(--radius-md)', cursor: 'pointer',
        background: active ? 'var(--accent-muted)' : 'transparent',
        border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        transition: 'all var(--transition-fast)', whiteSpace: 'nowrap',
    });

    if (results.length === 0) {
        return (
            <div className="empty-state">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
                <p>{t.scraper.noResults}</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

            {/* ═══ TOOLBAR ═══ */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0',
                alignItems: 'center', borderBottom: '1px solid var(--border-subtle)',
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
                    <svg width="12" height="12" fill="none" stroke="var(--text-muted)" viewBox="0 0 24 24" strokeWidth={2}
                        style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        className="input-premium"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t.dataTable.searchPlaceholder}
                        style={{ paddingLeft: 28, fontSize: 11, height: 28 }}
                    />
                </div>

                {/* City Filter */}
                <select
                    className="input-premium"
                    value={cityFilter}
                    onChange={e => setCityFilter(e.target.value)}
                    style={{ fontSize: 11, height: 28, width: 'auto', minWidth: 100, padding: '0 8px' }}
                >
                    <option value="">{t.dataTable.allCities}</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Phone toggle */}
                <div style={{ display: 'flex', gap: 2 }}>
                    <span style={chipStyle(phoneFilter === 'yes')} onClick={() => setPhoneFilter(f => f === 'yes' ? 'all' : 'yes')}>
                        📞 {t.dataTable.hasPhone}
                    </span>
                </div>

                {/* Website toggle */}
                <div style={{ display: 'flex', gap: 2 }}>
                    <span style={chipStyle(websiteFilter === 'yes')} onClick={() => setWebsiteFilter(f => f === 'yes' ? 'all' : 'yes')}>
                        🌐 {t.dataTable.hasWebsite}
                    </span>
                </div>

                {/* Export button */}
                <button className="btn-premium" onClick={() => setShowExport(true)} style={{ padding: '3px 12px', fontSize: 11 }}>
                    📥 {t.dataTable.exportButton}
                </button>
            </div>

            {/* ═══ STATS BAR ═══ */}
            <div style={{
                display: 'flex', gap: 16, padding: '6px 0', fontSize: 11,
                color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)',
            }}>
                <span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stats.total}</strong> {t.dataTable.showingOf} {results.length} {t.scraper.totalResults.toLowerCase()}
                </span>
                {stats.avgRating > 0 && (
                    <span>★ {t.dataTable.avgRating}: <strong style={{ color: 'var(--accent-primary)' }}>{stats.avgRating.toFixed(1)}</strong></span>
                )}
                <span>📞 {t.dataTable.withPhone}: <strong>{stats.withPhone}</strong> ({stats.total > 0 ? Math.round(stats.withPhone / stats.total * 100) : 0}%)</span>
                <span>🌐 {t.dataTable.withWebsite}: <strong>{stats.withWebsite}</strong> ({stats.total > 0 ? Math.round(stats.withWebsite / stats.total * 100) : 0}%)</span>
            </div>

            {/* ═══ TABLE ═══ */}
            <div style={{ overflow: 'auto', flex: 1, borderRadius: 'var(--radius-lg)' }}>
                <table className="table-premium">
                    <thead>
                        <tr>
                            <th style={{ width: 44 }}>#</th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
                                {t.scraper.columnName}<SortIcon col="title" />
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('address')}>
                                {t.scraper.columnAddress}<SortIcon col="address" />
                            </th>
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('phone_number')}>
                                {t.scraper.columnPhone}<SortIcon col="phone_number" />
                            </th>
                            <th style={{ width: 70, cursor: 'pointer' }} onClick={() => handleSort('rating_score')}>
                                {t.scraper.columnRating}<SortIcon col="rating_score" />
                            </th>
                            <th style={{ width: 75, cursor: 'pointer' }} onClick={() => handleSort('review_count')}>
                                {t.scraper.columnReviews}<SortIcon col="review_count" />
                            </th>
                            {showDetails && (
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('category')}>
                                    {t.scraper.columnCategory}<SortIcon col="category" />
                                </th>
                            )}
                            {showDetails && <th>{t.scraper.columnWebsite}</th>}
                            <th style={{ cursor: 'pointer' }} onClick={() => handleSort('query')}>
                                {t.scraper.columnQuery}<SortIcon col="query" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((place, idx) => (
                            <tr key={`${place.feature_id ?? idx}-${idx}`}>
                                <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: 11 }}>
                                    {idx + 1}
                                </td>
                                <td style={{ fontWeight: 500 }}>
                                    {place.url ? (
                                        <a href={place.url} target="_blank" rel="noreferrer"
                                            style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}
                                            title={place.url}
                                        >{place.title}</a>
                                    ) : place.title}
                                </td>
                                <td title={place.address ?? ''}>{place.address ?? '—'}</td>
                                <td style={{ fontFamily: 'var(--font-data)', fontSize: 12, letterSpacing: '0.02em' }}>
                                    {place.phone_number ?? '—'}
                                </td>
                                <td style={{ fontFamily: 'var(--font-data)', fontSize: 12 }}>
                                    {formatRating(place.rating_score)}
                                </td>
                                <td style={{ fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {formatReviews(place.review_count)}
                                </td>
                                {showDetails && (
                                    <td>
                                        {place.category ? (
                                            <span className="badge badge-info">{place.category}</span>
                                        ) : '—'}
                                    </td>
                                )}
                                {showDetails && (
                                    <td>
                                        {place.website ? (
                                            <a href={place.website} target="_blank" rel="noreferrer"
                                                style={{ color: 'var(--info)', textDecoration: 'none', fontSize: 12 }}>
                                                {(() => { try { return new URL(place.website).hostname; } catch { return place.website; } })()}
                                            </a>
                                        ) : '—'}
                                    </td>
                                )}
                                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{place.query ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ═══ EXPORT DIALOG ═══ */}
            {showExport && (
                <>
                    <div className="animate-fadeIn" onClick={() => setShowExport(false)} style={{
                        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    }} />
                    <div className="animate-fadeIn" style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        zIndex: 201, background: 'var(--surface-100)', border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-xl, 12px)', padding: 24, width: 400,
                        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                    }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>{t.dataTable.exportTitle}</h3>

                        {/* Format */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t.dataTable.exportFormat}</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {(['xlsx', 'csv', 'json'] as const).map(fmt => (
                                    <span key={fmt} style={chipStyle(exportFormat === fmt)} onClick={() => setExportFormat(fmt)}>
                                        {fmt.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* File name */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t.dataTable.exportFileName}</label>
                            <input className="input-premium" value={exportFileName} onChange={e => setExportFileName(e.target.value)}
                                style={{ fontSize: 12, fontFamily: 'var(--font-data)' }} />
                        </div>

                        {/* Columns */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{t.dataTable.exportColumns}</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {Object.entries(exportColumns).map(([key, val]) => {
                                    const labelMap: Record<string, string> = {
                                        title: t.scraper.columnName, address: t.scraper.columnAddress,
                                        phone_number: t.scraper.columnPhone, rating_score: t.scraper.columnRating,
                                        review_count: t.scraper.columnReviews, category: t.scraper.columnCategory,
                                        website: t.scraper.columnWebsite, url: 'URL', query: t.scraper.columnQuery,
                                    };
                                    return (
                                        <span key={key} style={chipStyle(val)}
                                            onClick={() => setExportColumns(c => ({ ...c, [key]: !c[key as keyof typeof c] }))}>
                                            {labelMap[key] || key}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => setShowExport(false)} style={{ fontSize: 12 }}>
                                {t.dataTable.cancel}
                            </button>
                            <button className="btn-premium" onClick={() => handleExport(sorted)}
                                style={{ fontSize: 12, padding: '6px 16px' }}>
                                📥 {t.dataTable.exportFiltered} ({sorted.length})
                            </button>
                            <button className="btn-ghost" onClick={() => handleExport(results)}
                                style={{ fontSize: 12, borderColor: 'var(--accent-primary)' }}>
                                {t.dataTable.exportAll} ({results.length})
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ResultsTable;
