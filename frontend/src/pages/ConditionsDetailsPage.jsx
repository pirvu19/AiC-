import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import conditionsService from '../services/conditionsService';
import metadataService from '../services/metadataService';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, MapPin, Calendar, Info, Cloud, Thermometer, Wind, Eye, Users, Edit, Trash2, ShieldCheck } from 'lucide-react';

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

    const handleDelete = async () => {
        if (window.confirm('Ești sigur că vrei să ștergi acest raport de condiții?')) {
            try {
                await conditionsService.delete(id);
                navigate('/search'); // Or appropriate list page
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
            <div className="text-primary animate-pulse">Se încarcă detaliile condițiilor...</div>
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

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-glass-bg rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold">Stare Condiții</h1>
                        <div className="flex items-center gap-3 text-text-muted mt-1">
                            <span className="flex items-center gap-1 text-sm"><Calendar size={14} /> {conditions.date ? new Date(conditions.date).toLocaleDateString('ro-RO') : 'Acum'}</span>
                            <span className="flex items-center gap-1 text-sm"><MapPin size={14} /> {massifName}, {regionName}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="flex gap-2">
                        {canEdit && (
                            <Link
                                to={`/conditions/edit/${conditions.id}`}
                                className="btn-primary bg-blue-500 hover:bg-blue-600 flex items-center gap-2 py-2 px-4 shadow-lg text-white"
                                title="Editează Condiții"
                            >
                                <Edit size={20} /> <span className="hidden sm:inline">Editează</span>
                            </Link>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className="btn-primary bg-accent-red hover:bg-red-600 flex items-center gap-2 py-2 px-4 shadow-lg text-white"
                                title="Șterge Condiții"
                            >
                                <Trash2 size={20} /> <span className="hidden sm:inline">Șterge</span>
                            </button>
                        )}
                        {conditions.status === 'PENDING' && (isAdmin || isExpert || isReviewer) && (
                            <button
                                onClick={handleValidate}
                                className="btn-primary bg-accent-green hover:bg-green-600 flex items-center gap-2 py-2 px-4 shadow-lg text-white"
                                title="Validează Condiții"
                            >
                                <ShieldCheck size={20} /> <span className="hidden sm:inline">Validează</span>
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${conditions.status === 'VALIDATED' ? 'bg-accent-green/20 text-accent-green' : 'bg-primary/20 text-primary'
                            }`}>
                            {conditions.status === 'VALIDATED' ? 'Validat' : 'În așteptare'}
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card glass p-8 space-y-8">
                    <h2 className="text-xl font-bold flex items-center gap-3 border-b border-glass-border pb-4">
                        <Cloud className="text-primary" size={24} /> Meteorologie
                    </h2>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-glass-bg p-6 rounded-2xl border border-glass-border flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary"><Thermometer size={24} /></div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block">Temperatură</label>
                                    <span className="text-2xl font-bold">{conditions.temperature || 'N/A'} °C</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-glass-bg p-6 rounded-2xl border border-glass-border flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary"><Wind size={24} /></div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block">Vânt (Viteză & Direcție)</label>
                                    <span className="text-xl font-bold">{conditions.windSpeed || 'N/A'} km/h - {conditions.windDirection || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-glass-bg p-6 rounded-2xl border border-glass-border flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary"><Eye size={24} /></div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-text-muted block">Vizibilitate</label>
                                    <span className="text-xl font-bold">{conditions.visibility || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card glass p-8 space-y-8">
                    <h2 className="text-xl font-bold flex items-center gap-3 border-b border-glass-border pb-4">
                        <Info className="text-primary" size={24} /> Strat de Zăpadă
                    </h2>

                    <div className="space-y-6">
                        <div className="bg-glass-bg p-6 rounded-2xl border border-glass-border">
                            <label className="text-[10px] uppercase font-bold text-text-muted block mb-2 text-center">Grosime Strat Zăpadă</label>
                            <div className="text-center">
                                <span className="text-6xl font-black text-primary">{conditions.snowDepth || 0}</span>
                                <span className="text-xl font-bold text-text-muted ml-2">cm</span>
                            </div>
                        </div>

                        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 min-h-[140px]">
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-primary text-sm uppercase">
                                <Info size={16} /> Observații Generale
                            </h3>
                            <p className="text-text-muted leading-relaxed italic">
                                "{conditions.description || 'Nu au fost furnizate observații suplimentare.'}"
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card glass p-8 space-y-4 h-fit">
                    <h2 className="text-xl font-bold flex items-center gap-3 border-b border-glass-border pb-4 text-accent-blue">
                        <Users size={24} /> Raportat de
                    </h2>
                    {conditions.guestContactInfo ? (
                        <div className="space-y-2">
                            <p className="font-bold text-primary">Vizitator Anonim</p>
                            <div className="text-sm space-y-1">
                                <p className="text-text-muted">Nume: {conditions.guestContactInfo.firstName} {conditions.guestContactInfo.lastName}</p>
                                {(isAdmin || isExpert) && (
                                    <>
                                        <p className="text-text-muted">Email: {conditions.guestContactInfo.email}</p>
                                        <p className="text-text-muted">Tel: {conditions.guestContactInfo.phone}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="font-bold">{conditions.visitorId ? 'Utilizator Înregistrat' : 'Anonim'}</p>
                            {conditions.visitorId && <p className="text-sm text-text-muted">ID Vizitator: {conditions.visitorId}</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Image Gallery */}
            {conditions.imageUrls && conditions.imageUrls.length > 0 && (
                <div className="card glass p-8 space-y-6">
                    <h2 className="text-xl font-bold border-b border-glass-border pb-4">Galerie Foto</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {conditions.imageUrls && conditions.imageUrls
                            .filter(url => url)
                            .map((url, index) => (
                                <div key={index} className="aspect-square rounded-xl overflow-hidden border border-glass-border bg-black/20">
                                    <img 
                                        src={url.startsWith('http') ? url : (url.startsWith('/') ? url : `/${url}`)} 
                                        alt={`Condiție ${index + 1}`} 
                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer"
                                    />
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionsDetailsPage;
