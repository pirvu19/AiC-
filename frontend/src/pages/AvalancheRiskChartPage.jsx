import { useState, useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ─── Culori pentru gradele de risc ───────────────────────────────────────────
const RISK_COLORS = {
    1: '#22c55e',
    2: '#eab308',
    3: '#f97316',
    4: '#ef4444',
    5: '#7c3aed',
};

const RISK_LABELS = {
    1: 'Redus',
    2: 'Limitat',
    3: 'Considerabil',
    4: 'Ridicat',
    5: 'Foarte ridicat',
};

// ─── Parsare dată din string de tip "13.04.2026 ora 21 - 15.04.2026 ora 21" ──
const parseStartDate = (perioada) => {
    const match = perioada?.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!match) return null;
    return new Date(`${match[3]}-${match[2]}-${match[1]}`);
};

const formatLabel = (perioada) => {
    const match = perioada?.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!match) return perioada;
    return `${match[1]}.${match[2]}`;
};

// ─── Extrage toate masivele unice din istoric ─────────────────────────────────
const extractMasive = (data) => {
    const set = new Set();
    data.forEach(entry => {
        (entry.grupe_montane || []).forEach(grupa => {
            (grupa.masive || []).forEach(m => {
                if (m.nume_complet) set.add(m.nume_complet);
            });
        });
    });
    return Array.from(set).sort();
};

// ─── Extrage riscul unui masiv pentru fiecare perioadă ───────────────────────
const extractRiskSeries = (data, masiv, altitudine) => {
    return data.map(entry => {
        let risk = null;
        (entry.grupe_montane || []).forEach(grupa => {
            (grupa.masive || []).forEach(m => {
                if (m.nume_complet === masiv) {
                    const val = altitudine === 'peste'
                        ? parseInt(m.risc_peste_1800)
                        : parseInt(m.risc_sub_1800);
                    if (!isNaN(val) && val > 0) risk = val;
                }
            });
        });
        return risk;
    });
};

// ─── Componentă card statistică ───────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
    <div style={{
        background: 'rgba(15,23,42,0.5)', border: `1px solid ${color}30`,
        borderRadius: '1rem', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
        <div style={{
            width: '36px', height: '36px', borderRadius: '0.6rem',
            background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', flexShrink: 0,
        }}>{icon}</div>
        <div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color, lineHeight: 1.2 }}>{value}</div>
        </div>
    </div>
);

// ─── Pagina principală ────────────────────────────────────────────────────────
const AvalancheRiskChartPage = () => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [masive, setMasive] = useState([]);
    const [selectedMasiv, setSelectedMasiv] = useState('');
    const [altitudine, setAltitudine] = useState('peste'); // 'peste' | 'sub'

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/meteo/history');
            const raw = typeof response.data === 'string'
                ? JSON.parse(response.data)
                : response.data;

            // Sortăm cronologic după data de start
            const sorted = [...raw].sort((a, b) => {
                const da = parseStartDate(a.perioada);
                const db = parseStartDate(b.perioada);
                return (da || 0) - (db || 0);
            });

            setHistoryData(sorted);
            const masiveList = extractMasive(sorted);
            setMasive(masiveList);
            if (masiveList.length > 0) setSelectedMasiv(masiveList[0]);
        } catch (err) {
            console.error(err);
            setError('Nu s-au putut încărca datele istorice.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    // ─── Date pentru grafic ───────────────────────────────────────────────────
    const labels = historyData.map(e => formatLabel(e.perioada));
    const riskValues = selectedMasiv ? extractRiskSeries(historyData, selectedMasiv, altitudine) : [];

    // Statistici rapide
    const validValues = riskValues.filter(v => v !== null);
    const avgRisk = validValues.length ? (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1) : 'N/A';
    const maxRisk = validValues.length ? Math.max(...validValues) : null;
    const minRisk = validValues.length ? Math.min(...validValues) : null;
    const lastRisk = validValues.length ? validValues[validValues.length - 1] : null;

    // Culoarea gradientului bazată pe riscul mediu
    const avgColor = maxRisk ? RISK_COLORS[maxRisk] || '#3b82f6' : '#3b82f6';

    const chartData = {
        labels,
        datasets: [
            {
                label: `Grad risc ${altitudine === 'peste' ? '> 1800m' : '< 1800m'}`,
                data: riskValues,
                borderColor: avgColor,
                backgroundColor: `${avgColor}18`,
                pointBackgroundColor: riskValues.map(v => (v !== null ? RISK_COLORS[v] || '#64748b' : '#64748b')),
                pointBorderColor: riskValues.map(v => (v !== null ? RISK_COLORS[v] || '#64748b' : '#64748b')),
                pointRadius: 7,
                pointHoverRadius: 10,
                borderWidth: 2.5,
                tension: 0.35,
                fill: true,
                spanGaps: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleColor: '#94a3b8',
                bodyColor: '#f8fafc',
                padding: 12,
                callbacks: {
                    title: (items) => {
                        const idx = items[0].dataIndex;
                        return historyData[idx]?.perioada || '';
                    },
                    label: (item) => {
                        const v = item.raw;
                        if (v === null) return ' Date indisponibile';
                        return ` Grad ${v} — ${RISK_LABELS[v] || ''}`;
                    },
                    labelColor: (item) => ({
                        backgroundColor: RISK_COLORS[item.raw] || '#64748b',
                        borderColor: RISK_COLORS[item.raw] || '#64748b',
                        borderRadius: 4,
                    }),
                },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b', font: { size: 11 } },
                border: { color: 'rgba(255,255,255,0.06)' },
            },
            y: {
                min: 0, max: 5,
                ticks: {
                    color: '#64748b', stepSize: 1, font: { size: 11 },
                    callback: (v) => v === 0 ? '' : `Grad ${v}`,
                },
                grid: { color: 'rgba(255,255,255,0.04)' },
                border: { color: 'rgba(255,255,255,0.06)' },
            },
        },
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-8">
            {/* Header */}
            <header style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
                            Statistici Risc Avalanșe
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                            Evoluția gradului de risc pe masive montane — date din buletinele nivometeorologice
                        </p>
                    </div>
                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                            color: loading ? '#64748b' : '#3b82f6',
                            padding: '0.65rem 1.4rem', borderRadius: '0.75rem',
                            fontWeight: 700, fontSize: '0.85rem',
                            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                        {loading ? 'Se încarcă...' : 'Reîncarcă'}
                    </button>
                </div>
            </header>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        border: '3px solid rgba(59,130,246,0.15)',
                        borderTopColor: '#3b82f6',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <p style={{ color: '#64748b' }}>Se încarcă istoricul...</p>
                </div>
            ) : error ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    padding: '4rem 2rem', textAlign: 'center',
                    background: 'rgba(239,68,68,0.05)', borderRadius: '1.5rem',
                    border: '1px solid rgba(239,68,68,0.15)',
                }}>
                    <AlertCircle size={40} style={{ color: '#ef4444' }} />
                    <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
                </div>
            ) : (
                <>
                    {/* Controale */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end',
                        padding: '1.25rem 1.5rem',
                        background: 'rgba(15,23,42,0.5)', borderRadius: '1.25rem',
                        border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                        {/* Selector masiv */}
                        <div style={{ flex: '1 1 220px' }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
                                Masiv montan
                            </label>
                            <select
                                value={selectedMasiv}
                                onChange={e => setSelectedMasiv(e.target.value)}
                                style={{
                                    background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', padding: '0.6rem 1rem', borderRadius: '0.75rem',
                                    fontSize: '0.9rem', fontWeight: 600, width: '100%', cursor: 'pointer',
                                }}
                            >
                                {masive.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {/* Toggle altitudine */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
                                Altitudine
                            </label>
                            <div style={{ display: 'flex', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {[
                                    { val: 'peste', label: '🏔️ > 1800m' },
                                    { val: 'sub', label: '🌲 < 1800m' },
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => setAltitudine(opt.val)}
                                        style={{
                                            padding: '0.6rem 1.1rem', fontWeight: 700, fontSize: '0.82rem',
                                            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                            background: altitudine === opt.val ? '#3b82f6' : 'rgba(30,41,59,0.8)',
                                            color: altitudine === opt.val ? 'white' : '#64748b',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info buletine */}
                        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#475569', alignSelf: 'center' }}>
                            <span style={{ color: '#3b82f6', fontWeight: 700 }}>{historyData.length}</span> buletine în baza de date
                        </div>
                    </div>

                    {/* Statistici rapide */}
                    {validValues.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                            <StatCard label="Risc maxim" value={`Grad ${maxRisk}`} color={RISK_COLORS[maxRisk]} icon="🔴" />
                            <StatCard label="Risc minim" value={`Grad ${minRisk}`} color={RISK_COLORS[minRisk]} icon="🟢" />
                            <StatCard label="Medie sezon" value={`Grad ${avgRisk}`} color="#3b82f6" icon="📊" />
                            <StatCard label="Ultimul buletin" value={lastRisk ? `Grad ${lastRisk}` : 'N/A'} color={lastRisk ? RISK_COLORS[lastRisk] : '#64748b'} icon="📋" />
                        </div>
                    )}

                    {/* Grafic */}
                    <div style={{
                        background: 'rgba(15,23,42,0.55)', borderRadius: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            <TrendingUp size={18} style={{ color: avgColor }} />
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>
                                {selectedMasiv} — {altitudine === 'peste' ? 'altitudine > 1800m' : 'altitudine < 1800m'}
                            </span>
                        </div>

                        {validValues.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                Nu există date pentru masivul selectat.
                            </div>
                        ) : (
                            <div style={{ height: '340px' }}>
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        )}
                    </div>

                    {/* Legendă grade risc */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '0.6rem',
                        padding: '1rem 1.25rem',
                        background: 'rgba(15,23,42,0.4)', borderRadius: '1rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <span style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', alignSelf: 'center', marginRight: '0.5rem' }}>
                            Legendă:
                        </span>
                        {[1, 2, 3, 4, 5].map(g => (
                            <div key={g} style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.3rem 0.75rem', borderRadius: '999px',
                                background: `${RISK_COLORS[g]}15`, border: `1px solid ${RISK_COLORS[g]}35`,
                            }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: RISK_COLORS[g] }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: RISK_COLORS[g] }}>Grad {g}</span>
                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>— {RISK_LABELS[g]}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AvalancheRiskChartPage;
