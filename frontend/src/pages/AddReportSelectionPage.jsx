import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CloudRain, ChevronRight, Info, ShieldAlert, Mountain, CheckCircle2 } from 'lucide-react';

const AddReportSelectionPage = () => {
    const navigate = useNavigate();

    const reportTypes = [
        {
            id: 'avalanche',
            title: 'Raport Avalanșă',
            description: 'Raportează o avalanșă observată, inclusiv detalii tehnice, dimensiuni și eventuale victime.',
            icon: <AlertTriangle size={36} />,
            iconColor: 'text-accent-red bg-accent-red/10',
            path: '/add-avalanche',
            features: ['Detalii tehnice complete', 'Localizare GPS precisă', 'Atașare fișiere Foto/Video']
        },
        {
            id: 'conditions',
            title: 'Raport Condiții',
            description: 'Raportează starea zăpezii, stratificarea, vizibilitatea și alte observații meteo relevante.',
            icon: <CloudRain size={36} />,
            iconColor: 'text-accent-blue bg-accent-blue/10',
            path: '/add-conditions',
            features: ['Informații Meteo & Vânt', 'Grosime strat de Zăpadă', 'Vizibilitate pe traseu']
        }
    ];

    return (
        <div className="selection-container animate-in fade-in duration-700">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black tracking-tighter text-white">
                    Adaugă un <span className="text-primary italic">Raport Nou</span>
                </h1>
                <p className="text-text-muted text-lg max-w-2xl mx-auto">
                    Contribuie la siguranța comunității montane prin raportarea incidentelor sau a condițiilor actuale în timp real.
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent-blue mx-auto rounded-full mt-4"></div>
            </div>

            <div className="selection-grid">
                {reportTypes.map((type) => (
                    <div
                        key={type.id}
                        onClick={() => navigate(type.path)}
                        className={`selection-card selection-card-${type.id}`}
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between" style={{ flex: 1 }}>
                            <div>
                                <div className={`mb-8 p-5 rounded-2xl w-fit ${type.iconColor}`}>
                                    {type.icon}
                                </div>
                                
                                <h2 className="text-3xl font-black text-white mb-4">
                                    {type.title}
                                </h2>
                                
                                <p className="text-text-muted text-base leading-relaxed mb-8">
                                    {type.description}
                                </p>

                                <div className="space-y-3 mb-10">
                                    {type.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                                            <CheckCircle2 size={16} className={type.id === 'avalanche' ? 'text-accent-red' : 'text-accent-blue'} />
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <button 
                                className={`selection-btn selection-btn-${type.id}`}
                            >
                                Raportează Acum <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-20 flex flex-col items-center gap-6">
                <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-sm text-text-muted">
                    <ShieldAlert size={18} className="text-accent-green" />
                    Toate rapoartele sunt evaluate de experții noștri înainte de publicare.
                </div>
                
                <div className="flex items-center gap-8 opacity-40">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
                        <Mountain size={16} /> Siguranță
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
                        <Info size={16} /> Transparență
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddReportSelectionPage;
