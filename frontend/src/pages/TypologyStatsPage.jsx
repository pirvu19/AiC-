import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Layers, AlertCircle, HelpCircle, Activity, RefreshCw } from 'lucide-react';
import avalancheService from '../services/avalancheService';
import metadataService from '../services/metadataService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const TYPE_FALLBACKS = {
    1: 'Placă de zăpadă',
    2: 'Zăpadă pulverulentă',
    3: 'Zăpadă umedă',
    4: 'Avalanșă de gheață',
    5: 'Avalanșă de cornișă',
    6: 'Alunecare de zăpadă'
};

const CAUSE_FALLBACKS = {
    1: 'Autodeclanșată',
    2: 'Autodeclanșată natural',
    3: 'Topire',
    4: 'Încălzire bruscă',
    5: 'Viscol',
    6: 'Ninsoare cu vânt',
    7: 'Expunere la soare',
    8: 'Suprasarcină',
    9: 'Supraîncărcare',
    10: 'Infiltrații de apă',
    11: 'Umezire strat',
    12: 'Ruperea unei plăci',
    13: 'Cornișă',
    14: 'Ruperea cornișii',
    15: 'Slăbiciune în stratul de zăpadă',
    16: 'Placă de vânt',
    17: 'Strat instabil',
    18: 'Schior',
    19: 'Snowboarder',
    20: 'Alpinist',
    21: 'Factor uman',
    22: 'Declanșare intenționată',
    23: 'Încălzire și soare',
    24: 'Încălzire + infiltrații',
    25: 'Vreme instabilă',
    26: 'Ninsoare abundentă',
    27: 'Vânt puternic',
    28: 'Temperatură ridicată',
    29: 'Neprecizat'
};

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
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', lineHeight: 1.1 }}>
                {value}
            </div>
        </div>
    </div>
);

const TypologyStatsPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [metadata, setMetadata] = useState({ types: [], causes: [] });
    const [error, setError] = useState(null);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const [avalanchesData, typesData, causesData] = await Promise.all([
                avalancheService.search({ status: 'VALIDATED', size: 10000 }),
                metadataService.getTypes(),
                metadataService.getCauses()
            ]);
            setData(avalanchesData.content || []);
            setMetadata({
                types: typesData || [],
                causes: causesData || []
            });
        } catch (err) {
            console.error(err);
            setError('Eroare la încărcarea datelor statistice de tipologie.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    // ─── Calcule statistice ───
    const stats = {
        totalAvalanches: data.length,
        mostCommonType: 'Nespecificat',
        mostCommonCause: 'Nespecificată',
        mostCommonSize: 'Nespecificată'
    };

    const typeCounts = {}; // { typeName: count }
    const causeCounts = {}; // { causeName: count }
    const sizeCounts = {
        'Mică': 0,
        'Medie': 0,
        'Mare': 0,
        'Nespecificată': 0
    };

    data.forEach(item => {
        // Types
        const typeName = metadata.types.find(t => t.id === item.typeId)?.name || TYPE_FALLBACKS[item.typeId] || 'Nespecificat';
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;

        // Causes
        const causeName = metadata.causes.find(c => c.id === item.causeId)?.name || CAUSE_FALLBACKS[item.causeId] || 'Nespecificată';
        causeCounts[causeName] = (causeCounts[causeName] || 0) + 1;

        // Sizes
        const rawSz = item.size ? item.size.toLowerCase().trim() : '';
        if (rawSz.includes('mic') || rawSz === 'mica') sizeCounts['Mică'] += 1;
        else if (rawSz.includes('medi') || rawSz === 'medie') sizeCounts['Medie'] += 1;
        else if (rawSz.includes('mar') || rawSz === 'mare') sizeCounts['Mare'] += 1;
        else sizeCounts['Nespecificată'] += 1;
    });

    // Find most common type
    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    stats.mostCommonType = sortedTypes.length > 0 ? sortedTypes[0][0] : 'Nespecificat';

    // Find most common cause
    const sortedCauses = Object.entries(causeCounts).sort((a, b) => b[1] - a[1]);
    stats.mostCommonCause = sortedCauses.length > 0 ? sortedCauses[0][0] : 'Nespecificată';

    // Find most common size
    const sortedSizes = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1]);
    stats.mostCommonSize = sortedSizes.length > 0 ? sortedSizes[0][0] : 'Nespecificată';

    // ─── Configurații Grafice ───
    const typeChartData = {
        labels: Object.keys(typeCounts),
        datasets: [{
            data: Object.values(typeCounts),
            backgroundColor: [
                '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'
            ],
            borderWidth: 1,
            borderColor: 'rgba(15, 23, 42, 0.95)'
        }]
    };

    const causeChartData = {
        labels: sortedCauses.slice(0, 7).map(c => c[0]),
        datasets: [{
            data: sortedCauses.slice(0, 7).map(c => c[1]),
            backgroundColor: [
                '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#475569'
            ],
            borderWidth: 1,
            borderColor: 'rgba(15, 23, 42, 0.95)'
        }]
    };

    const sizeChartData = {
        labels: ['Mică (🔹)', 'Medie (🔶)', 'Mare (🔴)', 'Nespecificată'],
        datasets: [{
            label: 'Avalanșe',
            data: [sizeCounts['Mică'], sizeCounts['Medie'], sizeCounts['Mare'], sizeCounts['Nespecificată']],
            backgroundColor: ['#3b82f6', '#f97316', '#ef4444', '#475569'],
            borderRadius: 6
        }]
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
                    padding: 12
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

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-8">
            {/* Header */}
            <header style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
                            Cauze &amp; Tipologii
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                            Analiza tipului de zăpadă, cauzelor de declanșare și distribuția mărimilor avalanșelor
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
                    <p style={{ color: '#64748b' }}>Se analizează tipologiile...</p>
                </div>
            ) : error ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    padding: '4rem 2rem', textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.05)', borderRadius: '1.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                }}>
                    <AlertCircle size={40} style={{ color: '#ef4444' }} />
                    <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <StatCard label="Total Avalanșe" value={stats.totalAvalanches} color="#3b82f6" icon={Activity} />
                        <StatCard label="Tip predominant" value={stats.mostCommonType} color="#06b6d4" icon={Layers} />
                        <StatCard label="Cauză principală" value={stats.mostCommonCause} color="#ef4444" icon={AlertCircle} />
                        <StatCard label="Mărime frecventă" value={stats.mostCommonSize} color="#f59e0b" icon={HelpCircle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                        {/* Types Donut */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Tipologia Stratului de Zăpadă (Tip de avalanșă)
                            </h3>
                            <div style={{ height: '320px', position: 'relative' }}>
                                <Doughnut data={typeChartData} options={donutOptions} />
                            </div>
                        </div>

                        {/* Top Causes Donut */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Top 7 Cauze de declanșare
                            </h3>
                            <div style={{ height: '320px', position: 'relative' }}>
                                <Doughnut data={causeChartData} options={donutOptions} />
                            </div>
                        </div>

                        {/* Size distribution */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                            gridColumn: '1 / -1'
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Distribuția mărimilor avalanșelor
                            </h3>
                            <div style={{ height: '320px' }}>
                                <Bar data={sizeChartData} options={{
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
                    </div>
                </>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default TypologyStatsPage;
