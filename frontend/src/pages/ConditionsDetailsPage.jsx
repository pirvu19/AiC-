import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import conditionsService from '../services/conditionsService';
import metadataService from '../services/metadataService';
import { useAuth } from '../context/AuthContext';
import { 
    ChevronLeft, ChevronRight, MapPin, Calendar, Info, Cloud, 
    Thermometer, Wind, Eye, Users, Edit, Trash2, ShieldCheck, X 
} from 'lucide-react';

const ConditionsDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [conditions, setConditions] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAdmin, isExpert, isReviewer, isDataEngineer } = useAuth();
    const canEdit = isAdmin || isExpert || isReviewer;
    const canDelete = isAdmin || isDataEngineer;
    
    const [metadata, setMetadata] = useState({
        massifs: [],
        regions: []
    });

    const [activeImageIndex, setActiveImageIndex] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const handleDelete = async () => {
        if (window.confirm('Ești sigur că vrei să ștergi acest raport de condiții?')) {
            try {
                await conditionsService.delete(id);
                navigate('/search');
            } catch (err) {
                alert('Eroare la ștergere: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleValidate = async () => {
        try {
            await conditionsService.validate(id);
            const data = await conditionsService.getById(id);
            setConditions(data);
        } catch (err) {
            alert('Eroare la validare: ' + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [data, massifs, regions] = await Promise.all([
                    conditionsService.getById(id),
                    metadataService.getMassifs(),
                    metadataService.getRegions()
                ]);
                setConditions(data);
                setMetadata({ massifs, regions });
            } catch (err) {
                console.error('Error loading condition details:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center py-40">
            <div className="text-primary animate-pulse flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Se încarcă detaliile condițiilor...
            </div>
        </div>
    );

    if (!conditions) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Raportul de condiții nu a fost găsit.</h2>
            <Link to="/" className="btn-primary inline-flex items-center gap-2">
                <ChevronLeft size={20} /> Înapoi la Acasă
            </Link>
        </div>
    );

    const massifName = metadata.massifs.find(m => m.id === conditions.massifId)?.name || 'Masiv necunoscut';
    const regionName = metadata.regions.find(r => r.id === conditions.regionId)?.name || 'Regiune necunoscută';

    const allImages = conditions.imageUrls 
        ? conditions.imageUrls.filter(url => url).map(url => {
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
                            <h1 className="details-title-gradient">Stare Condiții</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                <span className="flex items-center gap-1.5 text-xs text-text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                    <Calendar size={14} className="text-primary" /> 
                                    {conditions.date ? new Date(conditions.date).toLocaleDateString('ro-RO') : 'Acum'}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-text-muted bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                    <MapPin size={14} className="text-primary" /> {massifName}, {regionName}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-2">
                            {canEdit && (
                                <Link
                                    to={`/conditions/edit/${conditions.id}`}
                                    className="btn-secondary flex items-center gap-2 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30"
                                    title="Editează Condiții"
                                >
                                    <Edit size={18} /> <span>Editează</span>
                                </Link>
                            )}
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="btn-secondary flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                                    title="Șterge Condiții"
                                >
                                    <Trash2 size={18} /> <span>Șterge</span>
                                </button>
                            )}
                            {conditions.status === 'PENDING' && (isAdmin || isExpert || isReviewer) && (
                                <button
                                    onClick={handleValidate}
                                    className="btn-premium bg-accent-green hover:bg-green-600 flex items-center gap-2 py-2 px-4 shadow-lg text-white"
                                    title="Validează Condiții"
                                >
                                    <ShieldCheck size={18} /> <span>Validează</span>
                                </button>
                            )}
                        </div>
                        <div className="flex items-center">
                            <span className={`details-status-badge ${conditions.status === 'VALIDATED' ? 'validated' : 'pending'}`}>
                                <span className={`w-2 h-2 rounded-full ${conditions.status === 'VALIDATED' ? 'bg-accent-green' : 'bg-primary'} animate-pulse`} />
                                {conditions.status === 'VALIDATED' ? 'Validat' : 'În așteptare'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="details-layout-grid-reverse">
                    {/* Left & Middle Column */}
                    <div className="space-y-8">
                        {/* Meteorology specs */}
                        <div className="card glass p-8 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-3 border-b border-glass-border pb-4">
                                <Cloud className="text-primary" size={24} /> Specificații Meteorologice
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="telemetry-card">
                                    <div className="telemetry-icon-wrapper orange"><Thermometer size={20} /></div>
                                    <span className="telemetry-label">Temperatură</span>
                                    <span className="telemetry-value">
                                        {conditions.temperature || '0'} 
                                        <span className="telemetry-unit">°C</span>
                                    </span>
                                </div>

                                <div className="telemetry-card">
                                    <div className="telemetry-icon-wrapper cyan"><Wind size={20} /></div>
                                    <span className="telemetry-label">Vânt</span>
                                    <span className="telemetry-value text-base font-extrabold mt-1">
                                        {conditions.windSpeed ? `${conditions.windSpeed} km/h` : 'N/A'}
                                        {conditions.windDirection ? ` - ${conditions.windDirection}` : ''}
                                    </span>
                                </div>

                                <div className="telemetry-card">
                                    <div className="telemetry-icon-wrapper purple"><Eye size={20} /></div>
                                    <span className="telemetry-label">Vizibilitate</span>
                                    <span className="telemetry-value text-base font-extrabold mt-1 text-white">
                                        {conditions.visibility || 'Nespecificată'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Snow Depth & Observations */}
                        <div className="card glass p-8 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-3 border-b border-glass-border pb-4">
                                <Info className="text-primary" size={24} /> Strat de Zăpadă & Observații
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                                <div className="bg-white/5 p-6 rounded-2xl border border-glass-border flex flex-col justify-center items-center text-center">
                                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-2">Grosime Strat</label>
                                    <div className="flex items-baseline">
                                        <span className="text-5xl font-black text-primary">{conditions.snowDepth || 0}</span>
                                        <span className="text-lg font-bold text-text-muted ml-1">cm</span>
                                    </div>
                                </div>

                                <div className="md:col-span-2 bulletin-box flex flex-col justify-center">
                                    <h3 className="font-bold mb-2 flex items-center gap-2 text-primary text-xs uppercase tracking-wider">
                                        <Info size={16} /> Observații Generale
                                    </h3>
                                    <p className="bulletin-quote leading-relaxed">
                                        "{conditions.description || 'Nu au fost furnizate observații suplimentare.'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Reporter Card */}
                        <div className="card glass p-6 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-accent-blue border-b border-glass-border pb-3">
                                <Users size={18} /> Raportat de
                            </h2>
                            {conditions.guestContactInfo ? (
                                <div className="bg-glass-bg/40 p-4 rounded-2xl border border-glass-border space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-blue" />
                                        <p className="font-bold text-primary text-sm">Vizitator Anonim</p>
                                    </div>
                                    <div className="text-sm space-y-2 pt-2 border-t border-glass-border">
                                        <p className="text-text-muted flex justify-between">Nume: <span className="text-white font-medium">{conditions.guestContactInfo.firstName} {conditions.guestContactInfo.lastName}</span></p>
                                        {(isAdmin || isExpert) && (
                                            <>
                                                <p className="text-text-muted flex justify-between">Email: <span className="text-white font-medium">{conditions.guestContactInfo.email}</span></p>
                                                <p className="text-text-muted flex justify-between">Tel: <span className="text-white font-medium">{conditions.guestContactInfo.phone}</span></p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-glass-bg/40 p-4 rounded-2xl border border-glass-border space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-green" />
                                        <p className="font-bold text-white text-sm">{conditions.visitorId ? 'Utilizator Înregistrat' : 'Anonim'}</p>
                                    </div>
                                    {conditions.visitorId && <p className="text-xs text-text-muted">ID Vizitator: {conditions.visitorId}</p>}
                                </div>
                            )}
                        </div>

                        {/* Image Gallery */}
                        {allImages.length > 0 && (
                            <div className="card glass p-6 space-y-4">
                                <h2 className="text-lg font-bold border-b border-glass-border pb-3 flex items-center gap-2 text-accent-green">
                                    <Eye size={18} /> Galerie Foto
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
                                                alt={`Condiție imagine ${idx + 1}`} 
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
                            alt={`Condiție imagine ${activeImageIndex + 1}`} 
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

export default ConditionsDetailsPage;
