import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Users, AlertTriangle, Shield, Heart, Skull, RefreshCw, Briefcase, Calendar } from 'lucide-react';
import avalancheService from '../services/avalancheService';
import metadataService from '../services/metadataService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

const StatCard = ({ label, value, color, icon: Icon }) => (
    <div style={{
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${color}25`,
        borderRadius: '1.25rem',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease'
    }} className="hover:scale-105">
        <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '0.85rem',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            fontSize: '1.4rem',
            flexShrink: 0
        }}>
            <Icon size={22} />
        </div>
        <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                {label}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
                {value}
            </div>
        </div>
    </div>
);

const HumanImpactStatsPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [metadata, setMetadata] = useState({ massifs: [] });
    const [error, setError] = useState(null);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const [avalanchesData, massifsData] = await Promise.all([
                avalancheService.search({ status: 'VALIDATED', size: 10000 }),
                metadataService.getMassifs()
            ]);
            setData(avalanchesData.content || []);
            setMetadata({ massifs: massifsData || [] });
        } catch (err) {
            console.error(err);
            setError('Eroare la încărcarea datelor statistice.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // ─── Calcule statistice ───
    const stats = {
        totalAccidents: data.length,
        totalCaught: 0,
        totalInjured: 0,
        totalKilled: 0,
        totalPartially: 0,
        totalFully: 0,
        materialDamages: 0
    };

    const massifStats = {}; // { massifName: { caught: 0, killed: 0, injured: 0 } }
    const activityStats = {}; // { activityName: count }
    const equipmentStats = {
        dva: 0,
        airbag: 0,
        sonda: 0,
        lopata: 0,
        fara: 0,
        nespecificat: 0
    };
    const monthlyCounts = Array(12).fill(0);

    data.forEach(item => {
        // Group by month
        if (item.date) {
            const eventDate = new Date(item.date);
            if (!isNaN(eventDate.getTime())) {
                const month = eventDate.getMonth();
                monthlyCounts[month] += 1;
            }
        }
        const dv = item.damagesAndVictims;
        if (dv) {
            stats.totalCaught += dv.personsCaught || 0;
            stats.totalInjured += dv.personsInjured || 0;
            stats.totalKilled += dv.personsKilled || 0;
            stats.totalPartially += dv.personsPartially || 0;
            stats.totalFully += dv.personsFully || 0;
            if (dv.materialDamage) stats.materialDamages += 1;

            // Group by massif
            const massifName = metadata.massifs.find(m => m.id === item.massifId)?.name || item.massifName || 'Nespecificat';
            if (!massifStats[massifName]) {
                massifStats[massifName] = { caught: 0, killed: 0, injured: 0 };
            }
            massifStats[massifName].caught += dv.personsCaught || 0;
            massifStats[massifName].killed += dv.personsKilled || 0;
            massifStats[massifName].injured += dv.personsInjured || 0;
        }

        // Group by activity
        const rawAct = item.activity ? item.activity.trim() : 'Nespecificată';
        const act = rawAct.charAt(0).toUpperCase() + rawAct.slice(1).toLowerCase();
        activityStats[act] = (activityStats[act] || 0) + 1;

        // Group by safety equipment
        const eqStr = item.safetyEquipment ? item.safetyEquipment.toLowerCase() : '';
        if (!eqStr) {
            equipmentStats.nespecificat += 1;
        } else if (eqStr.includes('fara') || eqStr.includes('nu') || eqStr === 'nimic') {
            equipmentStats.fara += 1;
        } else {
            let hasAny = false;
            if (eqStr.includes('dva') || eqStr.includes('transceiver') || eqStr.includes('arva')) {
                equipmentStats.dva += 1;
                hasAny = true;
            }
            if (eqStr.includes('airbag') || eqStr.includes('rucsac')) {
                equipmentStats.airbag += 1;
                hasAny = true;
            }
            if (eqStr.includes('sonda') || eqStr.includes('probe')) {
                equipmentStats.sonda += 1;
                hasAny = true;
            }
            if (eqStr.includes('lopata') || eqStr.includes('shovel')) {
                equipmentStats.lopata += 1;
                hasAny = true;
            }
            if (!hasAny) {
                equipmentStats.nespecificat += 1;
            }
        }
    });

    // Sort massifs by casualties
    const topMassifs = Object.entries(massifStats)
        .map(([name, val]) => ({ name, ...val }))
        .sort((a, b) => (b.caught + b.killed) - (a.caught + a.killed))
        .slice(0, 7);

    // ─── Configurații Grafice ───
    const topMassifsChartData = {
        labels: topMassifs.map(m => m.name),
        datasets: [
            {
                label: 'Decese',
                data: topMassifs.map(m => m.killed),
                backgroundColor: '#ef4444',
                borderRadius: 6
            },
            {
                label: 'Răniți',
                data: topMassifs.map(m => m.injured),
                backgroundColor: '#f59e0b',
                borderRadius: 6
            },
            {
                label: 'Persoane Prinse',
                data: topMassifs.map(m => m.caught),
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }
        ]
    };

    const activityChartData = {
        labels: Object.keys(activityStats),
        datasets: [
            {
                data: Object.values(activityStats),
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
                    '#06b6d4', '#64748b', '#ef4444'
                ],
                borderWidth: 1,
                borderColor: 'rgba(15, 23, 42, 0.95)'
            }
        ]
    };

    const equipmentChartData = {
        labels: ['DVA / Transceiver', 'Airbag', 'Sondă', 'Lopată', 'Fără echipament', 'Nespecificat'],
        datasets: [
            {
                data: [
                    equipmentStats.dva,
                    equipmentStats.airbag,
                    equipmentStats.sonda,
                    equipmentStats.lopata,
                    equipmentStats.fara,
                    equipmentStats.nespecificat
                ],
                backgroundColor: [
                    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ef4444', '#475569'
                ],
                borderWidth: 1,
                borderColor: 'rgba(15, 23, 42, 0.95)'
            }
        ]
    };

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#94a3b8',
                    font: { size: 11, weight: 'bold' },
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10
            }
        }
    };

    const monthlyChartData = {
        labels: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
        datasets: [
            {
                label: 'Avalanșe raportate',
                data: monthlyCounts,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ef4444',
                pointHoverRadius: 8,
                pointRadius: 5
            }
        ]
    };

    const monthlyChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 10
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b', font: { weight: 'bold' } }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b', stepSize: 1 }
            }
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-8">
            {/* Header */}
            <header style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
                            Bilanț Uman &amp; Victime
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                            Analiza avalanșelor, victimelor și utilizării echipamentului de salvare în Carpați
                        </p>
                    </div>
                    <button
                        onClick={loadStats}
                        disabled={loading}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)',
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
                        border: '3px solid rgba(59, 130, 246, 0.15)',
                        borderTopColor: '#3b82f6',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <p style={{ color: '#64748b' }}>Se calculează bilanțul...</p>
                </div>
            ) : error ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    padding: '4rem 2rem', textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.05)', borderRadius: '1.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                }}>
                    <AlertTriangle size={40} style={{ color: '#ef4444' }} />
                    <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <StatCard label="Total Avalanșe" value={stats.totalAccidents} color="#3b82f6" icon={AlertTriangle} />
                        <StatCard label="Persoane Prinse" value={stats.totalCaught} color="#06b6d4" icon={Users} />
                        <StatCard label="Decese" value={stats.totalKilled} color="#ef4444" icon={Skull} />
                        <StatCard label="Persoane Rănite" value={stats.totalInjured} color="#f59e0b" icon={Heart} />
                        <StatCard label="Îngropate Complet" value={stats.totalFully} color="#ec4899" icon={Shield} />
                        <StatCard label="Daune Materiale" value={stats.materialDamages} color="#8b5cf6" icon={Briefcase} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                        {/* Casualty by Massif */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Top 7 Masive după Număr de Victime &amp; Persoane Prinse
                            </h3>
                            <div style={{ height: '320px' }}>
                                <Bar data={topMassifsChartData} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { labels: { color: '#94a3b8', font: { weight: 'bold' } } }
                                    },
                                    scales: {
                                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } },
                                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', stepSize: 1 } }
                                    }
                                }} />
                            </div>
                        </div>

                        {/* Safety Equipment */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Utilizare Echipament de Siguranță (în rapoarte)
                            </h3>
                            <div style={{ height: '320px', position: 'relative' }}>
                                <Doughnut data={equipmentChartData} options={donutOptions} />
                            </div>
                        </div>

                        {/* Activities */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                            gridColumn: '1 / -1'
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Activități în momentul declanșării avalanșei
                            </h3>
                            <div style={{ height: '320px' }}>
                                <Bar data={{
                                    labels: Object.keys(activityStats),
                                    datasets: [{
                                        label: 'Avalanșe raportate',
                                        data: Object.values(activityStats),
                                        backgroundColor: '#10b981',
                                        borderRadius: 6
                                    }]
                                }} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' } },
                                        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', stepSize: 1 } }
                                    }
                                }} />
                            </div>
                        </div>

                        {/* Monthly Incident Distribution */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                            gridColumn: '1 / -1'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
                                <Calendar size={20} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', margin: 0 }}>
                                    Distribuția Avalanșelor pe Luni (Sezonul Critic)
                                </h3>
                            </div>
                            <div style={{ height: '320px' }}>
                                <Line data={monthlyChartData} options={monthlyChartOptions} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default HumanImpactStatsPage;
