import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import avalancheService from '../services/avalancheService';
import conditionsService from '../services/conditionsService';
import { ShieldCheck, Trash2, Calendar, MapPin, AlertCircle, Users, Search, AlertTriangle, CloudRain, Edit, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const ValidationPanel = () => {
    const { isAdmin, isDataEngineer, isExpert, isReviewer } = useAuth();
    const [activeTab, setActiveTab] = useState('avalanches');
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        loadPending();
    }, [activeTab]);

    const loadPending = async () => {
        try {
            setLoading(true);
            let response;
            if (activeTab === 'avalanches') {
                response = await avalancheService.search({ 
                    status: 'PENDING',
                    page: 0, 
                    size: 100, 
                    sort: 'id,desc' 
                });
            } else {
                response = await conditionsService.getPending({
                    page: 0,
                    size: 100,
                    sort: 'id,desc'
                });
            }
            
            const items = response?.content || [];
            setPending(items);
            setDebugInfo(`Găsite ${items.length} elemente în așteptare.`);
        } catch (err) {
            console.error("ValidationPanel: Error loading:", err);
            setDebugInfo(`Eroare la preluare: ${err.message}`);
            setPending([]);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (id) => {
        try {
            if (activeTab === 'avalanches') {
                await avalancheService.validate(id);
            } else {
                await conditionsService.validate(id);
            }
            loadPending();
        } catch (err) {
            alert('Eroare la validare: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Ești sigur că vrei să ștergi acest raport?')) {
            try {
                if (activeTab === 'avalanches') {
                    await avalancheService.delete(id);
                } else {
                    await conditionsService.delete(id);
                }
                loadPending();
            } catch (err) {
                alert('Eroare la ștergere: ' + err.message);
            }
        }
    };

    return (
        <div className="container space-y-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-primary">
                        <ShieldCheck size={32} />
                        <h1 className="text-4xl font-black tracking-tight">Validare Conținut</h1>
                    </div>
                    <p className="text-text-muted text-lg">Asigură calitatea și acuratețea datelor publice.</p>
                </div>

                <div className="flex bg-glass-bg p-1.5 rounded-2xl border border-glass-border shadow-xl">
                    <button
                        onClick={() => setActiveTab('avalanches')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 ${activeTab === 'avalanches' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                    >
                        <AlertTriangle size={18} /> Avalanșe
                    </button>
                    <button
                        onClick={() => setActiveTab('conditions')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 ${activeTab === 'conditions' ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
                    >
                        <CloudRain size={18} /> Condiții Meteo
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="space-y-6">
                    {[1, 2].map(i => (
                        <div key={i} className="card glass h-48 animate-pulse bg-white/5 rounded-3xl"></div>
                    ))}
                </div>
            ) : pending.length === 0 ? (
                <div className="card glass py-32 text-center rounded-3xl border-dashed border-white/10">
                    <div className="w-24 h-24 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck className="text-accent-green" size={48} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Totul este verificat!</h3>
                    <p className="text-text-muted max-w-sm mx-auto">Nu există rapoarte noi de {activeTab === 'avalanches' ? 'avalanșe' : 'condiții'} în așteptare.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pending.map(item => (
                        <div key={item.id} className="group relative card glass overflow-hidden rounded-3xl border-l-8 border-primary transition-all duration-500 hover:translate-x-1 hover:shadow-2xl">
                            {/* Glow on hover */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
                            
                            <div className="p-8 flex flex-col lg:flex-row justify-between gap-8 relative z-10">
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-text-muted flex items-center gap-1 font-bold">
                                                <Calendar size={12} /> {item.date}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors leading-tight">
                                            {item.title || (activeTab === 'avalanches' ? 'Avalanșă fără titlu' : 'Raport Condiții')}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-black text-text-muted tracking-widest">Locație</span>
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <MapPin size={16} className="text-primary" />
                                                <span className="truncate">{item.massifName || 'Masiv necunoscut'}</span>
                                            </div>
                                        </div>
                                        
                                        {activeTab === 'avalanches' ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase font-black text-text-muted tracking-widest">Dimensiune</span>
                                                <div className="flex items-center gap-2 text-white font-bold">
                                                    <AlertTriangle size={16} className="text-primary" />
                                                    <span>Mărime: {item.size || 'N/A'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase font-black text-text-muted tracking-widest">Zăpadă</span>
                                                <div className="flex items-center gap-2 text-white font-bold">
                                                    <CloudRain size={16} className="text-primary" />
                                                    <span>{item.snowDepth || 0} cm</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] uppercase font-black text-text-muted tracking-widest">Autor</span>
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <Users size={16} className="text-primary" />
                                                <span className="truncate">
                                                    {item.guestContactInfo ? `${item.guestContactInfo.firstName} ${item.guestContactInfo.lastName}` : (item.visitorId ? 'Utilizator' : 'Anonim')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {item.description && (
                                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-sm text-text-muted italic leading-relaxed line-clamp-2">
                                            "{item.description}"
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-row lg:flex-col items-center justify-end gap-3 lg:w-48 shrink-0">
                                    <button
                                        onClick={() => handleValidate(item.id)}
                                        className="flex-1 lg:w-full bg-accent-green hover:bg-accent-green/80 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 text-xs font-black transition-all hover:scale-105 shadow-xl shadow-accent-green/20"
                                    >
                                        <ShieldCheck size={18} /> Validare
                                    </button>

                                    <Link
                                        to={`/${activeTab === 'avalanches' ? 'avalanche' : 'conditions'}/${item.id}`}
                                        className="flex-1 lg:w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-6 py-3 rounded-full flex items-center justify-center gap-2 text-xs font-black transition-all hover:scale-105"
                                    >
                                        <ExternalLink size={18} /> Detalii
                                    </Link>
                                    
                                    <Link
                                        to={`/${activeTab === 'avalanches' ? 'avalanche' : 'conditions'}/edit/${item.id}`}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full transition-all hover:scale-105"
                                        title="Editează"
                                    >
                                        <Edit size={18} />
                                    </Link>

                                    {(isAdmin || isDataEngineer) && (
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-3 bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/20 rounded-full transition-all hover:scale-105"
                                            title="Șterge"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ValidationPanel;
