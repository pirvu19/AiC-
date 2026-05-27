import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, Activity, Shield, Users, RefreshCw, X, SlidersHorizontal, ChevronRight, ChevronLeft, LayoutGrid, List as ListIcon, CloudRain, Wind, Info, AlertTriangle, HelpCircle, Heart, ShieldAlert, Home as HomeIcon, Compass, ArrowRight, ChevronDown, FileSpreadsheet, FileJson, FileCode, Mountain, Thermometer, Eye, Layers } from 'lucide-react';
import avalancheService from '../services/avalancheService';
import conditionsService from '../services/conditionsService';
import { Download } from 'lucide-react';
import metadataService from '../services/metadataService';
import MultiSelect from '../components/MultiSelect';
import CompassFilter from '../components/CompassFilter';
import RangeSlider from '../components/RangeSlider';
import SingleSlider from '../components/SingleSlider';
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

/* ─── Collapsible Filter Section ─── */
const FilterSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="search-filter-section">
            <button
                type="button"
                onClick={() => setIsOpen(o => !o)}
                className="search-filter-section-header"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="search-filter-icon-wrap">
                        <Icon size={15} />
                    </div>
                    <span>{title}</span>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        opacity: 0.5
                    }}
                />
            </button>
            <div
                className="search-filter-section-body"
                style={{
                    maxHeight: isOpen ? '2000px' : '0',
                    opacity: isOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
                    paddingTop: isOpen ? '20px' : '0'
                }}
            >
                {children}
            </div>
        </div>
    );
};

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

    /* ─── Compute active filter count for the pills summary ─── */
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.title) count++;
        if (filters.safetyEquipment) count++;
        if (filters.regionId.length > 0) count++;
        if (filters.massifId.length > 0) count++;
        if (filters.causeId.length > 0) count++;
        if (filters.typeId.length > 0) count++;
        if (filters.orientationId.length > 0) count++;
        if (filters.startDate || filters.endDate) count++;
        if (filters.relativeSize) count++;
        if (filters.windDirection.length > 0) count++;
        if (filters.visibility.length > 0) count++;
        if (filters.hasCaught || filters.hasPartially || filters.hasFully || filters.hasInjured || filters.hasKilled || filters.hasMaterial) count++;
        if (filters.minAltitude > 0 || filters.maxAltitude < 3000) count++;
        if (filters.minSlope > 0) count++;
        if (filters.minTrackLength > 0 || filters.maxTrackLength < 2000) count++;
        if (filters.minCrownDepth > 0 || filters.maxCrownDepth < 300) count++;
        if (filters.minCrownWidth > 0 || filters.maxCrownWidth < 500) count++;
        if (filters.minVerticalDrop > 0 || filters.maxVerticalDrop < 1500) count++;
        if (filters.minTemperature > -30 || filters.maxTemperature < 30) count++;
        if (filters.minWindSpeed > 0 || filters.maxWindSpeed < 150) count++;
        if (filters.minSnowDepth > 0 || filters.maxSnowDepth < 500) count++;
        return count;
    }, [filters]);

    return (
        <div className="search-page-root">
            {/* ─── Decorative Background ─── */}
            <div className="search-page-bg-decor">
                <div className="search-bg-orb search-bg-orb-1" />
                <div className="search-bg-orb search-bg-orb-2" />
                <div className="search-bg-orb search-bg-orb-3" />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: '8rem' }}>

                {/* ═══════════════ HEADER ═══════════════ */}
                <header className="search-page-header">
                    <div className="search-header-badge">
                        <Search size={13} />
                        <span>EXPLORARE AVANSATĂ</span>
                    </div>
                    <h1 className="search-header-title">
                        Căutare &amp; Filtrare
                    </h1>
                    <p className="search-header-subtitle">
                        Explorează baza de date {view === 'avalanches' ? 'avalanșelor' : 'condițiilor'} din Carpați
                    </p>

                    {/* View Toggle */}
                    <div className="search-view-toggle-wrap">
                        <div className="search-view-toggle">
                            <button
                                onClick={() => setView('avalanches')}
                                className={`search-view-btn ${view === 'avalanches' ? 'active' : ''}`}
                            >
                                <AlertTriangle size={16} />
                                Avalanșe
                            </button>
                            <button
                                onClick={() => setView('conditions')}
                                className={`search-view-btn ${view === 'conditions' ? 'active' : ''}`}
                            >
                                <CloudRain size={16} />
                                Condiții
                            </button>
                        </div>
                    </div>

                    {/* Page size + active filters summary */}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', paddingTop: '8px', flexWrap: 'wrap' }}>
                        <div className="search-page-size-pill">
                            <span>Rezultate:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', outline: 'none' }}
                            >
                                {[10, 20, 50, 100].map(val => <option key={val} value={val} style={{ background: '#0f172a' }}>{val}</option>)}
                            </select>
                        </div>
                        {activeFilterCount > 0 && (
                            <div className="search-active-filters-pill" onClick={clearFilters} title="Click pentru a reseta toate filtrele">
                                <Filter size={13} />
                                <span>{activeFilterCount} {activeFilterCount === 1 ? 'filtru activ' : 'filtre active'}</span>
                                <X size={13} style={{ opacity: 0.6 }} />
                            </div>
                        )}
                    </div>
                </header>

                {/* ═══════════════ FILTER PANEL ═══════════════ */}
                <section style={{ marginTop: '2rem' }}>
                    <form onSubmit={handleSearch} className="search-filter-panel">

                        {/* ── Search Bar ── */}
                        <div className="search-bar-wrapper">
                            <Search className="search-bar-icon" size={20} />
                            <input
                                name="title"
                                value={filters.title}
                                onChange={(e) => handleFilterChange('title', e.target.value)}
                                placeholder="Caută în titluri, masive, locații..."
                                className="search-bar-input"
                            />
                            {filters.title && (
                                <button type="button" onClick={() => handleFilterChange('title', '')} className="search-bar-clear">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* ── Safety Equipment (avalanches only) ── */}
                        {view === 'avalanches' && (
                            <div className="search-bar-wrapper" style={{ marginTop: '12px' }}>
                                <Shield className="search-bar-icon" size={20} />
                                <input
                                    name="safetyEquipment"
                                    value={filters.safetyEquipment}
                                    onChange={(e) => handleFilterChange('safetyEquipment', e.target.value)}
                                    placeholder="Echipament protecție: DVA, sondă, lopată..."
                                    className="search-bar-input"
                                />
                                {filters.safetyEquipment && (
                                    <button type="button" onClick={() => handleFilterChange('safetyEquipment', '')} className="search-bar-clear">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Divider ── */}
                        <div className="search-filter-divider" />

                        {/* ── Location Filters ── */}
                        <FilterSection title="Localizare" icon={MapPin} defaultOpen={true}>
                            {/* Region */}
                            <div style={{ marginBottom: '20px' }}>
                                <label className="search-filter-label">Regiune</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                                            className={`search-chip-btn ${filters.regionId.includes(r.id) ? 'active' : ''}`}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Massif */}
                            <div>
                                <label className="search-filter-label">Masiv Muntos</label>
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
                        </FilterSection>

                        {/* ── Avalanche-specific Filters ── */}
                        {view === 'avalanches' && (
                            <FilterSection title="Tip & Cauză Avalanșă" icon={Activity} defaultOpen={true}>
                                {/* Cause */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label className="search-filter-label">Cauza Avalanșei</label>
                                    <MultiSelect
                                        options={metadata.causes && metadata.causes.length > 0 ? metadata.causes : CAUSE_OPTIONS}
                                        value={filters.causeId}
                                        onChange={(val) => handleFilterChange('causeId', val)}
                                        placeholder="Selectează cauzele..."
                                    />
                                </div>

                                {/* Type */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label className="search-filter-label">Tip Avalanșă</label>
                                    <MultiSelect
                                        options={metadata.types.length > 0 ? metadata.types : TYPE_OPTIONS}
                                        value={filters.typeId}
                                        onChange={(val) => handleFilterChange('typeId', val)}
                                        placeholder="Selectează tipul..."
                                    />
                                </div>

                                {/* Orientation */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="search-filter-label" style={{ textAlign: 'center', width: '100%' }}>
                                        Orientare Pantă
                                    </label>
                                    <CompassFilter 
                                        value={filters.orientationId}
                                        onChange={(val) => handleFilterChange('orientationId', val)}
                                    />
                                </div>
                            </FilterSection>
                        )}

                        {/* ── Conditions-specific Filters ── */}
                        {view === 'conditions' && (
                            <FilterSection title="Condiții Meteo" icon={CloudRain} defaultOpen={true}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label className="search-filter-label">Vizibilitate</label>
                                    <MultiSelect
                                        options={VISIBILITY_OPTIONS}
                                        value={filters.visibility}
                                        onChange={(val) => handleFilterChange('visibility', val)}
                                        placeholder="Selectează vizibilitatea..."
                                    />
                                </div>

                                <div>
                                    <label className="search-filter-label">Direcție Vânt</label>
                                    <MultiSelect
                                        options={WIND_DIRECTIONS}
                                        value={filters.windDirection}
                                        onChange={(val) => handleFilterChange('windDirection', val)}
                                        placeholder="Selectează direcția..."
                                    />
                                </div>
                            </FilterSection>
                        )}

                        {/* ── Date Interval ── */}
                        <FilterSection title="Interval Temporal" icon={Calendar} defaultOpen={true}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px' }}>
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
                                        className="search-chip-btn"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="search-date-input"
                                />
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="search-date-input"
                                />
                            </div>
                        </FilterSection>

                        {/* ── Technical Details / Sliders ── */}
                        <FilterSection title={view === 'avalanches' ? 'Parametri Tehnici' : 'Parametri Condiții'} icon={SlidersHorizontal} defaultOpen={false}>
                            {view === 'avalanches' && (
                                <div style={{ marginBottom: '24px' }}>
                                    <label className="search-filter-label">Mărime Avalanșă</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {['mica', 'medie', 'mare'].map(sz => (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => handleFilterChange('relativeSize', filters.relativeSize === sz ? '' : sz)}
                                                className={`search-size-btn ${filters.relativeSize === sz ? 'active' : ''}`}
                                            >
                                                {sz === 'mica' && '🔹'} {sz === 'medie' && '🔶'} {sz === 'mare' && '🔴'} {sz.charAt(0).toUpperCase() + sz.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                                <RangeSlider 
                                    label="Altitudine" min={0} max={3000} step={50} minVal={filters.minAltitude} maxVal={filters.maxAltitude} suffix="m"
                                    onChange={(type, val) => handleFilterChange(type === 'min' ? 'minAltitude' : 'maxAltitude', val)}
                                />
                                
                                {view === 'avalanches' ? (
                                    <>
                                        <SingleSlider 
                                            label="Înclinație Pantă" min={0} max={60} step={1} value={filters.minSlope} suffix="°"
                                            onChange={(val) => handleFilterChange('minSlope', val)}
                                        />
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
                        </FilterSection>

                        {/* ── Damages & Victims (avalanches only) ── */}
                        {view === 'avalanches' && (
                            <FilterSection title="Daune & Victime" icon={AlertTriangle} defaultOpen={false}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {[
                                        { key: 'hasCaught', label: 'Persoane Prinse', icon: Users, color: '#f59e0b' },
                                        { key: 'hasPartially', label: 'Parțial Îngropate', icon: AlertTriangle, color: '#f97316' },
                                        { key: 'hasFully', label: 'Complet Îngropate', icon: HelpCircle, color: '#ef4444' },
                                        { key: 'hasInjured', label: 'Persoane Rănite', icon: Heart, color: '#ec4899' },
                                        { key: 'hasKilled', label: 'Persoane Decedate', icon: ShieldAlert, color: '#dc2626' },
                                        { key: 'hasMaterial', label: 'Daune Materiale', icon: HomeIcon, color: '#8b5cf6' }
                                    ].map(flag => (
                                        <button
                                            key={flag.key}
                                            type="button"
                                            onClick={() => handleFilterChange(flag.key, !filters[flag.key])}
                                            className={`search-damage-btn ${filters[flag.key] ? 'active' : ''}`}
                                            style={filters[flag.key] ? { borderColor: flag.color + '80', background: flag.color + '15', color: flag.color } : {}}
                                        >
                                            <flag.icon size={16} />
                                            <span>{flag.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>
                        )}

                        {/* ── Action Buttons ── */}
                        <div className="search-actions-bar">
                            {!isDataEngineer && (
                                <button
                                    type="submit"
                                    className="search-action-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin" />
                                            Se încarcă...
                                        </>
                                    ) : (
                                        <>
                                            <Search size={18} />
                                            Caută
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="search-action-reset"
                            >
                                <X size={16} />
                                Resetare
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowExportOptions(!showExportOptions)}
                                className={`search-action-export ${showExportOptions ? 'active' : ''}`}
                            >
                                <Download size={16} />
                                Export
                                <ChevronDown size={14} style={{ transition: 'transform 0.3s', transform: showExportOptions ? 'rotate(180deg)' : 'none' }} />
                            </button>
                        </div>

                        {/* ── Export Options ── */}
                        {showExportOptions && (
                            <div className="search-export-panel">
                                <p className="search-export-title">Exportă Rezultatele</p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {[
                                        { id: 'csv', name: 'CSV', icon: FileSpreadsheet, color: '#22c55e' },
                                        { id: 'json', name: 'JSON', icon: FileJson, color: '#3b82f6' },
                                        { id: 'xml', name: 'XML', icon: FileCode, color: '#f97316' }
                                    ].map(format => (
                                        <button
                                            key={format.id}
                                            type="button"
                                            disabled={loading}
                                            onClick={() => handleExport(format.id)}
                                            className="search-export-btn"
                                            style={{ '--export-color': format.color }}
                                        >
                                            {exportingFormat === format.id ? (
                                                <RefreshCw size={20} className="animate-spin" style={{ color: format.color }} />
                                            ) : (
                                                <format.icon size={20} style={{ color: format.color }} />
                                            )}
                                            <span>{format.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </section>

                {/* ═══════════════ RESULTS ═══════════════ */}
                <main style={{ marginTop: '2.5rem' }}>
                    {/* Results Header */}
                    <div className="search-results-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {loading ? (
                                <RefreshCw className="animate-spin" size={22} style={{ color: 'var(--primary)' }} />
                            ) : (
                                <div className="search-results-dot" />
                            )}
                            <h3 className="search-results-count">
                                <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{totalElements}</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1rem', marginLeft: '8px' }}>rezultate găsite</span>
                            </h3>
                        </div>

                        <div className="search-layout-toggle">
                            {[
                                { id: 'grid', icon: LayoutGrid },
                                { id: 'list', icon: ListIcon }
                            ].map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => setLayout(l.id)}
                                    className={`search-layout-btn ${layout === l.id ? 'active' : ''}`}
                                >
                                    <l.icon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Loading Skeleton */}
                    {loading && results.length === 0 && (
                        <div className={`search-results-grid ${layout === 'grid' ? 'grid-view' : 'list-view'}`}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="search-skeleton-card">
                                    <div className="search-skeleton-line" style={{ width: '40%', height: '12px' }} />
                                    <div className="search-skeleton-line" style={{ width: '70%', height: '20px', marginTop: '16px' }} />
                                    <div className="search-skeleton-line" style={{ width: '90%', height: '14px', marginTop: '12px' }} />
                                    <div className="search-skeleton-line" style={{ width: '60%', height: '14px', marginTop: '8px' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results Grid */}
                    <div className={`search-results-grid ${layout === 'grid' ? 'grid-view' : 'list-view'}`}>
                        {results.map(item => (
                            <div key={item.id} className="search-result-card">
                                {/* Gradient top border accent */}
                                <div className="search-card-accent" />

                                {/* Card header */}
                                <div className="search-card-header">
                                    <span className={`search-card-status ${item.status === 'VALIDATED' ? 'validated' : 'pending'}`}>
                                        {item.status === 'VALIDATED' ? '✓ Validat' : '⏳ În așteptare'}
                                    </span>
                                    <div className="search-card-date">
                                        <Calendar size={13} />
                                        {new Date(item.date || item.createdAt).toLocaleDateString('ro-RO')}
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="search-card-title">
                                    {item.title || (view === 'conditions' ? 'Raport Vizibilitate & Zăpadă' : 'Fără titlu')}
                                </h3>

                                {/* Card body */}
                                <div className="search-card-body">
                                    <div className="search-card-info-row">
                                        <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                        <span>{metadata.massifs.find(m => m.id === (item.massifId || item.massif?.id))?.name || item.massifName || 'Masiv necunoscut'}</span>
                                    </div>
                                    {view === 'avalanches' ? (
                                        <>
                                            <div className="search-card-details-grid">
                                                <div className="search-card-detail">
                                                    <Activity size={14} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                                                    <span>Mărime: <strong>{item.size || 'N/A'}</strong></span>
                                                </div>
                                                <div className="search-card-detail">
                                                    <Compass size={14} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                                                    <span>Orientare: <strong>{metadata.orientations.find(o => o.id === item.orientationId)?.direction || '--'}</strong></span>
                                                </div>
                                            </div>
                                            <div className="search-card-equip">
                                                <Shield size={12} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                                                <span>Echip.: <strong>{item.safetyEquipment || 'N/A'}</strong></span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="search-card-details-grid">
                                            <div className="search-card-detail">
                                                <Wind size={14} style={{ color: 'var(--primary)' }} />
                                                <span>Vânt: <strong>{item.windSpeed || 0} km/h</strong></span>
                                            </div>
                                            <div className="search-card-detail">
                                                <Layers size={14} style={{ color: 'var(--primary)' }} />
                                                <span>Zăpadă: <strong>{item.snowDepth || 0} cm</strong></span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card footer */}
                                <div className="search-card-footer">
                                    <Link
                                        to={`/${view === 'avalanches' ? 'avalanche' : 'conditions'}/${item.id}`}
                                        className="search-card-link"
                                    >
                                        Vezi Detalii <ArrowRight size={14} className="search-card-link-arrow" />
                                    </Link>

                                    {item.damagesAndVictims?.personsKilled > 0 && (
                                        <div className="search-card-fatal-badge">
                                            <AlertTriangle size={12} /> Fatalitate
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {results.length === 0 && !loading && (
                        <div className="search-empty-state">
                            <div className="search-empty-icon">
                                <Search size={48} />
                            </div>
                            <h3>Niciun rezultat găsit</h3>
                            <p>Încearcă să modifici criteriile de filtrare pentru a găsi rezultate.</p>
                            <button onClick={clearFilters} className="search-action-primary" style={{ marginTop: '1.5rem' }}>
                                <RefreshCw size={16} />
                                Resetează Filtrele
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="search-pagination">
                            <div className="search-pagination-info">
                                <span>Pagina <strong style={{ color: 'white', background: 'rgba(59,130,246,0.15)', padding: '2px 10px', borderRadius: '8px' }}>{currentPage + 1}</strong> din <strong style={{ color: 'white' }}>{totalPages}</strong></span>
                                <span className="search-pagination-dot" />
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}>{totalElements} Total</span>
                            </div>

                            <div className="search-pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                    disabled={currentPage === 0}
                                    className="search-pagination-btn"
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {[...Array(totalPages)].map((_, i) => {
                                        if (totalPages <= 5 || i === 0 || i === totalPages - 1 || (i >= currentPage - 1 && i <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i)}
                                                    className={`search-pagination-num ${currentPage === i ? 'active' : ''}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            );
                                        } else if ((i === 1 && currentPage > 2) || (i === totalPages - 2 && currentPage < totalPages - 3)) {
                                            return <span key={i} style={{ padding: '0 4px', color: 'var(--text-muted)', fontWeight: 900 }}>...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                    disabled={currentPage === totalPages - 1}
                                    className="search-pagination-btn"
                                >
                                    <ChevronRight size={18} />
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