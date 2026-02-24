import React from 'react';
import type { Place } from '../types/scraper';
import { useLanguage } from '../LanguageContext';

interface ResultsTableProps {
    results: Place[];
    showDetails: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, showDetails }) => {
    const { t } = useLanguage();

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

    return (
        <div style={{ overflow: 'auto', height: '100%', borderRadius: 'var(--radius-lg)' }}>
            <table className="table-premium">
                <thead>
                    <tr>
                        <th style={{ width: 44 }}>#</th>
                        <th>{t.scraper.columnName}</th>
                        <th>{t.scraper.columnAddress}</th>
                        <th>{t.scraper.columnPhone}</th>
                        <th style={{ width: 70 }}>{t.scraper.columnRating}</th>
                        <th style={{ width: 75 }}>{t.scraper.columnReviews}</th>
                        {showDetails && <th>{t.scraper.columnCategory}</th>}
                        {showDetails && <th>{t.scraper.columnWebsite}</th>}
                        <th>{t.scraper.columnQuery}</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((place, idx) => (
                        <tr key={`${place.feature_id ?? idx}-${idx}`} style={{ animation: `fadeIn 0.2s ease-out ${Math.min(idx * 0.02, 0.5)}s both` }}>
                            <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-data)', fontSize: 11 }}>
                                {idx + 1}
                            </td>
                            <td style={{ fontWeight: 500 }}>
                                {place.url ? (
                                    <a href={place.url} target="_blank" rel="noreferrer"
                                        style={{
                                            color: 'var(--accent-primary)', textDecoration: 'none',
                                            transition: 'color var(--transition-fast)',
                                        }}
                                        onMouseEnter={e => (e.target as HTMLElement).style.color = 'var(--accent-hover)'}
                                        onMouseLeave={e => (e.target as HTMLElement).style.color = 'var(--accent-primary)'}
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
    );
};

export default ResultsTable;
