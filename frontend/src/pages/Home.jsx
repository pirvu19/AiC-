import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import avalancheService from '../services/avalancheService';
import conditionsService from '../services/conditionsService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Activity, ShieldCheck, AlertTriangle, ArrowUpDown, Info, Wind, CloudRain, ListFilter, Search, ChevronLeft, ChevronRight, Key } from 'lucide-react';

// Memoized Image component to prevent re-fetch loops
const SafeImage = ({ src, alt, className, style }) => {
    const [error, setError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    useEffect(() => {
        setCurrentSrc(src);
        setError(false);
    }, [src]);

    if (error || !src) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted opacity-20 bg-black/20">
                <CloudRain size={24} />
            </div>
        );
    }

    return (
        <img
            src={currentSrc}
            alt={alt}
            style={style}
            className={className}
            onError={() => {
                console.warn('Image failed to load:', currentSrc);
                setError(true);
            }}
        />
    );
};

// Memoized Card component to prevent unnecessary re-renders
const AvalancheCard = memo(({ item, view, isExpert, handleValidate }) => {
    const imageUrl = item.imageUrls && item.imageUrls.length > 0
        ? (item.imageUrls[0].startsWith('http') ? item.imageUrls[0] : (item.imageUrls[0].startsWith('/') ? `http://localhost:8080${item.imageUrls[0]}` : `http://localhost:8080/${item.imageUrls[0]}`))
        : null;

    return (
        <div className="card glass hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col sm:flex-row justify-between gap-6 p-6 min-h-[160px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>

            {/* Left Section (Info) */}
            <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center gap-3 relative z-10 mb-1">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'VALIDATED' ? 'bg-accent-green/20 text-accent-green' : 'bg-primary/20 text-primary'}`}>
                        {item.status === 'VALIDATED' ? 'Validat' : 'În așteptare'}
                    </span>
                    <div className="text-[11px] text-text-muted font-medium flex items-center gap-1">
                        <Calendar size={13} className="text-primary/70" />
                        {new Date(item.date || item.createdAt).toLocaleDateString('ro-RO')}
                    </div>
                </div>

                <h3 className="text-lg md:text-xl font-black line-clamp-2 group-hover:text-primary transition-colors relative z-10 leading-tight">
                    {item.title || (view === 'conditions' ? 'Raport Vizibilitate & Zăpadă' : 'Fără titlu')}
                </h3>

                <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center gap-3 text-sm text-text-muted group-hover:text-white transition-colors">
                        <MapPin size={16} className="text-primary shrink-0" />
                        <span className="truncate">{item.massifName || 'Masiv necunoscut'}</span>
                    </div>
                    {view === 'avalanches' ? (
                        <div className="flex items-center gap-3 text-sm text-text-muted group-hover:text-white transition-colors">
                            <Activity size={16} className="text-primary shrink-0" />
                            <span>Mărime: <b>{item.size || 'N/A'}</b></span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-sm text-text-muted group-hover:text-white transition-colors">
                            <Wind size={16} className="text-primary shrink-0" />
                            <span>Vânt: <b>{item.windSpeed || 0} km/h</b></span>
                        </div>
                    )}
                </div>

                <div className="pt-2 flex items-center gap-4 relative z-10">
                    <Link
                        to={`/${view === 'avalanches' ? 'avalanche' : 'conditions'}/${item.id}`}
                        className="text-[10px] font-black text-primary flex items-center gap-1.5 hover:gap-2.5 transition-all uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 hover:border-primary/30"
                    >
                        Detalii <Search size={12} />
                    </Link>

                    {isExpert && item.status !== 'VALIDATED' && view === 'avalanches' && (
                        <button
                            onClick={(e) => { e.preventDefault(); handleValidate(item.id); }}
                            className="bg-accent-green hover:bg-accent-green/80 text-white p-1.5 rounded-lg transition-transform hover:scale-110 shadow-lg shadow-accent-green/20"
                            title="Validează Raport"
                        >
                            <ShieldCheck size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Right Section (Media) */}
            <div className="flex flex-col items-center gap-3 relative z-10 shrink-0" style={{ width: '100px' }}>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl group-hover:border-primary/40 transition-all" style={{ width: '80px', height: '80px' }}>
                    <SafeImage
                        src={imageUrl}
                        alt="Avalanșă"
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        className="transition-transform duration-700 group-hover:scale-110"
                    />
                </div>

                {item.link && (
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/50 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] text-center text-primary transition-all flex items-center justify-center gap-1 group/btn shadow-sm"
                    >
                        Blog <Activity size={10} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </a>
                )}
            </div>
        </div>
    );
});

const Home = () => {
    const [view, setView] = useState('avalanches');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const { user, isExpert, mustChangePassword } = useAuth();

    useEffect(() => {
        setCurrentPage(0);
    }, [view, pageSize]);

    useEffect(() => {
        loadData();
    }, [view, sortOrder, currentPage, pageSize]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                size: pageSize,
                sort: `${view === 'avalanches' ? 'date' : 'createdAt'},${sortOrder}`
            };

            let response;
            if (view === 'avalanches') {
                response = await avalancheService.getValidated(params);
            } else {
                response = await conditionsService.getAll(params);
            }

            setData(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(response.totalElements || 0);
        } catch (err) {
            console.error('Eroare la încărcarea datelor:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (id) => {
        try {
            await avalancheService.validate(id);
            loadData();
        } catch (err) {
            alert('Eroare la validare');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {user && mustChangePassword && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 mb-6">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Key className="text-amber-400" size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">Resetare parolă la prima utilizare</h4>
                        <p className="text-xs text-slate-300">Pentru siguranța contului tău, te rugăm să alegi o parolă nouă înainte de a continua.</p>
                    </div>
                    <Link to="/forgot-password?firstLogin=true" className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-1.5 px-4 rounded-lg transition-all shadow-lg shadow-amber-900/20 whitespace-nowrap">
                        Schimbă Parola
                    </Link>
                </div>
            )}

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Monitorizare Centralizată</h1>
                    <p className="text-text-muted text-lg font-medium">Situația în timp real din munții noștri</p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    <div className="bg-glass-bg border border-glass-border p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setView('avalanches')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'avalanches' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-text-muted'}`}
                        >
                            <AlertTriangle size={16} /> Avalanșe
                        </button>
                        <button
                            onClick={() => setView('conditions')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${view === 'conditions' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-text-muted'}`}
                        >
                            <CloudRain size={16} /> Condiții
                        </button>
                    </div>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="bg-glass-bg border border-glass-border px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/5 transition-all text-white"
                    >
                        <ArrowUpDown size={16} className="text-primary" />
                        {sortOrder === 'desc' ? 'Cele mai noi' : 'Cele mai vechi'}
                    </button>

                    {user && (
                        <Link
                            to="/search"
                            className="bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-primary transition-all shadow-lg shadow-primary/5"
                        >
                            <Search size={16} />
                            Căutare & Filtrare
                        </Link>
                    )}

                    <div className="bg-glass-bg border border-glass-border px-3 py-2 rounded-xl flex items-center gap-2">
                        <span className="text-xs font-bold text-text-muted uppercase">Pe pagină:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
                        >
                            <option value={10} className="bg-background">10</option>
                            <option value={20} className="bg-background">20</option>
                            <option value={50} className="bg-background">50</option>
                        </select>
                    </div>
                </div>
            </header>


            {loading ? (
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card glass h-48 animate-pulse bg-white/5"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {data.length === 0 ? (
                        <div className="col-span-full py-24 text-center card glass bg-white/2">
                            <ListFilter className="mx-auto mb-4 text-text-muted" size={48} />
                            <h3 className="text-xl font-bold mb-1">Niciun raport găsit</h3>
                            <p className="text-text-muted">Încă nu au fost adăugate date pentru această categorie.</p>
                        </div>
                    ) : (
                        data.map((item) => (
                            <AvalancheCard
                                key={item.id}
                                item={item}
                                view={view}
                                isExpert={isExpert}
                                handleValidate={handleValidate}
                            />
                        ))
                    )}
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5 mt-8">
                    <p className="text-sm text-text-muted font-medium">
                    Afișare <span className="text-white">{data.length}</span> din <span className="text-white">{totalElements}</span> rezultate
                </p>

                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                            className="p-2 rounded-xl bg-glass-bg border border-glass-border text-white disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all border ${currentPage === i ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-glass-bg border-glass-border text-text-muted hover:text-white'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage === totalPages - 1}
                            className="p-2 rounded-xl bg-glass-bg border border-glass-border text-white disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
                </div>
        </div>
    );
};

export default Home;
