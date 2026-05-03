import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, Activity, Shield, Users, RefreshCw, X, SlidersHorizontal, ChevronRight, ChevronLeft, LayoutGrid, List as ListIcon, CloudRain, Wind, Info, AlertTriangle, HelpCircle, Heart, ShieldAlert, Home as HomeIcon, Compass, ArrowRight, ChevronDown, FileSpreadsheet, FileJson, FileCode } from 'lucide-react';
import avalancheService from '../services/avalancheService';
import conditionsService from '../services/conditionsService';
import { Download } from 'lucide-react';
import metadataService from '../services/metadataService';
import MultiSelect from '../components/MultiSelect';
import CompassFilter from '../components/CompassFilter';
import RangeSlider from '../components/RangeSlider';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const TYPE_OPTIONS = [
    { id: 1, name: 'Placă de zăpadă' },
    { id: 2, name: 'Zăpadă pulverulentă' },
    { id: 3, name: 'Zăpadă umedă' },
    { id: 4, name: 'Avalanșă de gheață' },
    { id: 5, name: 'Avalanșă de cornișă' },
    { id: 6, name: 'Alunecare de zăpadă' }
];

const CAUSE_OPTIONS = [
    { id: 1, name: 'Autodeclanșată' },
    { id: 2, name: 'Autodeclanșată natural' },
    { id: 3, name: 'Topire' },
    { id: 4, name: 'Încălzire bruscă' },
    { id: 5, name: 'Viscol' },
    { id: 6, name: 'Ninsoare cu vânt' },
    { id: 7, name: 'Expunere la soare' },
    { id: 8, name: 'Suprasarcină' },
    { id: 9, name: 'Supraîncărcare' },
    { id: 10, name: 'Infiltrații de apă' },
    { id: 11, name: 'Umezire strat' },
    { id: 12, name: 'Ruperea unei plăci' },
    { id: 13, name: 'Cornișă' },
    { id: 14, name: 'Ruperea cornișii' },
    { id: 15, name: 'Slăbiciune în stratul de zăpadă' },
    { id: 16, name: 'Placă de vânt' },
    { id: 17, name: 'Strat instabil' },
    { id: 18, name: 'Schior' },
    { id: 19, name: 'Snowboarder' },
    { id: 20, name: 'Alpinist' },
    { id: 21, name: 'Factor uman' },
    { id: 22, name: 'Declanșare intenționată' },
    { id: 23, name: 'Încălzire și soare' },
    { id: 24, name: 'Încălzire + infiltrații' },
    { id: 25, name: 'Vreme instabilă' },
    { id: 26, name: 'Ninsoare abundentă' },
    { id: 27, name: 'Vânt puternic' },
    { id: 28, name: 'Temperatură ridicată' },
    { id: 29, name: 'Neprecizat' }
];

const WIND_DIRECTIONS = [
    { id: 'N', name: 'Nord' },
    { id: 'NE', name: 'Nord-Est' },
    { id: 'E', name: 'Est' },
    { id: 'SE', name: 'Sud-Est' },
    { id: 'S', name: 'Sud' },
    { id: 'SV', name: 'Sud-Vest' },
    { id: 'V', name: 'Vest' },
    { id: 'NV', name: 'Nord-Vest' }
];

const VISIBILITY_OPTIONS = [
    { id: 'excelenta', name: 'Excelentă (>10km)' },
    { id: 'buna', name: 'Bună (5-10km)' },
    { id: 'medie', name: 'Medie (1-5km)' },
    { id: 'redusa', name: 'Redusă (500m-1km)' },
    { id: 'foarte_redusa', name: 'Foarte Redusă (<500m)' }
];

const SearchPage = () => {
    const [view, setView] = useState('avalanches');
    const [layout, setLayout] = useState('list');
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [exportingFormat, setExportingFormat] = useState(null);
    const [showExportOptions, setShowExportOptions] = useState(false);
    const { isDataEngineer } = useAuth();

    const [results, setResults] = useState([]);
    const [filters, setFilters] = useState({
        title: '',
        massifId: [],
        regionId: [],
        typeId: [],
        causeId: [],
        orientationId: [],
        startDate: '',
        endDate: '',
        minAltitude: 0,
        maxAltitude: 3000,
        minSlope: 0,
        minTrackLength: 0,
        maxTrackLength: 2000,
        minCrownDepth: 0,
        maxCrownDepth: 300,
        minCrownWidth: 0,
        maxCrownWidth: 500,
        minVerticalDrop: 0,
        maxVerticalDrop: 1500,
        relativeSize: '',
        hasCaught: false,
        hasPartially: false,
        hasFully: false,
        hasInjured: false,
        hasKilled: false,
        hasMaterial: false,
        status: '',
        safetyEquipment: '',
        // Conditions filters
        minTemperature: -30,
        maxTemperature: 30,
        minWindSpeed: 0,
        maxWindSpeed: 150,
        windDirection: [],
        visibility: [],
        minSnowDepth: 0,
        maxSnowDepth: 500
    });

    const [metadata, setMetadata] = useState({
        massifs: [],
        regions: [],
        types: [],
        causes: [],
        orientations: []
    });

    useEffect(() => {
        const loadMetadata = async () => {
            const [massifs, regions, types, causes, orientations] = await Promise.all([
                metadataService.getMassifs(),
                metadataService.getRegions(),
                metadataService.getTypes(),
                metadataService.getCauses(),
                metadataService.getOrientations()
            ]);
            setMetadata({ massifs, regions, types, causes, orientations });
        };
        loadMetadata();
    }, []);

    const handleFilterChange = (name, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };

            // Reset massif filter if regions change and selected massifs are no longer valid
            if (name === 'regionId') {
                if (value.length > 0) {
                    const validMassifs = metadata.massifs
                        .filter(m => {
                            const mRegionId = m.region?.id || m.regionId;
                            return value.some(id => Number(id) === Number(mRegionId));
                        })
                        .map(m => m.id);
                    
                    newFilters.massifId = prev.massifId.filter(id => 
                        validMassifs.some(vid => Number(vid) === Number(id))
                    );
                } else {
                    // Optional: clear massifs if no region selected? 
                    // User said "if chosen a region, see only corresponding massifs", 
                    // but if none chosen, show all.
                }
            }

            return newFilters;
        });
        setCurrentPage(0);
    };

    const clearFilters = () => {
        setFilters({
            title: '',
            massifId: [],
            regionId: [],
            typeId: [],
            causeId: [],
            orientationId: [],
            startDate: '',
            endDate: '',
            minAltitude: 0,
            maxAltitude: 3000,
            minSlope: 0,
            minTrackLength: 0,
            maxTrackLength: 2000,
            minCrownDepth: 0,
            maxCrownDepth: 300,
            minCrownWidth: 0,
            maxCrownWidth: 500,
            minVerticalDrop: 0,
            maxVerticalDrop: 1500,
            relativeSize: '',
            hasCaught: false,
            hasPartially: false,
            hasFully: false,
            hasInjured: false,
            hasKilled: false,
            hasMaterial: false,
            status: '',
            safetyEquipment: '',
            minTemperature: -30,
            maxTemperature: 30,
            minWindSpeed: 0,
            maxWindSpeed: 150,
            windDirection: [],
            visibility: [],
            minSnowDepth: 0,
            maxSnowDepth: 500
        });
        setCurrentPage(0);
    };

    const setDatePreset = (preset) => {
        const end = new Date();
        let start = new Date();

        switch (preset) {
            case 'week': start.setDate(end.getDate() - 7); break;
            case 'month': start.setMonth(end.getMonth() - 1); break;
            case '3months': start.setMonth(end.getMonth() - 3); break;
            case 'season':
                const currentYear = end.getFullYear();
                if (end.getMonth() >= 10 || end.getMonth() <= 3) {
                    start = new Date(currentYear - (end.getMonth() <= 3 ? 1 : 0), 10, 1);
                } else {
                    start = new Date(currentYear, 10, 1);
                }
                break;
            default: return;
        }

        setFilters(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));
    };

    const handleSearch = async (e) => {
        if (e) {
            e.preventDefault();
            setCurrentPage(0);
        }
        setLoading(true);
        try {
            const cleanParams = {
                page: currentPage,
                size: pageSize
            };

            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length > 0) cleanParams[key] = value;
                } else if (value !== '' && value !== false && value !== null) {
                    // Skip defaults to keep URL clean
                    if (key === 'minAltitude' && value === 0) return;
                    if (key === 'maxAltitude' && value === 3000) return;
                    if (key === 'minSlope' && value === 0) return;
                    if (key === 'minTrackLength' && value === 0) return;
                    if (key === 'maxTrackLength' && value === 2000) return;
                    if (key === 'minCrownDepth' && value === 0) return;
                    if (key === 'maxCrownDepth' && value === 300) return;
                    if (key === 'minCrownWidth' && value === 0) return;
                    if (key === 'maxCrownWidth' && value === 500) return;
                    if (key === 'minVerticalDrop' && value === 0) return;
                    if (key === 'maxVerticalDrop' && value === 1500) return;
                    
                    // Conditions defaults
                    if (key === 'minTemperature' && value === -30) return;
                    if (key === 'maxTemperature' && value === 30) return;
                    if (key === 'minWindSpeed' && value === 0) return;
                    if (key === 'maxWindSpeed' && value === 150) return;
                    if (key === 'minSnowDepth' && value === 0) return;
                    if (key === 'maxSnowDepth' && value === 500) return;

                    cleanParams[key] = value;
                }
            });

            let data = [];
            if (view === 'avalanches') {
                data = await avalancheService.search(cleanParams);
            } else {
                data = await conditionsService.search(cleanParams);
            }
            setResults(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        setLoading(true);
        setExportingFormat(format);
        const toastId = toast.info(`Se pregătește exportul în format ${format.toUpperCase()}...`, {
            autoClose: false,
            isLoading: true
        });

        try {
            const cleanParams = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length > 0) cleanParams[key] = value;
                } else if (value !== '' && value !== false && value !== null) {
                    // Skip defaults
                    if (key === 'minAltitude' && value === 0) return;
                    if (key === 'maxAltitude' && value === 3000) return;
                    if (key === 'minSlope' && value === 0) return;
                    if (key === 'minTrackLength' && value === 0) return;
                    if (key === 'maxTrackLength' && value === 2000) return;
                    if (key === 'minCrownDepth' && value === 0) return;
                    if (key === 'maxCrownDepth' && value === 300) return;
                    if (key === 'minCrownWidth' && value === 0) return;
                    if (key === 'maxCrownWidth' && value === 500) return;
                    if (key === 'minVerticalDrop' && value === 0) return;
                    if (key === 'maxVerticalDrop' && value === 1500) return;

                    // Conditions defaults
                    if (key === 'minTemperature' && value === -30) return;
                    if (key === 'maxTemperature' && value === 30) return;
                    if (key === 'minWindSpeed' && value === 0) return;
                    if (key === 'maxWindSpeed' && value === 150) return;
                    if (key === 'minSnowDepth' && value === 0) return;
                    if (key === 'maxSnowDepth' && value === 500) return;

                    cleanParams[key] = value;
                }
            });

            const blob = view === 'avalanches' 
                ? await avalancheService.exportData(cleanParams, format)
                : await conditionsService.exportData(cleanParams, format);
            
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${view}_${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            toast.update(toastId, {
                render: `Exportul ${format.toUpperCase()} a fost finalizat cu succes!`,
                type: 'success',
                isLoading: false,
                autoClose: 3000
            });
        } catch (err) {
            console.error('Export error:', err);
            toast.update(toastId, {
                render: `Eroare la export: ${err.message || 'Eroare server'}`,
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        } finally {
            setLoading(false);
            setExportingFormat(null);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch();
        }, 400);
        return () => clearTimeout(timer);
    }, [view, currentPage, pageSize, filters]);

    return (
        <div className="min-h-screen">
            <div className="max-w-5xl mx-auto px-6 space-y-12 animate-in fade-in duration-1000 pb-32">
                {/* Header */}
                <header className="space-y-6 text-center py-12">
                    <h1 className="text-5xl font-black tracking-tighter gradient-text leading-tight">
                        Căutare Avansată
                    </h1>
                    <p className="text-text-muted text-lg max-w-2xl mx-auto">
                        Explorează baza de date {view === 'avalanches' ? 'avalanșelor' : 'condițiilor'} din Carpați
                    </p>

                    <div className="flex justify-center gap-4 pt-4">
                        <button
                            onClick={() => setView('avalanches')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 border-2 ${view === 'avalanches'
                                    ? 'bg-primary border-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-105'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            Avalanșe
                        </button>
                        <button
                            onClick={() => setView('conditions')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 border-2 ${view === 'conditions'
                                    ? 'bg-primary border-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-105'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            Condiții
                        </button>
                    </div>

                    <div className="pt-4 flex justify-center gap-6">
                        <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Rezultate pe pagină:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer appearance-none pr-6"
                            >
                                {[10, 20, 50, 100].map(val => <option key={val} value={val} className="bg-background">{val}</option>)}
                            </select>
                            <ChevronDown size={16} className="text-primary -ml-4 pointer-events-none" />
                        </div>
                    </div>
                </header>

                {/* Filter Panel */}
                <section className="animate-in slide-in-from-top-6 duration-700">
                    <form onSubmit={handleSearch} className="bg-white/5 rounded-3xl border border-white/10 shadow-2xl p-8 md:p-12 space-y-10">

                        {/* Search Bar */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                Căutare rapidă
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary" size={20} />
                                <input
                                    name="title"
                                    value={filters.title}
                                    onChange={(e) => handleFilterChange('title', e.target.value)}
                                    placeholder="Caută în titluri, masive, locații..."
                                    className="pl-14 w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all rounded-xl py-3.5 px-6 text-sm font-medium placeholder:text-white/30"
                                />
                            </div>
                        </div>

                        {view === 'avalanches' && (
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                    Echipament Protecție
                                </label>
                                <div className="relative group">
                                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/60 transition-colors group-focus-within:text-primary" size={20} />
                                    <input
                                        name="safetyEquipment"
                                        value={filters.safetyEquipment}
                                        onChange={(e) => handleFilterChange('safetyEquipment', e.target.value)}
                                        placeholder="Ex: DVA, sondă, lopată..."
                                        className="pl-14 w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all rounded-xl py-3.5 px-6 text-sm font-medium placeholder:text-white/30"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Main Filters */}
                        <div className="space-y-8">

                            {/* Region */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                    Regiune
                                </label>
                                <div className="flex gap-3">
                                    {metadata.regions.map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => {
                                                const newVal = filters.regionId.includes(r.id)
                                                    ? filters.regionId.filter(id => id !== r.id)
                                                    : [...filters.regionId, r.id];
                                                handleFilterChange('regionId', newVal);
                                            }}
                                            className={`flex-1 py-3 px-5 rounded-xl text-sm font-bold transition-all duration-300 border ${filters.regionId.includes(r.id)
                                                    ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20'
                                                    : 'bg-white/5 border-white/10 text-white/80 hover:border-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Massif */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                    Masiv Muntos
                                </label>
                                <MultiSelect
                                    options={filters.regionId.length > 0
                                        ? metadata.massifs.filter(m => {
                                            const mRegionId = m.region?.id || m.regionId;
                                            return filters.regionId.some(rid => Number(rid) === Number(mRegionId));
                                        })
                                        : (metadata.massifs.length > 0 ? metadata.massifs : [])}
                                    value={filters.massifId}
                                    onChange={(val) => handleFilterChange('massifId', val)}
                                    placeholder="Selectează masivele..."
                                />
                            </div>

                            {/* Avalanche specific filters */}
                            {view === 'avalanches' && (
                                <>
                                    {/* Cause */}
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                            Cauza Avalanșei
                                        </label>
                                        <MultiSelect
                                            options={metadata.causes && metadata.causes.length > 0 ? metadata.causes : CAUSE_OPTIONS}
                                            value={filters.causeId}
                                            onChange={(val) => handleFilterChange('causeId', val)}
                                            placeholder="Selectează cauzele..."
                                        />
                                    </div>

                                    {/* Type */}
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                            Tip Avalanșă
                                        </label>
                                        <MultiSelect
                                            options={metadata.types.length > 0 ? metadata.types : TYPE_OPTIONS}
                                            value={filters.typeId}
                                            onChange={(val) => handleFilterChange('typeId', val)}
                                            placeholder="Selectează tipul..."
                                        />
                                    </div>

                                    {/* Orientation */}
                                    <div className="space-y-4 flex flex-col items-center">
                                        <label className="block text-xs font-bold text-white/70 uppercase tracking-widest text-center">
                                            Orientare Pantă
                                        </label>
                                        <CompassFilter 
                                            value={filters.orientationId}
                                            onChange={(val) => handleFilterChange('orientationId', val)}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Conditions specific filters */}
                            {view === 'conditions' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                            Vizibilitate
                                        </label>
                                        <MultiSelect
                                            options={VISIBILITY_OPTIONS}
                                            value={filters.visibility}
                                            onChange={(val) => handleFilterChange('visibility', val)}
                                            placeholder="Selectează vizibilitatea..."
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                            Direcție Vânt
                                        </label>
                                        <MultiSelect
                                            options={WIND_DIRECTIONS}
                                            value={filters.windDirection}
                                            onChange={(val) => handleFilterChange('windDirection', val)}
                                            placeholder="Selectează direcția..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Date Interval */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                    Interval Temporal
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                    {[
                                        { key: 'week', label: 'Săpt. Curentă' },
                                        { key: 'month', label: 'Luna Curentă' },
                                        { key: '3months', label: 'Ultimele 3 Luni' },
                                        { key: 'season', label: 'Sezon Iarnă' }
                                    ].map(preset => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => setDatePreset(preset.key)}
                                            className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white/70 hover:bg-white/10 hover:border-primary/30 hover:text-white transition-all duration-300"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 focus:border-primary/50 focus:bg-white/10 transition-all"
                                    />
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 focus:border-primary/50 focus:bg-white/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Technical Details - Sliders */}
                            <div className="space-y-10 pt-4">
                                {view === 'avalanches' && (
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-white/30 uppercase tracking-[0.2em] mb-4">
                                            Mărime Avalanșă
                                        </label>
                                        <div className="flex flex-wrap gap-4">
                                            {['mica', 'medie', 'mare'].map(sz => (
                                                <button
                                                    key={sz}
                                                    type="button"
                                                    onClick={() => handleFilterChange('relativeSize', filters.relativeSize === sz ? '' : sz)}
                                                    className={`flex-1 min-w-[120px] py-4 px-6 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 border ${filters.relativeSize === sz
                                                            ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20 scale-105'
                                                            : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {sz}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <label className="block text-xs font-black text-white/30 uppercase tracking-[0.2em]">
                                        Parametri Tehnici (Intervale)
                                    </label>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <RangeSlider 
                                            label="Altitudine" min={0} max={3000} step={50} minVal={filters.minAltitude} maxVal={filters.maxAltitude} suffix="m"
                                            onChange={(type, val) => handleFilterChange(type === 'min' ? 'minAltitude' : 'maxAltitude', val)}
                                        />
                                        
                                        {view === 'avalanches' ? (
                                            <>
                                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
                                                    <div className="flex justify-between items-center mb-8">
                                                        <span className="text-xs font-black text-white/40 uppercase tracking-widest">Înclinație Pantă</span>
                                                        <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                                                            Min: {filters.minSlope}°
                                                        </span>
                                                    </div>
                                                    <div className="h-6 flex items-center">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="60"
                                                            step="1"
                                                            value={filters.minSlope}
                                                            onChange={(e) => handleFilterChange('minSlope', parseInt(e.target.value))}
                                                            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                                                        />
                                                    </div>
                                                </div>
                                                <RangeSlider 
                                                    label="Lungime Traseu" min={0} max={2000} step={50} minVal={filters.minTrackLength} maxVal={filters.maxTrackLength} suffix="m"
                                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minTrackLength' : 'maxTrackLength', val)}
                                                />
                                                <RangeSlider 
                                                    label="Adâncime Coroană" min={0} max={300} step={5} minVal={filters.minCrownDepth} maxVal={filters.maxCrownDepth} suffix="cm"
                                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minCrownDepth' : 'maxCrownDepth', val)}
                                                />
                                                <RangeSlider 
                                                    label="Lățime Coroană" min={0} max={500} step={10} minVal={filters.minCrownWidth} maxVal={filters.maxCrownWidth} suffix="m"
                                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minCrownWidth' : 'maxCrownWidth', val)}
                                                />
                                                <RangeSlider 
                                                    label="Denivelare Verticală" min={0} max={1500} step={50} minVal={filters.minVerticalDrop} maxVal={filters.maxVerticalDrop} suffix="m"
                                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minVerticalDrop' : 'maxVerticalDrop', val)}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <RangeSlider 
                                                    label="Temperatură" min={-30} max={30} step={1} minVal={filters.minTemperature} maxVal={filters.maxTemperature} suffix="°C"
                                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minTemperature' : 'maxTemperature', val)}
                                                />
                                                <RangeSlider 
                                                    label="Viteză Vânt" min={0} max={150} step={5} minVal={filters.minWindSpeed} maxVal={filters.maxWindSpeed} suffix="km/h"
                                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minWindSpeed' : 'maxWindSpeed', val)}
                                                />
                                                <RangeSlider 
                                                    label="Grosime Zăpadă" min={0} max={500} step={10} minVal={filters.minSnowDepth} maxVal={filters.maxSnowDepth} suffix="cm"
                                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minSnowDepth' : 'maxSnowDepth', val)}
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Damages & Victims - Avalanche Only */}
                            {view === 'avalanches' && (
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-widest">
                                        Daune & Victime
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {[
                                            { key: 'hasCaught', label: 'Persoane Prinse', icon: Users },
                                            { key: 'hasPartially', label: 'Parțial Îngropate', icon: AlertTriangle },
                                            { key: 'hasFully', label: 'Complet Îngropate', icon: HelpCircle },
                                            { key: 'hasInjured', label: 'Persoane Rănite', icon: Heart },
                                            { key: 'hasKilled', label: 'Persoane Decedate', icon: ShieldAlert },
                                            { key: 'hasMaterial', label: 'Daune Materiale', icon: HomeIcon }
                                        ].map(flag => (
                                            <button
                                                key={flag.key}
                                                type="button"
                                                onClick={() => handleFilterChange(flag.key, !filters[flag.key])}
                                                className={`px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all duration-300 border ${filters[flag.key]
                                                        ? 'bg-accent-red/15 border-accent-red/50 text-accent-red shadow-lg shadow-accent-red/10'
                                                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                            >
                                                <flag.icon size={18} /> {flag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-6 border-t border-white/10">
                            {!isDataEngineer && (
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-4 px-8 rounded-xl font-black uppercase tracking-wider text-sm shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw size={20} className="animate-spin" />
                                            Se încarcă...
                                        </>
                                    ) : (
                                        <>
                                            <Filter size={20} />
                                            Aplică Filtre
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-8 py-4 rounded-xl border border-white/20 bg-white/5 text-white/80 font-bold uppercase text-sm tracking-wider hover:bg-accent-red/10 hover:border-accent-red/50 hover:text-accent-red transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <X size={18} />
                                Resetare
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowExportOptions(!showExportOptions)}
                                className={`px-8 py-4 rounded-xl border font-black uppercase text-sm tracking-wider transition-all duration-300 flex items-center justify-center gap-3 ${showExportOptions ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'}`}
                            >
                                <Download size={18} />
                                Export
                                <ChevronDown size={14} className={`transition-transform duration-300 ${showExportOptions ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Horizontal Export Options */}
                        {showExportOptions && (
                            <div className="pt-8 border-t border-white/5 animate-in slide-in-from-top-4 duration-500">
                                <div className="text-center mb-6">
                                    <h4 className="text-xs font-black text-white/30 uppercase tracking-[0.3em]">Exportă Rezultatele</h4>
                                </div>
                                <div className="flex flex-row gap-4 items-stretch">
                                    {[
                                        { id: 'csv', name: 'CSV', icon: FileSpreadsheet, color: 'text-accent-green', bg: 'bg-accent-green/5', border: 'border-accent-green/20' },
                                        { id: 'json', name: 'JSON', icon: FileJson, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
                                        { id: 'xml', name: 'XML', icon: FileCode, color: 'text-orange-400', bg: 'bg-orange-400/5', border: 'border-orange-400/20' }
                                    ].map(format => (
                                        <button
                                            key={format.id}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleExport(format.id)}
                                            className={`flex-1 relative group/item flex flex-col items-center justify-center py-4 px-3 rounded-2xl border ${format.bg} ${format.border} transition-all duration-300 hover:scale-[1.02] hover:bg-white/5 hover:border-white/20 shadow-xl ${loading && exportingFormat !== format.id ? 'opacity-50' : ''}`}
                                        >
                                            <div className={`${format.color} mb-2 group-hover/item:scale-110 transition-transform duration-300`}>
                                                {exportingFormat === format.id ? (
                                                    <RefreshCw size={20} className="animate-spin" />
                                                ) : (
                                                    <format.icon size={20} />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black text-white/80 group-hover/item:text-white transition-colors uppercase tracking-widest">{format.name}</span>
                                            
                                            {exportingFormat === format.id && (
                                                <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                                                    <RefreshCw size={18} className="animate-spin text-primary" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </section>

                {/* Results Section */}
                <main className="space-y-8 animate-in fade-in duration-1000">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 pb-6 border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                                {loading ? (
                                    <RefreshCw className="animate-spin text-primary" size={24} />
                                ) : (
                                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                                )}
                                <span className="text-primary">{totalElements}</span>
                                <span className="text-text-muted font-medium text-base md:text-xl">rezultate găsite</span>
                            </h3>
                        </div>

                        <div className="flex gap-1 bg-white/5 rounded-xl border border-white/10 p-1.5 shadow-lg">
                            {[
                                { id: 'grid', icon: LayoutGrid },
                                { id: 'list', icon: ListIcon }
                            ].map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => setLayout(l.id)}
                                    className={`p-2.5 rounded-lg transition-all duration-300 ${layout === l.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <l.icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`grid gap-6 ${layout === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {results.map(item => (
                            <div key={item.id} className="card glass hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col h-full bg-glass-bg shadow-2xl p-6">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>

                                <div className="flex justify-between items-start mb-6 relative z-10 w-full">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap shadow-sm ${item.status === 'VALIDATED'
                                            ? 'bg-accent-green/20 text-accent-green border border-accent-green/20'
                                            : 'bg-primary/20 text-primary border border-primary/20'
                                        }`}>
                                        {item.status === 'VALIDATED' ? 'Validat' : 'În așteptare'}
                                    </span>
                                    <div className="flex items-center gap-2 text-[12px] text-text-muted font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                        <Calendar size={14} className="text-primary" />
                                        {new Date(item.date || item.createdAt).toLocaleDateString('ro-RO')}
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black mb-6 line-clamp-1 group-hover:text-primary transition-colors relative z-10 tracking-tight">
                                    {item.title || (view === 'conditions' ? 'Raport Vizibilitate & Zăpadă' : 'Fără titlu')}
                                </h3>

                                <div className="space-y-4 mb-8 flex-grow relative z-10">
                                    <div className="flex items-center gap-4 text-sm text-text-muted group-hover:text-white transition-all duration-300 bg-white/2 p-3 rounded-2xl border border-white/5 hover:bg-white/5">
                                        <MapPin size={20} className="text-primary shrink-0" />
                                        <span className="font-bold">{metadata.massifs.find(m => m.id === (item.massifId || item.massif?.id))?.name || item.massifName || 'Masiv necunoscut'}</span>
                                    </div>
                                    {view === 'avalanches' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center gap-3 text-xs text-text-muted p-2.5 bg-white/2 rounded-xl border border-white/5">
                                                    <Activity size={16} className="text-primary/70 shrink-0" />
                                                    <span>Mărime: <b className="text-white">{item.size || 'N/A'}</b></span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-text-muted p-2.5 bg-white/2 rounded-xl border border-white/5">
                                                    <Compass size={16} className="text-primary/70 shrink-0" />
                                                    <span>Orientare: <b className="text-white">{metadata.orientations.find(o => o.id === item.orientationId)?.direction || '--'}</b></span>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-[10px] text-text-muted flex items-center gap-2">
                                                <Shield size={12} className="text-primary/50" />
                                                <span>Echip.: <b className="text-white">{item.safetyEquipment || 'N/A'}</b></span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center gap-3 text-xs text-text-muted p-2.5 bg-white/2 rounded-xl border border-white/5">
                                                    <Wind size={18} className="text-primary shrink-0" />
                                                    <span>Vânt: <b className="text-white">{item.windSpeed || 0} km/h</b></span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-text-muted p-2.5 bg-white/2 rounded-xl border border-white/5">
                                                    <Info size={18} className="text-primary shrink-0" />
                                                    <span>Zăpadă: <b className="text-white">{item.snowDepth || 0} cm</b></span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto relative z-10">
                                    <Link
                                        to={`/${view === 'avalanches' ? 'avalanche' : 'conditions'}/${item.id}`}
                                        className="text-[10px] font-black text-primary flex items-center gap-2 hover:gap-3 transition-all uppercase tracking-[0.3em] group/link px-4 py-2 hover:bg-primary/10 rounded-xl"
                                    >
                                        Vezi Detalii <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                                    </Link>

                                    {item.damagesAndVictims?.personsKilled > 0 && (
                                        <div className="flex items-center gap-1.5 text-accent-red bg-accent-red/10 px-2 py-1 rounded text-[10px] font-bold uppercase animate-pulse">
                                            <AlertTriangle size={12} /> Fatalitate
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {results.length === 0 && !loading && (
                        <div className="card glass p-20 md:p-32 text-center space-y-8 border-dashed border-2 border-glass-border bg-white/2 rounded-3xl">
                            <Search size={64} className="mx-auto text-text-muted opacity-10" />
                            <div className="space-y-3">
                                <h3 className="text-2xl md:text-3xl font-black tracking-tight">Niciun rezultat găsit</h3>
                                <p className="text-text-muted text-sm md:text-base max-w-sm mx-auto font-medium opacity-70">
                                    Încearcă să modifici criteriile de filtrare pentru a găsi rezultate.
                                </p>
                            </div>
                            <button onClick={clearFilters} className="btn-primary px-8 md:px-12 py-3 md:py-4 rounded-2xl text-xs md:text-sm uppercase font-black tracking-wider">
                                Resetează Filtrele
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-white/10 mt-10">
                            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm">
                                <p className="text-text-muted font-bold tracking-tight">
                                    Pagina <span className="text-white bg-primary/20 px-2.5 py-1 rounded-lg">{currentPage + 1}</span> din <span className="text-white">{totalPages}</span>
                                </p>
                                <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
                                <p className="text-xs text-text-muted uppercase font-black tracking-widest">{totalElements} Total</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={currentPage === 0}
                                    className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 hover:scale-110 transition-all shadow-lg"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {[...Array(totalPages)].map((_, i) => {
                                        if (totalPages <= 5 || i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all border ${currentPage === i
                                                            ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20'
                                                            : 'bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/20 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            );
                                        } else if ((i === 1 && currentPage > 2) || (i === totalPages - 2 && currentPage < totalPages - 3)) {
                                            return <span key={i} className="px-1 text-text-muted font-black">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    disabled={currentPage === totalPages - 1}
                                    className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 hover:scale-110 transition-all shadow-lg"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SearchPage;