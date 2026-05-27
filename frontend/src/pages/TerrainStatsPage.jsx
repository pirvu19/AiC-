import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    ArcElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, PolarArea, Scatter } from 'react-chartjs-2';
import { Mountain, Compass, ArrowUp, RefreshCw, AlertTriangle, Activity } from 'lucide-react';
import avalancheService from '../services/avalancheService';
import metadataService from '../services/metadataService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    RadialLinearScale,
    ArcElement,
    PointElement,
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

const TerrainStatsPage = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [metadata, setMetadata] = useState({ massifs: [], orientations: [] });
    const [error, setError] = useState(null);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const [avalanchesData, massifsData, orientationsData] = await Promise.all([
                avalancheService.search({ status: 'VALIDATED', size: 10000 }),
                metadataService.getMassifs(),
                metadataService.getOrientations()
            ]);
            setData(avalanchesData.content || []);
            setMetadata({
                massifs: massifsData || [],
                orientations: orientationsData || []
            });
        } catch (err) {
            console.error(err);
            setError('Eroare la încărcarea datelor statistice de teren.');
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
        avgAltitude: 0,
        avgSlope: 0,
        mostActiveMassif: 'Nespecificat',
        mostCommonOrientation: 'Nespecificată'
    };

    const orientationCounts = {}; // { direction: count }
    const massifCounts = {}; // { massifName: count }
    const altitudeBins = {
        '< 1500m': 0,
        '1500m - 2000m': 0,
        '2000m - 2500m': 0,
        '> 2500m': 0
    };

    let totalAltSum = 0;
    let totalAltCount = 0;
    let totalSlopeSum = 0;
    let totalSlopeCount = 0;

    data.forEach(item => {
        // Massifs
        const massifName = metadata.massifs.find(m => m.id === item.massifId)?.name || item.massifName || 'Nespecificat';
        massifCounts[massifName] = (massifCounts[massifName] || 0) + 1;

        // Orientations
        const orient = metadata.orientations.find(o => o.id === item.orientationId);
        const direction = orient ? orient.direction : 'Nespecificată';
        if (direction !== 'Nespecificată') {
            orientationCounts[direction] = (orientationCounts[direction] || 0) + 1;
        }

        // Technical details (Altitude, Slope)
        const td = item.technicalDetails;
        if (td) {
            if (td.altitude) {
                totalAltSum += td.altitude;
                totalAltCount += 1;

                // Altitude bins
                if (td.altitude < 1500) altitudeBins['< 1500m'] += 1;
                else if (td.altitude >= 1500 && td.altitude < 2000) altitudeBins['1500m - 2000m'] += 1;
                else if (td.altitude >= 2000 && td.altitude < 2500) altitudeBins['2000m - 2500m'] += 1;
                else altitudeBins['> 2500m'] += 1;
            }
            if (td.slopeInterpolation) {
                totalSlopeSum += td.slopeInterpolation;
                totalSlopeCount += 1;
            }
        }
    });

    stats.avgAltitude = totalAltCount > 0 ? Math.round(totalAltSum / totalAltCount) : 0;
    stats.avgSlope = totalSlopeCount > 0 ? Math.round(totalSlopeSum / totalSlopeCount) : 0;

    // Find most active massif
    const sortedMassifs = Object.entries(massifCounts).sort((a, b) => b[1] - a[1]);
    stats.mostActiveMassif = sortedMassifs.length > 0 ? sortedMassifs[0][0] : 'Nespecificat';

    // Find most common orientation
    const sortedOrientations = Object.entries(orientationCounts).sort((a, b) => b[1] - a[1]);
    stats.mostCommonOrientation = sortedOrientations.length > 0 ? sortedOrientations[0][0] : 'Nespecificată';

    // ─── Configurații Grafice ───
    const sortedMassifChartData = {
        labels: sortedMassifs.slice(0, 8).map(m => m[0]),
        datasets: [{
            label: 'Avalanșe înregistrate',
            data: sortedMassifs.slice(0, 8).map(m => m[1]),
            backgroundColor: '#3b82f6',
            borderRadius: 6
        }]
    };

    // Standard 8 directions
    const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SV', 'V', 'NV'];
    const compassDataValues = compassDirections.map(dir => orientationCounts[dir] || 0);

    const orientationChartData = {
        labels: compassDirections,
        datasets: [{
            label: 'Avalanșe',
            data: compassDataValues,
            backgroundColor: [
                'rgba(239, 68, 68, 0.4)', // N - Red
                'rgba(245, 158, 11, 0.4)', // NE
                'rgba(16, 185, 129, 0.4)', // E
                'rgba(6, 182, 212, 0.4)', // SE
                'rgba(59, 130, 246, 0.4)', // S - Blue
                'rgba(139, 92, 246, 0.4)', // SV
                'rgba(236, 72, 153, 0.4)', // V
                'rgba(100, 116, 139, 0.4)'  // NV
            ],
            borderColor: [
                '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
            ],
            borderWidth: 1.5
        }]
    };

    const altitudeChartData = {
        labels: Object.keys(altitudeBins),
        datasets: [{
            label: 'Număr avalanșe',
            data: Object.values(altitudeBins),
            backgroundColor: '#10b981',
            borderRadius: 6
        }]
    };

    const scatterPoints = [];
    data.forEach(item => {
        const td = item.technicalDetails;
        if (td && td.altitude && td.slopeInterpolation) {
            scatterPoints.push({
                x: td.altitude,
                y: td.slopeInterpolation
            });
        }
    });

    const scatterChartData = {
        datasets: [
            {
                label: 'Corelație evenimente (Altitudine vs. Înclinație)',
                data: scatterPoints,
                backgroundColor: '#f59e0b',
                pointRadius: 6,
                pointHoverRadius: 8,
            }
        ]
    };

    const scatterOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#94a3b8', font: { weight: 'bold' } }
            },
            tooltip: {
                callbacks: {
                    label: (context) => `Altitudine: ${context.parsed.x}m, Înclinație: ${context.parsed.y}°`
                }
            }
        },
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: {
                    display: true,
                    text: 'Altitudine (m)',
                    color: '#94a3b8',
                    font: { weight: 'bold' }
                },
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b' }
            },
            y: {
                title: {
                    display: true,
                    text: 'Înclinație (°)',
                    color: '#94a3b8',
                    font: { weight: 'bold' }
                },
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#64748b' }
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
                            Analiza Terenului
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                            Distribuția avalanșelor în funcție de altitudine, masiv montan și orientarea pantei
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
                    <p style={{ color: '#64748b' }}>Se analizează terenul...</p>
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
                        <StatCard label="Total Evenimente" value={stats.totalAvalanches} color="#3b82f6" icon={Activity} />
                        <StatCard label="Cel mai activ Masiv" value={stats.mostActiveMassif} color="#06b6d4" icon={Mountain} />
                        <StatCard label="Orientare Critică" value={stats.mostCommonOrientation} color="#ef4444" icon={Compass} />
                        <StatCard label="Altitudine Medie" value={stats.avgAltitude ? `${stats.avgAltitude} m` : 'N/A'} color="#10b981" icon={ArrowUp} />
                        <StatCard label="Înclinație Medie" value={stats.avgSlope ? `${stats.avgSlope}°` : 'N/A'} color="#f59e0b" icon={AlertTriangle} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                        {/* Orientation Polar Area */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Roză a Orientării Pantelor (Tipologia expunerilor)
                            </h3>
                            <div style={{ height: '320px', position: 'relative' }}>
                                <PolarArea data={orientationChartData} options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: {
                                            grid: { color: 'rgba(255,255,255,0.05)' },
                                            angleLines: { color: 'rgba(255,255,255,0.05)' },
                                            ticks: { display: false }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            position: 'right',
                                            labels: { color: '#94a3b8', font: { weight: 'bold' } }
                                        }
                                    }
                                }} />
                            </div>
                        </div>

                        {/* Altitude Bins */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Distribuția Evenimentelor pe Interval de Altitudine
                            </h3>
                            <div style={{ height: '320px' }}>
                                <Bar data={altitudeChartData} options={{
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

                        {/* Top active massifs */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                            gridColumn: '1 / -1'
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Distribuția Totală pe Masive Montane
                            </h3>
                            <div style={{ height: '320px' }}>
                                <Bar data={sortedMassifChartData} options={{
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

                        {/* Corelație Altitudine vs. Înclinație Pantă */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.55)', borderRadius: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.07)', padding: '1.5rem',
                            gridColumn: '1 / -1'
                        }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>
                                Corelație Altitudine vs. Înclinație Pantă
                            </h3>
                            <div style={{ height: '350px' }}>
                                <Scatter data={scatterChartData} options={scatterOptions} />
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

export default TerrainStatsPage;
