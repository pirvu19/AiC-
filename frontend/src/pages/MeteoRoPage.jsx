import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wind, Thermometer, Droplets, Eye, Cloud, Snowflake, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

// ─── Mapare iconiță + culoare accent în funcție de fenomenul meteo ───────────
const getPhenomenonStyle = (fenomen) => {
    const f = (fenomen || '').toLowerCase();
    if (f.includes('ninsoare') || f.includes('lapovita') || f.includes('lapoviță'))
        return { icon: '🌨️', color: '#93c5fd', label: fenomen };
    if (f.includes('aversa ploaie') || f.includes('aversă ploaie') || f.includes('ploaie'))
        return { icon: '🌧️', color: '#60a5fa', label: fenomen };
    if (f.includes('ceata') || f.includes('ceață'))
        return { icon: '🌫️', color: '#94a3b8', label: fenomen };
    if (f.includes('senin') || f.includes('cer senin'))
        return { icon: '☀️', color: '#fbbf24', label: fenomen };
    if (f.includes('noros') || f.includes('acoperit'))
        return { icon: '☁️', color: '#94a3b8', label: fenomen };
    if (f.includes('partial'))
        return { icon: '⛅', color: '#fbbf24', label: fenomen };
    if (f.includes('furtuna') || f.includes('furtună') || f.includes('descarcari') || f.includes('descărcări'))
        return { icon: '⛈️', color: '#f87171', label: fenomen };
    return { icon: '🌤️', color: '#3b82f6', label: fenomen || 'N/A' };
};

// ─── Badge temperatură colorat ───────────────────────────────────────────────
const getTempStyle = (temp) => {
    const t = parseFloat(temp);
    if (isNaN(t)) return { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
    if (t <= 0)   return { color: '#93c5fd', bg: 'rgba(147,197,253,0.15)' };
    if (t <= 10)  return { color: '#67e8f9', bg: 'rgba(103,232,249,0.12)' };
    if (t <= 20)  return { color: '#86efac', bg: 'rgba(134,239,172,0.12)' };
    return           { color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' };
};

// ─── Rând info în card ────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, color, isLight }) => {
    if (!value || value === 'indisponibil' || value === 'N/A') return null;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.45rem 0.6rem', borderRadius: '0.6rem',
            background: isLight ? 'rgba(239,246,255,0.5)' : 'rgba(255,255,255,0.03)',
            border: isLight ? '1px solid rgba(37,99,235,0.08)' : '1px solid rgba(255,255,255,0.06)',
        }}>
            <Icon size={13} style={{ color: color || '#64748b', flexShrink: 0 }} />
            <span style={{ fontSize: '0.7rem', color: '#64748b', minWidth: '60px' }}>{label}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isLight ? '#0f172a' : 'white' }}>{value}</span>
        </div>
    );
};

// ─── Card stație ─────────────────────────────────────────────────────────────
const StationCard = ({ station, isLight }) => {
    const props = station.properties;
    const phStyle = getPhenomenonStyle(props.fenomen_e);
    const tempStyle = getTempStyle(props.tempe);

    return (
        <div style={{
            background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(20px)',
            border: isLight ? `1px solid ${phStyle.color}22` : `1px solid ${phStyle.color}28`,
            borderRadius: '1.5rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isLight ? '0 4px 20px rgba(37,99,235,0.06)' : 'none',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = `${phStyle.color}55`;
                e.currentTarget.style.boxShadow = isLight
                    ? `0 20px 40px -10px ${phStyle.color}30, 0 0 0 1px ${phStyle.color}18`
                    : `0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px ${phStyle.color}22`;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${phStyle.color}28`;
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Glow de fundal subtil */}
            <div style={{
                position: 'absolute', top: '-40px', right: '-40px',
                width: '120px', height: '120px',
                background: `radial-gradient(circle, ${phStyle.color}18 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* Header: nume stație + icoana fenomen */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: isLight ? '#0f172a' : 'white', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                        {props.nume}
                    </h3>
                    <span style={{
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em', color: phStyle.color,
                        background: `${phStyle.color}18`, padding: '0.15rem 0.55rem',
                        borderRadius: '999px', border: `1px solid ${phStyle.color}30`,
                    }}>
                        {phStyle.label !== 'N/A' ? phStyle.label : 'Date disponibile'}
                    </span>
                </div>
                <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{phStyle.icon}</div>
            </div>

            {/* Temperatura — element principal */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                background: tempStyle.bg, padding: '0.6rem 1rem',
                borderRadius: '0.8rem', alignSelf: 'flex-start',
            }}>
                <Thermometer size={18} style={{ color: tempStyle.color }} />
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: tempStyle.color, lineHeight: 1 }}>
                    {props.tempe}°C
                </span>
            </div>

            {/* Rânduri detalii */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <InfoRow icon={Wind}       label="Vânt"        value={props.vant}         color="#60a5fa" isLight={isLight} />
                <InfoRow icon={Droplets}   label="Umiditate"   value={props.umezeala ? `${props.umezeala}%` : null} color="#22d3ee" isLight={isLight} />
                <InfoRow icon={Eye}        label="Presiune"    value={props.presiunetext}  color="#a78bfa" isLight={isLight} />
                <InfoRow icon={Cloud}      label="Nebuloz."    value={props.nebulozitate}  color="#94a3b8" isLight={isLight} />
                <InfoRow icon={Snowflake}  label="Zăpadă"      value={props.zapada}        color="#bfdbfe" isLight={isLight} />
            </div>

            {/* Timestamp */}
            <div style={{
                marginTop: 'auto', paddingTop: '0.75rem',
                borderTop: isLight ? '1px solid rgba(37,99,235,0.08)' : '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
                <div style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 6px #22c55e',
                    animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: '0.68rem', color: '#475569' }}>
                    Actualizat: <b style={{ color: '#64748b' }}>{props.actualizat}</b>
                </span>
            </div>
        </div>
    );
};

// ─── Pagina principală ────────────────────────────────────────────────────────
const MeteoRoPage = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const [roData, setRoData] = useState(null);
    const [roLoading, setRoLoading] = useState(false);
    const [lastFetch, setLastFetch] = useState(null);
    const [error, setError] = useState(null);

    const fetchMeteoRo = useCallback(async () => {
        setRoLoading(true);
        setError(null);
        try {
            const response = await api.get('/meteo/ro');
            setRoData(response.data);
            setLastFetch(new Date());
        } catch (err) {
            console.error('Eroare:', err);
            setError('Nu s-au putut încărca datele Meteo RO. Verificați conexiunea.');
        } finally {
            setRoLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeteoRo();
    }, [fetchMeteoRo]);

    const formatLastFetch = () => {
        if (!lastFetch) return null;
        return lastFetch.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-8">
            {/* Header */}
            <header style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: isLight ? '#0f172a' : 'white', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
                            Meteo RO
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                            Condiții meteorologice live la stațiile montane
                            {lastFetch && (
                                <span style={{ color: '#475569', fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                                    · Ultima actualizare: <b style={{ color: '#64748b' }}>{formatLastFetch()}</b>
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Buton Actualizează */}
                    <button
                        onClick={fetchMeteoRo}
                        disabled={roLoading}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: roLoading ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            color: roLoading ? '#64748b' : '#3b82f6',
                            padding: '0.65rem 1.4rem', borderRadius: '0.75rem',
                            fontWeight: 700, fontSize: '0.85rem',
                            cursor: roLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { if (!roLoading) { e.currentTarget.style.background = 'rgba(59,130,246,0.25)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)'; } }}
                        onMouseLeave={e => { e.currentTarget.style.background = roLoading ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
                    >
                        <RefreshCw size={15} style={{ animation: roLoading ? 'spin 1s linear infinite' : 'none' }} />
                        {roLoading ? 'Se actualizează...' : 'Actualizează'}
                    </button>
                </div>

                {/* Banner info stații */}
                <div style={{
                    marginTop: '1rem', padding: '0.6rem 1rem',
                    background: 'rgba(59,130,246,0.07)', borderRadius: '0.75rem',
                    border: '1px solid rgba(59,130,246,0.12)',
                    fontSize: '0.75rem', color: '#64748b',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    <span style={{ color: '#3b82f6', fontWeight: 700 }}>ℹ</span>
                    Date preluate în timp real de pe <b style={{ color: '#93c5fd' }}>meteoromania.ro</b> pentru stațiile montane: Bâlea Lac, Parâng, Rânca, Vlădeasa 1800, Băișoara.
                </div>
            </header>

            {/* Conținut */}
            <div className="animate-in fade-in zoom-in-95">
                {roLoading && !roData ? (
                    /* Loading initial */
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1.5rem' }}>
                        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                border: '3px solid rgba(59,130,246,0.15)',
                            }} />
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                border: '3px solid transparent', borderTopColor: '#3b82f6',
                                animation: 'spin 1s linear infinite',
                            }} />
                        </div>
                        <p style={{ color: '#64748b', fontWeight: 500 }}>Se preiau datele de pe Meteo România...</p>
                    </div>
                ) : error ? (
                    /* Eroare */
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                        padding: '4rem 2rem', textAlign: 'center',
                        background: 'rgba(239,68,68,0.05)', borderRadius: '1.5rem',
                        border: '1px solid rgba(239,68,68,0.15)',
                    }}>
                        <AlertCircle size={40} style={{ color: '#ef4444' }} />
                        <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
                        <button onClick={fetchMeteoRo} style={{
                            padding: '0.6rem 1.5rem', borderRadius: '0.75rem',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', fontWeight: 700, cursor: 'pointer',
                        }}>
                            Încearcă din nou
                        </button>
                    </div>
                ) : roData && roData.length > 0 ? (
                    /* Grid carduri */
                    <>
                        {roLoading && (
                            <div style={{
                                marginBottom: '1rem', padding: '0.5rem 1rem', borderRadius: '0.75rem',
                                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                                fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
                                Se actualizează datele...
                            </div>
                        )}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1.25rem',
                        }}>
                            {roData.map((station, idx) => (
                                <StationCard key={idx} station={station} isLight={isLight} />
                            ))}
                        </div>
                    </>
                ) : (
                    /* No data */
                    <div style={{
                        textAlign: 'center', padding: '5rem 2rem',
                        background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Nu există date disponibile</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Apăsați „Actualizează" pentru a prelua datele.</p>
                        <button onClick={fetchMeteoRo} style={{
                            padding: '0.7rem 1.8rem', borderRadius: '0.75rem',
                            background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', border: 'none',
                        }}>
                            Actualizează
                        </button>
                    </div>
                )}
            </div>

            {/* CSS spin keyframe inline */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default MeteoRoPage;
