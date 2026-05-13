import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import avalancheService from '../services/avalancheService';
import metadataService from '../services/metadataService';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Activity, ChevronLeft, Info, Users, Shield, Ruler, Maximize, Thermometer, Edit, Trash2, ShieldCheck, RefreshCw, Mountain } from 'lucide-react';

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
        types: [],
        causes: [],
        orientations: []
    });

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
                
                // Update the avalanche with the new link first
                await avalancheService.update(id, { ...avalanche, link: newLink });
                // Refresh local state so the sync process has it
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
                const [data, massifs, types, causes, orientations] = await Promise.all([
                    avalancheService.getById(id),
                    metadataService.getMassifs(),
                    metadataService.getTypes(),
                    metadataService.getCauses(),
                    metadataService.getOrientations()
                ]);
                setAvalanche(data);
                setMetadata({ massifs, types, causes, orientations });
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
            <div className="text-primary animate-pulse">Se încarcă detaliile evenimentului...</div>
        </div>
    );

    if (!avalanche) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Evenimentul nu a fost găsit.</h2>
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
                <ChevronLeft size={20} /> Înapoi la Acasă
            </Link>
        </div>
    );

    const massifName = metadata.massifs.find(m => m.id === avalanche.massifId)?.name || 'Masiv necunoscut';
    const typeName = metadata.types.find(t => t.id === avalanche.typeId)?.name || 'Nespecificat';
    const causeName = metadata.causes.find(c => c.id === avalanche.causeId)?.description || 'Nespecificat';
    const orientationName = metadata.orientations.find(o => o.id === avalanche.orientationId)?.direction || 'N/A';


    return (
        <div className="container space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-glass-bg rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold">{avalanche.title}</h1>
                        <div className="flex items-center gap-3 text-text-muted mt-1">
                            <span className="flex items-center gap-1 text-sm"><Calendar size={14} /> {new Date(avalanche.date).toLocaleDateString('ro-RO')}</span>
                            <span className="flex items-center gap-1 text-sm"><MapPin size={14} /> {massifName}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="flex gap-2">
                        {canDelete && (
                            <button 
                                onClick={handleSync} 
                                className="btn-primary bg-indigo-500 hover:bg-indigo-600 flex items-center gap-2 py-2 px-4 shadow-lg mr-2"
                                title="Sincronizează cu sursa"
                            >
                                <RefreshCw size={20} /> <span className="hidden sm:inline">Sync</span>
                            </button>
                        )}
                        {canEdit && (
                            <Link 
                                to={`/avalanche/edit/${avalanche.id}`} 
                                className="btn-primary bg-blue-500 hover:bg-blue-600 flex items-center gap-2 py-2 px-4 shadow-lg"
                                title="Editează Avalanșă"
                            >
                                <Edit size={20} /> <span className="hidden sm:inline">Editează</span>
                            </Link>
                        )}
                        {canDelete && (
                            <button 
                                onClick={handleDelete} 
                                className="btn-primary bg-accent-red hover:bg-red-600 flex items-center gap-2 py-2 px-4 shadow-lg mr-2"
                                title="Șterge Avalanșă"
                            >
                                <Trash2 size={20} /> <span className="hidden sm:inline">Șterge</span>
                            </button>
                        )}
                        {avalanche.status === 'PENDING' && (isAdmin || isExpert || isReviewer) && (
                            <button 
                                onClick={handleValidate} 
                                className="btn-primary bg-accent-green hover:bg-green-600 flex items-center gap-2 py-2 px-4 shadow-lg mr-2"
                                title="Validează Avalanșă"
                            >
                                <ShieldCheck size={20} /> <span className="hidden sm:inline">Validează</span>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${avalanche.status === 'VALIDATED' ? 'bg-accent-green/20 text-accent-green' : 'bg-primary/20 text-primary'
                        }`}>
                            {avalanche.status === 'VALIDATED' ? 'Validat' : 'În așteptare'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Helper for rendering standard detail fields */}
            {(() => {
                const DetailField = ({ label, value, color = "text-white" }) => (
                    <div>
                        <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">{label}</label>
                        <p className={`font-medium ${color}`}>{value || "-"}</p>
                    </div>
                );
                window.DetailField = DetailField;
                return null;
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card glass p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-primary border-b border-glass-border pb-2">
                            <Info size={18} /> Clasificare
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Tip Eveniment</label>
                                <p className="font-medium">{typeName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Factor Declanșare</label>
                                <p className="font-medium">{causeName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Orientare Pantă</label>
                                <p className="font-medium">{orientationName || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Coordonate Declanșare</label>
                                <p className="text-sm font-mono">
                                    {avalanche.latitude != null ? avalanche.latitude.toFixed(4) : '-'}, 
                                    {avalanche.longitude != null ? avalanche.longitude.toFixed(4) : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Coordonate Acumulare</label>
                                <p className="text-sm font-mono text-accent-blue">
                                    {avalanche.technicalDetails?.accumLat != null ? avalanche.technicalDetails.accumLat.toFixed(4) : '-'}, 
                                    {avalanche.technicalDetails?.accumLng != null ? avalanche.technicalDetails.accumLng.toFixed(4) : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Zonă / Vale</label>
                                <p className="font-medium">{avalanche.zone || "-"}</p>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Echipament Protecție</label>
                                <p className="font-medium text-theme-secondary">{avalanche.safetyEquipment || "Nespecificat"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card glass p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-accent-red border-b border-glass-border pb-2">
                            <Users size={18} /> Victime și Pagube
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-glass-bg p-3 rounded-xl border border-glass-border">
                                <label className="text-[10px] uppercase text-text-muted block">Prinși</label>
                                <span className="text-xl font-bold">{avalanche.damagesAndVictims?.personsCaught ?? "-"}</span>
                            </div>
                            <div className="bg-glass-bg p-3 rounded-xl border border-glass-border">
                                <label className="text-[10px] uppercase text-text-muted block">Decedați</label>
                                <span className={`text-xl font-bold ${avalanche.damagesAndVictims?.personsKilled > 0 ? 'text-accent-red' : ''}`}>
                                    {avalanche.damagesAndVictims?.personsKilled ?? "-"}
                                </span>
                            </div>
                            <div className="bg-glass-bg p-3 rounded-xl border border-glass-border">
                                <label className="text-[10px] uppercase text-text-muted block">Răniți</label>
                                <span className="text-xl font-bold">{avalanche.damagesAndVictims?.personsInjured ?? "-"}</span>
                            </div>
                            <div className="bg-glass-bg p-3 rounded-xl border border-glass-border">
                                <label className="text-[10px] uppercase text-text-muted block">Total Acop.</label>
                                <span className="text-xl font-bold">{avalanche.damagesAndVictims?.personsFully ?? "-"}</span>
                            </div>
                            <div className="col-span-2 bg-glass-bg p-3 rounded-xl border border-glass-border">
                                <label className="text-[10px] uppercase text-text-muted block">Pagube Materiale</label>
                                <span className="text-lg font-bold">
                                    {avalanche.damagesAndVictims?.materialDamage ? `${avalanche.damagesAndVictims.materialDamage} unități` : "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card glass p-6 space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-accent-blue border-b border-glass-border pb-2">
                            <Users size={18} /> Raportat de
                        </h2>
                        {avalanche.guestContactInfo ? (
                            <div className="space-y-2">
                                <p className="font-bold text-primary">Vizitator Anonim</p>
                                <div className="text-sm space-y-1">
                                    <p className="text-text-muted">Nume: {avalanche.guestContactInfo.firstName} {avalanche.guestContactInfo.lastName}</p>
                                    {(isAdmin || isExpert) && (
                                        <>
                                            <p className="text-text-muted">Email: {avalanche.guestContactInfo.email}</p>
                                            <p className="text-text-muted">Tel: {avalanche.guestContactInfo.phone}</p>
                                        </>
                                    )}
                                </div>
                                {avalanche.status !== 'VALIDATED' && (
                                    <p className="text-[10px] text-text-muted italic mt-2">* Datele de contact sunt vizibile doar experților.</p>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p className="font-bold">{avalanche.visitorId ? 'Utilizator Înregistrat' : 'Anonim'}</p>
                                {avalanche.visitorId && <p className="text-sm text-text-muted">ID Vizitator: {avalanche.visitorId}</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Technical Specs */}
                    <div className="card glass p-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                            <Activity className="text-primary" size={28} /> Detalii Tehnice
                        </h2>

                        <div className="space-y-10">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase font-bold tracking-wider">
                                        <Shield size={14} /> Altitudine
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {avalanche.technicalDetails?.altitude ?? "-"} 
                                        {avalanche.technicalDetails?.altitude ? <span className="text-sm font-normal text-text-muted ml-1">m</span> : ""}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase font-bold tracking-wider">
                                        <Thermometer size={14} /> Înclinație
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {avalanche.technicalDetails?.slopeInterpolation ?? "-"}
                                        {avalanche.technicalDetails?.slopeInterpolation ? "°" : ""}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase font-bold tracking-wider">
                                        <Ruler size={14} /> Lungime
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {avalanche.technicalDetails?.trackLength ?? "-"} 
                                        {avalanche.technicalDetails?.trackLength ? <span className="text-sm font-normal text-text-muted ml-1">m</span> : ""}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase font-bold tracking-wider">
                                        <Maximize size={14} /> Mărime
                                    </div>
                                    <p className="text-2xl font-bold capitalize">{avalanche.size ?? "-"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-glass-border">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Mărime Relativă</label>
                                    <p className="font-bold text-lg">
                                        {avalanche.technicalDetails?.relativeSize ?? "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Grosime Coroană</label>
                                    <p className="font-bold text-lg">
                                        {avalanche.technicalDetails?.crownDepth ?? "-"}
                                        {avalanche.technicalDetails?.crownDepth ? " cm" : ""}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Lățime Coroană</label>
                                    <p className="font-bold text-lg">
                                        {avalanche.technicalDetails?.crownWidth ?? "-"}
                                        {avalanche.technicalDetails?.crownWidth ? " m" : ""}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Cădere Verticală</label>
                                    <p className="font-bold text-lg">
                                        {avalanche.technicalDetails?.verticalDrop ?? "-"}
                                        {avalanche.technicalDetails?.verticalDrop ? " m" : ""}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Arie Acumulare</label>
                                    <p className="font-bold text-lg">
                                        {avalanche.technicalDetails?.accumulationArea ?? "-"}
                                        {avalanche.technicalDetails?.accumulationArea ? " m²" : ""}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1">Cădere Runout</label>
                                    <p className="font-bold text-lg">
                                        {avalanche.technicalDetails?.runoutVerticalDrop ?? "-"}
                                        {avalanche.technicalDetails?.runoutVerticalDrop ? " m" : ""}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                <h3 className="font-bold mb-2 flex items-center gap-2 text-primary">
                                    <Info size={18} /> Observații Zăpadă
                                </h3>
                                <p className="text-text-muted leading-relaxed">
                                    {avalanche.technicalDetails?.crownDepthText || "Nu există observații specifice pentru stratul de zăpadă."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Images Section */}
                    {avalanche.imageUrls && avalanche.imageUrls.length > 0 && (
                        <div className="card glass p-8">
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-8">
                                <Maximize className="text-accent-green" size={28} /> Galerie Foto
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {avalanche.imageUrls.flatMap(urlGroup => urlGroup.split(';')).filter(url => url.trim().length > 0).map((url, idx) => {
                                    const cleanUrl = url.trim();
                                    const backendUrl = window.location.origin.includes('localhost') ? 'http://localhost:8080' : window.location.origin.replace(':8081', ':8080');
                                    const imgSrc = cleanUrl.startsWith('http') ? cleanUrl : `${backendUrl}${cleanUrl}`;
                                    
                                    return (
                                        <div key={idx} className="relative group overflow-hidden rounded-xl border border-glass-border">
                                            <img 
                                                src={imgSrc} 
                                                alt={`Avalanșă imagine ${idx + 1}`} 
                                                className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => { e.target.src = '/placeholder-mountain.jpg'; e.target.onerror = null; }}
                                            />
                                        </div>
                                    );
                                })}
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
                    
                    <div className="h-[900px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative bg-slate-900/50 group">
                        <iframe 
                            src={`/map3d/avalanse_mapbox_demo_dropdown.html?incident=${DB_ID_TO_3D_INCIDENT[id]}`}
                            className="w-full h-full border-none"
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
    );
};

export default AvalancheDetailsPage;
