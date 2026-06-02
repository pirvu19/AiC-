import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import avalancheService from '../services/avalancheService';
import metadataService from '../services/metadataService';
import { useAuth } from '../context/AuthContext';
import { 
    Calendar, MapPin, Activity, ChevronLeft, ChevronRight, Info, Users, 
    Shield, Ruler, Maximize, Thermometer, Edit, Trash2, ShieldCheck, 
    RefreshCw, Mountain, Clock, X, ExternalLink 
} from 'lucide-react';

const DB_ID_TO_3D_INCIDENT = {
    "166": "balea_2025",
    "163": "incident_163",
    "133": "incident_133",
    "120": "incident_120",
    "111": "incident_111",
    "79": "incident_79",
    "25": "incident_25"
};

const AvalancheDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [avalanche, setAvalanche] = useState(null);
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState({
        massifs: [],
        regions: [],
        types: [],
        causes: [],
        orientations: []
    });

    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const { isAdmin, isExpert, isReviewer, isDataEngineer } = useAuth();
    const canEdit = isAdmin || isExpert || isReviewer;
    const canDelete = isAdmin || isDataEngineer;

    const handleValidate = async () => {
        try {
            await avalancheService.validate(id);
            const data = await avalancheService.getById(id);
            setAvalanche(data);
        } catch (err) {
            alert('Eroare la validare: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Sunteți sigur că doriți să ștergeți această avalanșă? Datele vor fi pierdute definitiv!')) {
            try {
                await avalancheService.delete(id);
                navigate('/');
            } catch (err) {
                alert('Eroare la ștergerea avalanșei: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleSync = async () => {
        try {
            if (!avalanche.link) {
                const newLink = window.prompt("Această avalanșă nu are un link sursă atașat. Introdu link-ul de pe avalanseincarpati.ro pentru a o putea sincroniza:");
                if (!newLink) return;
                
                await avalancheService.update(id, { ...avalanche, link: newLink });
                avalanche.link = newLink; 
            }

            setLoading(true);
            const report = await avalancheService.syncOne(id);
            if (report.updated > 0) {
                alert('Avalanșa a fost sincronizată și actualizată cu succes!');
                const data = await avalancheService.getById(id);
                setAvalanche(data);
            } else if (report.errors && report.errors.length > 0) {
                alert('Eroare la sincronizare: ' + report.errors.join(', '));
            } else {
                alert('Avalanșa a fost verificată, dar nu au fost găsite date noi de actualizat pe site-ul sursă.');
            }
        } catch (err) {
            alert('Eroare la sincronizare: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [data, massifs, regions, types, causes, orientations] = await Promise.all([
                    avalancheService.getById(id),
                    metadataService.getMassifs(),
                    metadataService.getRegions(),
                    metadataService.getTypes(),
                    metadataService.getCauses(),
                    metadataService.getOrientations()
                ]);
                setAvalanche(data);
                setMetadata({ massifs, regions, types, causes, orientations });
            } catch (err) {
                console.error('Error loading details:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center py-40">
            <div className="text-primary animate-pulse font-bold flex items-center gap-2">
                <RefreshCw className="animate-spin" size={20} />
                Se încarcă detaliile evenimentului...
            </div>
        </div>
    );

    if (!avalanche) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Evenimentul nu a fost găsit.</h2>
            <Link to="/" className="btn-secondary inline-flex items-center gap-2">
                <ChevronLeft size={20} /> Înapoi la Acasă
            </Link>
        </div>
    );

    const massif = metadata.massifs.find(m => m.id === avalanche.massifId);
    const massifName = massif?.name || 'Masiv necunoscut';
    const region = metadata.regions.find(r => r.id === massif?.regionId || r.id === massif?.region?.id);
    const regionName = region?.name || 'Regiune nespecificată';

    const typeName = metadata.types.find(t => t.id === avalanche.typeId)?.name || 'Nespecificat';
    const causeName = metadata.causes.find(c => c.id === avalanche.causeId)?.description || 'Nespecificat';
    const orientationName = metadata.orientations.find(o => o.id === avalanche.orientationId)?.direction || 'N/A';

    const allImages = avalanche.imageUrls 
        ? avalanche.imageUrls.flatMap(urlGroup => urlGroup.split(';')).filter(url => url.trim().length > 0).map(url => {
            const cleanUrl = url.trim();
            return cleanUrl.startsWith('http') ? cleanUrl : (cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`);
        }) 
        : [];

    return (
        <div className="details-page-root">
            <div className="search-page-bg-decor">
                <div className="search-bg-orb search-bg-orb-1"></div>
                <div className="search-bg-orb search-bg-orb-2"></div>
                <div className="search-bg-orb search-bg-orb-3"></div>
            </div>

            <div className="container relative z-10 space-y-8 animate-in fade-in duration-500">
                <header className="details-header flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start md:items-center gap-4">
                        <button onClick={() => navigate(-1)} className="details-back-btn" title="Înapoi">
                            <ChevronLeft size={22} />
                        </button>
                        <div>
                            <h1 className="details-title-gradient">{avalanche.title}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                <span className="flex items-center gap-1.5 text-xs text-text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                    <Calendar size={14} className="text-primary" /> 
                                    {new Date(avalanche.date).toLocaleDateString('ro-RO')}
                                </span>
                                {avalanche.eventTime && (
                                    <span className="flex items-center gap-1.5 text-xs text-text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                        <Clock size={14} className="text-primary" /> 
                                        {avalanche.eventTime}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-xs text-text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                    <MapPin size={14} className="text-primary" /> {regionName} / {massifName}
                                </span>
                                {avalanche.link && (
                                    <a 
                                        href={avalanche.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 hover:bg-primary/20 transition-all font-semibold"
                                        title="Vezi articolul sursă pe avalanseincarpati.ro"
                                    >
                                        <ExternalLink size={14} /> 
                                        Articol Sursă
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-2">
                            {canDelete && (
                                <button 
                                    onClick={handleSync} 
                                    className="btn-secondary flex items-center gap-2 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-500/30"
                                    title="Sincronizează cu sursa"
                                >
                                    <RefreshCw size={18} /> <span>Sync</span>
                                </button>
                            )}
                            {canEdit && (
                                <Link 
                                    to={`/avalanche/edit/${avalanche.id}`} 
                                    className="btn-secondary flex items-center gap-2 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30"
                                    title="Editează Avalanșă"
                                >
                                    <Edit size={18} /> <span>Editează</span>
                                </Link>
                            )}
                            {canDelete && (
                                <button 
                                    onClick={handleDelete} 
                                    className="btn-secondary flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                                    title="Șterge Avalanșă"
                                >
                                    <Trash2 size={18} /> <span>Șterge</span>
                                </button>
                            )}
                            {avalanche.status === 'PENDING' && (isAdmin || isExpert || isReviewer) && (
                                <button 
                                    onClick={handleValidate} 
                                    className="btn-premium bg-accent-green hover:bg-green-600 flex items-center gap-2 py-2 px-4 shadow-lg text-white"
                                    title="Validează Avalanșă"
                                >
                                    <ShieldCheck size={18} /> <span>Validează</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center">
                            <span className={`details-status-badge ${avalanche.status === 'VALIDATED' ? 'validated' : 'pending'}`}>
                                <span className={`w-2 h-2 rounded-full ${avalanche.status === 'VALIDATED' ? 'bg-accent-green' : 'bg-primary'} animate-pulse`} />
                                {avalanche.status === 'VALIDATED' ? 'Validat' : 'În așteptare'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="details-layout-grid">
                    {/* Information Sidebar */}
                    <div className="space-y-6">
                        <div className="card glass p-6 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-primary border-b border-glass-border pb-3">
                                <Info size={18} /> Clasificare Eveniment
                            </h2>
                            <div className="space-y-1">
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><MapPin size={14} className="text-primary" /> Regiune</span>
                                    <span className="sidebar-item-value">{regionName}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Mountain size={14} className="text-primary" /> Masiv Muntos</span>
                                    <span className="sidebar-item-value">{massifName}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Info size={14} className="text-primary" /> Zonă / Vale</span>
                                    <span className="sidebar-item-value">{avalanche.zone || "-"}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Clock size={14} className="text-primary" /> Ora Evenimentului</span>
                                    <span className="sidebar-item-value">{avalanche.eventTime || "-"}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Activity size={14} className="text-primary" /> Activitate</span>
                                    <span className="sidebar-item-value">{avalanche.activity || "-"}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Maximize size={14} className="text-primary" /> Mărime</span>
                                    <span className="sidebar-item-value capitalize">{avalanche.size || "-"}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Shield size={14} className="text-primary" /> Tip Eveniment</span>
                                    <span className="sidebar-item-value">{typeName || "-"}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Info size={14} className="text-primary" /> Declanșator</span>
                                    <span className="sidebar-item-value">{causeName || "-"}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Clock size={14} className="text-primary" /> Orientare Pantă</span>
                                    <span className="sidebar-item-value">{orientationName || "-"}</span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><MapPin size={14} className="text-primary" /> Lat / Lng Declanșare</span>
                                    <span className="sidebar-item-value font-mono">
                                        {avalanche.latitude != null ? avalanche.latitude.toFixed(4) : '-'}, {avalanche.longitude != null ? avalanche.longitude.toFixed(4) : '-'}
                                    </span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><MapPin size={14} className="text-primary" /> Lat / Lng Acumulare</span>
                                    <span className="sidebar-item-value font-mono text-accent-blue">
                                        {avalanche.technicalDetails?.accumLat != null ? avalanche.technicalDetails.accumLat.toFixed(4) : '-'}, {avalanche.technicalDetails?.accumLng != null ? avalanche.technicalDetails.accumLng.toFixed(4) : '-'}
                                    </span>
                                </div>
                                <div className="sidebar-list-item">
                                    <span className="sidebar-item-label"><Shield size={14} className="text-primary" /> Echipament Protecție</span>
                                    <span className="sidebar-item-value">{avalanche.safetyEquipment || "Nespecificat"}</span>
                                </div>
                                {avalanche.link && (
                                    <div className="sidebar-list-item">
                                        <span className="sidebar-item-label"><ExternalLink size={14} className="text-primary" /> Sursă Articol</span>
                                        <span className="sidebar-item-value">
                                            <a 
                                                href={avalanche.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                                            >
                                                Vezi pe blog <ExternalLink size={12} />
                                            </a>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card glass p-6 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-accent-red border-b border-glass-border pb-3">
                                <Users size={18} /> Victime și Pagube
                            </h2>
                            {(() => {
                                const hasKilledOrInjured = (avalanche.damagesAndVictims?.personsKilled > 0) || (avalanche.damagesAndVictims?.personsInjured > 0);
                                return (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="victim-widget">
                                            <label className="telemetry-label">Prinși</label>
                                            <span className="victim-value">{avalanche.damagesAndVictims?.personsCaught ?? "0"}</span>
                                        </div>
                                        <div className={`victim-widget ${avalanche.damagesAndVictims?.personsKilled > 0 ? 'danger' : ''}`}>
                                            <label className="telemetry-label">Decedați</label>
                                            <span className="victim-value">{avalanche.damagesAndVictims?.personsKilled ?? "0"}</span>
                                        </div>
                                        <div className={`victim-widget ${avalanche.damagesAndVictims?.personsInjured > 0 ? 'danger' : ''}`}>
                                            <label className="telemetry-label">Răniți</label>
                                            <span className="victim-value">{avalanche.damagesAndVictims?.personsInjured ?? "0"}</span>
                                        </div>
                                        <div className="victim-widget">
                                            <label className="telemetry-label">Total Acop.</label>
                                            <span className="victim-value">{avalanche.damagesAndVictims?.personsFully ?? "0"}</span>
                                        </div>
                                        <div className="col-span-2 victim-widget">
                                            <label className="telemetry-label">Pagube Materiale</label>
                                            <span className="text-base font-bold text-white mt-1">
                                                {avalanche.damagesAndVictims?.materialDamage ? `${avalanche.damagesAndVictims.materialDamage} unități` : "Fără pagube raportate"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="card glass p-6 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-accent-blue border-b border-glass-border pb-3">
                                <Users size={18} /> Raportat de
                            </h2>
                            {avalanche.guestContactInfo ? (
                                <div className="bg-glass-bg/40 p-4 rounded-2xl border border-glass-border space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-blue" />
                                        <p className="font-bold text-primary text-sm">Vizitator Anonim</p>
                                    </div>
                                    <div className="text-sm space-y-2 pt-2 border-t border-glass-border">
                                        <p className="text-text-muted flex justify-between">Nume: <span className="text-white font-medium">{avalanche.guestContactInfo.firstName} {avalanche.guestContactInfo.lastName}</span></p>
                                        {(isAdmin || isExpert) && (
                                            <>
                                                <p className="text-text-muted flex justify-between">Email: <span className="text-white font-medium">{avalanche.guestContactInfo.email}</span></p>
                                                <p className="text-text-muted flex justify-between">Tel: <span className="text-white font-medium">{avalanche.guestContactInfo.phone}</span></p>
                                            </>
                                        )}
                                    </div>
                                    {avalanche.status !== 'VALIDATED' && (
                                        <p className="text-[10px] text-text-muted italic mt-2">* Datele de contact sunt vizibile doar experților.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-glass-bg/40 p-4 rounded-2xl border border-glass-border space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-green" />
                                        <p className="font-bold text-white text-sm">{avalanche.visitorId ? 'Utilizator Înregistrat' : 'Anonim'}</p>
                                    </div>
                                    {avalanche.visitorId && <p className="text-xs text-text-muted">ID Vizitator: {avalanche.visitorId}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="space-y-8">
                        {/* Technical Specs */}
                        <div className="card glass p-8">
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                                <Activity className="text-primary" size={28} /> Detalii Tehnice
                            </h2>

                            <div className="space-y-10">
                                <div className="telemetry-grid">
                                    <div className="telemetry-card">
                                        <div className="telemetry-icon-wrapper primary"><Mountain size={20} /></div>
                                        <span className="telemetry-label">Altitudine</span>
                                        <span className="telemetry-value">
                                            {avalanche.technicalDetails?.altitude ?? "-"} 
                                            {avalanche.technicalDetails?.altitude ? <span className="telemetry-unit">m</span> : ""}
                                        </span>
                                    </div>
                                    <div className="telemetry-card">
                                        <div className="telemetry-icon-wrapper orange"><Thermometer size={20} /></div>
                                        <span className="telemetry-label">Înclinație</span>
                                        <span className="telemetry-value">
                                            {avalanche.technicalDetails?.slopeInterpolation ?? "-"}
                                            {avalanche.technicalDetails?.slopeInterpolation ? <span className="telemetry-unit">°</span> : ""}
                                        </span>
                                    </div>
                                    <div className="telemetry-card">
                                        <div className="telemetry-icon-wrapper cyan"><Ruler size={20} /></div>
                                        <span className="telemetry-label">Lungime</span>
                                        <span className="telemetry-value">
                                            {avalanche.technicalDetails?.trackLength ?? "-"} 
                                            {avalanche.technicalDetails?.trackLength ? <span className="telemetry-unit">m</span> : ""}
                                        </span>
                                    </div>
                                    <div className="telemetry-card">
                                        <div className="telemetry-icon-wrapper red"><Maximize size={20} /></div>
                                        <span className="telemetry-label">Mărime</span>
                                        <span className="telemetry-value capitalize text-lg font-extrabold mt-1">
                                            {avalanche.size ?? "-"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-8 border-t border-glass-border">
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-glass-border">
                                        <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Mărime Relativă (1-5)</label>
                                        <p className="font-bold text-lg text-white">
                                            {avalanche.technicalDetails?.relativeSize ?? "-"}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-glass-border">
                                        <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Grosime Coroană</label>
                                        <p className="font-bold text-lg text-white">
                                            {avalanche.technicalDetails?.crownDepth ?? "-"}
                                            {avalanche.technicalDetails?.crownDepth ? " cm" : ""}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-glass-border">
                                        <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Lățime Coroană</label>
                                        <p className="font-bold text-lg text-white">
                                            {avalanche.technicalDetails?.crownWidth ?? "-"}
                                            {avalanche.technicalDetails?.crownWidth ? " m" : ""}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-glass-border">
                                        <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Cădere Verticală</label>
                                        <p className="font-bold text-lg text-white">
                                            {avalanche.technicalDetails?.verticalDrop ?? "-"}
                                            {avalanche.technicalDetails?.verticalDrop ? " m" : ""}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-glass-border">
                                        <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Arie Acumulare</label>
                                        <p className="font-bold text-lg text-white">
                                            {avalanche.technicalDetails?.accumulationArea ?? "-"}
                                            {avalanche.technicalDetails?.accumulationArea ? " m²" : ""}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl border border-glass-border">
                                        <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Cădere Runout</label>
                                        <p className="font-bold text-lg text-white">
                                            {avalanche.technicalDetails?.runoutVerticalDrop ?? "-"}
                                            {avalanche.technicalDetails?.runoutVerticalDrop ? " m" : ""}
                                        </p>
                                    </div>
                                </div>

                                <div className="bulletin-box">
                                    <h3 className="font-bold mb-3 flex items-center gap-2 text-primary text-sm uppercase tracking-wider">
                                        <Info size={16} /> Observații Zăpadă
                                    </h3>
                                    <p className="bulletin-quote leading-relaxed">
                                        "{avalanche.technicalDetails?.crownDepthText || "Nu există observații specifice pentru stratul de zăpadă."}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Images Section */}
                        {allImages.length > 0 && (
                            <div className="card glass p-8">
                                <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                                    <Maximize className="text-accent-green" size={28} /> Galerie Foto
                                </h2>
                                <div className="gallery-grid">
                                    {allImages.map((imgSrc, idx) => (
                                        <div 
                                            key={idx} 
                                            className="gallery-card"
                                            onClick={() => {
                                                setActiveImageIndex(idx);
                                                setLightboxOpen(true);
                                            }}
                                        >
                                            <img 
                                                src={imgSrc} 
                                                alt={`Avalanșă imagine ${idx + 1}`} 
                                                className="gallery-img"
                                                onError={(e) => { e.target.src = '/placeholder-mountain.jpg'; e.target.onerror = null; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Full-width 3D Map Integration */}
                {DB_ID_TO_3D_INCIDENT[id] && (
                    <div className="w-full mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight uppercase italic">
                                    <Mountain className="text-primary" size={32} /> Reconstituire Digitală 3D
                                </h2>
                                <p className="text-text-muted text-sm font-medium mt-1">Explorare topografică interactivă a zonei de declanșare și acumulare.</p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Mapbox Terrain-RGB High-Res</span>
                            </div>
                        </div>
                        
                        <div 
                            className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative bg-slate-900/50 group"
                            style={{ height: '750px' }}
                        >
                            <iframe 
                                src={`/map3d/avalanse_mapbox_demo_dropdown.html?incident=${DB_ID_TO_3D_INCIDENT[id]}`}
                                className="w-full border-none"
                                style={{ height: '750px', display: 'block' }}
                                title="Vizualizare 3D Avalanșă"
                                allow="geolocation"
                            />
                            
                            {/* Overlay Controls Info */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="glass px-8 py-3 rounded-full border border-white/10 flex gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-white/80">
                                    <span className="flex items-center gap-2"><span className="text-primary">Click Stânga</span> Panoramare</span>
                                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                                    <span className="flex items-center gap-2"><span className="text-primary">Click Dreapta</span> Rotație 3D</span>
                                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                                    <span className="flex items-center gap-2"><span className="text-primary">Scroll</span> Zoom Altitudine</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-text-muted mt-6 text-center italic font-medium">
                            * Modelul digital al terenului (DEM) este randat în timp real pentru o precizie maximă a pantei și a traseului de curgere.
                        </p>
                    </div>
                )}
            </div>

            {/* Interactive Lightbox Modal */}
            {lightboxOpen && activeImageIndex !== null && allImages.length > 0 && (
                <div className="lightbox-modal" onClick={() => setLightboxOpen(false)}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>
                            <X size={20} />
                        </button>
                        {allImages.length > 1 && (
                            <>
                                <button 
                                    className="lightbox-prev" 
                                    onClick={() => setActiveImageIndex((activeImageIndex - 1 + allImages.length) % allImages.length)}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button 
                                    className="lightbox-next" 
                                    onClick={() => setActiveImageIndex((activeImageIndex + 1) % allImages.length)}
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </>
                        )}
                        <img 
                            src={allImages[activeImageIndex]} 
                            alt={`Avalanșă imagine ${activeImageIndex + 1}`} 
                            className="lightbox-image" 
                        />
                        <div className="lightbox-caption">
                            Imaginea {activeImageIndex + 1} din {allImages.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvalancheDetailsPage;
