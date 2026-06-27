import { useState, useEffect } from 'react';
import { Cloud, Calendar, ChevronLeft, FileText, AlertTriangle, Snowflake, Sun, Flower2, Mountain, ThermometerSnowflake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MONTHS_CONFIG = {
    3: { name: 'Martie', icon: <Snowflake size={28} />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', accent: '#667eea', bg: 'rgba(102,126,234,0.08)', border: 'rgba(102,126,234,0.25)', desc: 'Sezon de iarnă târzie', emoji: '❄️' },
    4: { name: 'Aprilie', icon: <Flower2 size={28} />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', accent: '#f5576c', bg: 'rgba(245,87,108,0.08)', border: 'rgba(245,87,108,0.25)', desc: 'Tranziție primăvară', emoji: '🌸' },
    5: { name: 'Mai', icon: <Sun size={28} />, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', accent: '#43e97b', bg: 'rgba(67,233,123,0.08)', border: 'rgba(67,233,123,0.25)', desc: 'Sfârșit de sezon', emoji: '☀️' },
};

const RISK_COLORS = { 1: '#2ECC71', 2: '#F1C40F', 3: '#E67E22', 4: '#E74C3C', 5: '#8B0000' };

const RapoarteRiscuriPage = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [meteoError, setMeteoError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [meteoHtml, setMeteoHtml] = useState(null);
    const [reports, setReports] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [openReport, setOpenReport] = useState(null);

    useEffect(() => {
        fetch('/api/meteo')
            .then(r => { if (!r.ok) throw new Error(); return r.text(); })
            .then(html => {
                if (html.includes('Eroare') || html.includes('Nu s-a putut') || html.includes('pozitive°C') || html.includes('pozitive\u00b0C')) setMeteoError(true);
                else setMeteoHtml(html);
            })
            .catch(() => setMeteoError(true))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetch('/api/meteo/history')
            .then(r => r.json())
            .then(data => {
                const parsed = data.map(entry => {
                    const m = entry.perioada.match(/(\d{2})\.(\d{2})\.(\d{4})/);
                    const month = m ? parseInt(m[2]) : 0;
                    const sortKey = m ? `${m[3]}-${m[2]}-${m[1]}` : '0000';
                    return { ...entry, month, sortKey };
                }).filter(e => MONTHS_CONFIG[e.month]);
                parsed.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
                setReports(parsed);
            })
            .catch(() => setReports([]));
    }, []);

    const reportsByMonth = {};
    reports.forEach(r => { if (!reportsByMonth[r.month]) reportsByMonth[r.month] = []; reportsByMonth[r.month].push(r); });
    const availableMonths = Object.keys(reportsByMonth).map(Number).filter(m => MONTHS_CONFIG[m]).sort((a, b) => a - b);

    const maxRisk = (entry) => {
        let max = 0;
        (entry.grupe_montane || []).forEach(g => g.masive.forEach(m => { max = Math.max(max, m.risc_peste_1800, m.risc_sub_1800); }));
        return max;
    };

    /* ─── Raport deschis inline ──────────────────────────────────────── */
    if (openReport) {
        const cfg = MONTHS_CONFIG[openReport.month] || {};
        return (
            <div style={{ animation: 'rrFadeIn 0.4s ease' }}>
                <button onClick={() => setOpenReport(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: isLight ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.05)', border: isLight ? '1px solid rgba(37,99,235,0.12)' : '1px solid rgba(255,255,255,0.1)', color: isLight ? '#475569' : '#94a3b8', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = isLight ? '#1e40af' : '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isLight ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = isLight ? '#475569' : '#94a3b8'; }}>
                    <ChevronLeft size={18} /> Înapoi la {cfg.name || 'rapoarte'}
                </button>

                <div style={{ background: cfg.gradient, borderRadius: '1.25rem', padding: '1.5rem 2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 700, border: 'none', padding: 0 }}>
                        📋 Buletin Nivometeorologic
                    </h2>
                    <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>{openReport.perioada}</p>
                </div>

                {/* Temperaturi */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[['peste_1800m', '🏔️ Peste 1800m'], ['sub_1800m', '🌲 Sub 1800m']].map(([key, label]) => (
                        <div key={key} style={{ background: isLight ? 'rgba(239,246,255,0.6)' : 'rgba(255,255,255,0.03)', border: isLight ? '1px solid rgba(37,99,235,0.12)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1.2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', marginBottom: '0.5rem', fontWeight: 600 }}>{label}</div>
                            <div style={{ color: isLight ? '#0f172a' : '#e2e8f0', fontSize: '0.9rem' }}>Min: {openReport.temperaturi?.[key]?.min || 'N/A'}</div>
                            <div style={{ color: isLight ? '#0f172a' : '#e2e8f0', fontSize: '0.9rem' }}>Max: {openReport.temperaturi?.[key]?.max || 'N/A'}</div>
                        </div>
                    ))}
                </div>

                {/* Strat zăpadă */}
                {openReport.statistici_zapada && (
                    <div style={{ background: isLight ? 'rgba(239,246,255,0.6)' : 'rgba(255,255,255,0.03)', border: isLight ? '1px solid rgba(37,99,235,0.12)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem', padding: '1.2rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.75rem', color: isLight ? '#0f172a' : '#e2e8f0', fontSize: '1rem' }}>❄️ Strat de zăpadă</h3>
                        {Object.entries(openReport.statistici_zapada).map(([zone, info]) => (
                            <div key={zone} style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600, color: isLight ? '#334155' : '#94a3b8' }}>{zone}: </span>
                                <span style={{ color: isLight ? '#475569' : '#cbd5e1', fontSize: '0.85rem' }}>{info}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grade risc pe masive */}
                {(openReport.grupe_montane || []).map((grupa, gi) => (
                    <div key={gi} style={{ marginBottom: '1.25rem' }}>
                        <div style={{ background: isLight ? 'rgba(37,99,235,0.08)' : '#1e293b', color: isLight ? '#1e40af' : '#e2e8f0', padding: '0.6rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {grupa.nume_grupa}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                            {grupa.masive.map((masiv, mi) => {
                                const rMax = Math.max(masiv.risc_peste_1800, masiv.risc_sub_1800);
                                return (
                                    <div key={mi} style={{ background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.03)', border: isLight ? `1px solid rgba(37,99,235,0.1)` : '1px solid rgba(255,255,255,0.08)', borderLeft: `4px solid ${RISK_COLORS[rMax] || '#666'}`, borderRadius: '0.75rem', padding: '1rem' }}>
                                        <div style={{ fontWeight: 700, color: isLight ? '#0f172a' : '#e2e8f0', marginBottom: '0.5rem' }}>{masiv.nume_complet}</div>
                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                            {[['> 1800m', masiv.risc_peste_1800], ['< 1800m', masiv.risc_sub_1800]].map(([alt, risk]) => (
                                                <div key={alt} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.75rem', color: isLight ? '#475569' : '#94a3b8' }}>{alt}:</span>
                                                    <span style={{ background: RISK_COLORS[risk] || '#666', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '0.3rem', fontWeight: 700, fontSize: '0.8rem' }}>Grad {risk}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <style>{`@keyframes rrFadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
            </div>
        );
    }

    /* ─── Lista rapoarte dintr-o lună ────────────────────────────────── */
    if (selectedMonth !== null) {
        const cfg = MONTHS_CONFIG[selectedMonth];
        const monthReports = reportsByMonth[selectedMonth] || [];
        return (
            <div style={{ animation: 'rrFadeIn 0.4s ease' }}>
                <button onClick={() => setSelectedMonth(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: isLight ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.05)', border: isLight ? '1px solid rgba(37,99,235,0.12)' : '1px solid rgba(255,255,255,0.1)', color: isLight ? '#475569' : '#94a3b8', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.5rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = isLight ? '#1e40af' : '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isLight ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = isLight ? '#475569' : '#94a3b8'; }}>
                    <ChevronLeft size={18} /> Înapoi la luni
                </button>

                <div style={{ background: cfg.gradient, borderRadius: '1.25rem', padding: '2rem 2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: `0 8px 32px ${cfg.accent}33` }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '1rem', padding: '0.75rem', display: 'flex', color: '#fff' }}>{cfg.icon}</div>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 700, border: 'none', padding: 0 }}>{cfg.emoji} Rapoarte {cfg.name}</h2>
                        <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{monthReports.length} buletin{monthReports.length !== 1 ? 'e' : ''} disponibil{monthReports.length !== 1 ? 'e' : ''}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {monthReports.map((report, idx) => {
                        const risk = maxRisk(report);
                        return (
                            <button key={idx} onClick={() => setOpenReport(report)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: isLight ? 'rgba(255,255,255,0.85)' : cfg.bg, border: isLight ? `1px solid ${cfg.border}` : `1px solid ${cfg.border}`, borderRadius: '1rem', padding: '1.1rem 1.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.25s ease', animation: `rrFadeIn 0.4s ease ${idx * 0.06}s both`, boxShadow: isLight ? '0 2px 12px rgba(37,99,235,0.06)' : 'none' }}
                                onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.98)' : `${cfg.accent}22`; e.currentTarget.style.borderColor = cfg.accent; e.currentTarget.style.transform = 'translateX(6px)'; e.currentTarget.style.boxShadow = isLight ? `0 8px 24px ${cfg.accent}20` : 'none'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = isLight ? 'rgba(255,255,255,0.85)' : cfg.bg; e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = isLight ? '0 2px 12px rgba(37,99,235,0.06)' : 'none'; }}>
                                <div style={{ background: cfg.gradient, borderRadius: '0.75rem', padding: '0.6rem', display: 'flex', flexShrink: 0 }}>
                                    <FileText size={20} style={{ color: '#fff' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isLight ? '#0f172a' : '#e2e8f0' }}>Buletin Nivometeorologic</div>
                                    <div style={{ fontSize: '0.8rem', color: isLight ? '#475569' : '#94a3b8', marginTop: '2px' }}>{report.perioada}</div>
                                </div>
                                {risk > 0 && (
                                    <div style={{ background: RISK_COLORS[risk], color: '#fff', padding: '0.25rem 0.6rem', borderRadius: '0.4rem', fontWeight: 700, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                        Max: Grad {risk}
                                    </div>
                                )}
                                <div style={{ color: cfg.accent, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>Deschide →</div>
                            </button>
                        );
                    })}
                </div>
                <style>{`@keyframes rrFadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
            </div>
        );
    }

    /* ─── Pagina principală ──────────────────────────────────────────── */
    const renderMonthCards = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {availableMonths.map((month, idx) => {
                const cfg = MONTHS_CONFIG[month];
                const count = reportsByMonth[month]?.length || 0;
                return (
                    <button key={month} onClick={() => setSelectedMonth(month)} style={{ position: 'relative', overflow: 'hidden', background: isLight ? 'rgba(255,255,255,0.88)' : '#0f172a', border: `1px solid ${cfg.border}`, borderRadius: '1.25rem', padding: '2rem 1.5rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s ease', animation: `rrFadeIn 0.5s ease ${idx * 0.1}s both`, boxShadow: isLight ? '0 4px 20px rgba(37,99,235,0.08)' : 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.accent; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 40px ${cfg.accent}25`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isLight ? '0 4px 20px rgba(37,99,235,0.08)' : 'none'; }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: cfg.gradient }} />
                        <div style={{ background: cfg.gradient, borderRadius: '1rem', padding: '0.75rem', display: 'inline-flex', color: '#fff', marginBottom: '1rem', boxShadow: `0 4px 16px ${cfg.accent}30` }}>{cfg.icon}</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: isLight ? '#0f172a' : '#e2e8f0', marginBottom: '0.25rem' }}>{cfg.emoji} {cfg.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>{cfg.desc}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: cfg.bg, border: `1px solid ${cfg.border}`, padding: '0.35rem 0.8rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600, color: cfg.accent }}>
                            <FileText size={14} /> {count} raport{count !== 1 ? 'e' : ''}
                        </div>
                    </button>
                );
            })}
        </div>
    );

    return (
        <div style={{ animation: 'rrFadeIn 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(99,102,241,0.1)', borderRadius: '1rem', padding: '0.75rem', marginBottom: '1rem' }}>
                    <Cloud size={32} style={{ color: 'var(--primary)' }} />
                </div>
                <h1 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.75rem', fontWeight: 700, color: isLight ? '#0f172a' : '#e2e8f0' }}>Risc Avalanșe</h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Buletine nivometeorologice pentru Carpații Românești</p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <div style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'rrSpin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                    <p style={{ color: '#64748b' }}>Se verifică datele live...</p>
                </div>
            ) : meteoError ? (
                <div>
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1rem', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: '0.75rem', padding: '0.6rem', flexShrink: 0 }}>
                            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: isLight ? '#991b1b' : '#fca5a5', fontSize: '1rem' }}>Informații indisponibile</div>
                            <div style={{ color: isLight ? '#475569' : '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>Buletinul live nu poate fi accesat momentan. Consultă rapoartele salvate mai jos.</div>
                        </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ color: isLight ? '#0f172a' : '#e2e8f0', fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.3rem', border: 'none', padding: 0 }}>
                            <Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary)' }} />
                            Rapoarte disponibile pe luni
                        </h2>
                        <p style={{ color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Selectează o lună pentru a vedea buletinele nivometeorologice</p>
                    </div>
                    {renderMonthCards()}
                </div>
            ) : (
                <div>
                    <div style={{ borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginBottom: '2.5rem' }} dangerouslySetInnerHTML={{ __html: meteoHtml }} />
                    {availableMonths.length > 0 && (
                        <div>
                            <h2 style={{ color: isLight ? '#0f172a' : '#e2e8f0', fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.3rem', border: 'none', padding: 0 }}>
                                <Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary)' }} /> Arhivă rapoarte
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Consultă buletinele nivometeorologice anterioare</p>
                            {renderMonthCards()}
                        </div>
                    )}
                </div>
            )}
            <style>{`
                @keyframes rrFadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
                @keyframes rrSpin { to { transform:rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default RapoarteRiscuriPage;
