import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CloudRain, ChevronRight, Info, ShieldAlert, Mountain } from 'lucide-react';

const AddReportSelectionPage = () => {
    const navigate = useNavigate();

    const reportTypes = [
        {
            id: 'avalanche',
            title: 'Raport Avalanșă',
            description: 'Raportează o avalanșă observată, inclusiv detalii tehnice, dimensiuni și eventuale victime.',
            icon: <AlertTriangle size={48} />,
            color: 'from-accent-red/20 to-accent-red/5',
            borderColor: 'border-accent-red/30',
            iconColor: 'text-accent-red',
            path: '/add-avalanche',
            features: ['Detalii tehnice', 'Localizare GPS', 'Foto/Video']
        },
        {
            id: 'conditions',
            title: 'Raport Condiții',
            description: 'Raportează starea zăpezii, stratificarea, vizibilitatea și alte observații meteo relevante.',
            icon: <CloudRain size={48} />,
            color: 'from-accent-blue/20 to-accent-blue/5',
            borderColor: 'border-accent-blue/30',
            iconColor: 'text-accent-blue',
            path: '/add-conditions',
            features: ['Meteo & Vânt', 'Grosime Zăpadă', 'Vizibilitate']
        }
    ];

    return (
        <div className="max-w-6xl mx-auto py-16 px-4 animate-in fade-in duration-700">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black tracking-tighter text-white">
                    Adaugă un <span className="text-primary italic">Raport Nou</span>
                </h1>
                <p className="text-text-muted text-lg max-w-2xl mx-auto">
                    Contribuie la siguranța comunității montane prin raportarea incidentelor sau a condițiilor actuale în timp real.
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent-blue mx-auto rounded-full mt-4"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {reportTypes.map((type) => (
                    <div
                        key={type.id}
                        onClick={() => navigate(type.path)}
                        className={`group cursor-pointer relative overflow-hidden rounded-3xl border-2 ${type.borderColor} bg-gradient-to-br ${type.color} p-10 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 card glass`}
                    >
                        {/* Glow effect on hover */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-500"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`mb-8 p-4 rounded-2xl bg-black/20 w-fit ${type.iconColor} group-hover:scale-110 transition-transform duration-500`}>
                                {type.icon}
                            </div>
                            
                            <h2 className="text-3xl font-bold text-white mb-4 group-hover:text-primary transition-colors">
                                {type.title}
                            </h2>
                            
                            <p className="text-text-muted text-lg leading-relaxed mb-10 flex-grow">
                                {type.description}
                            </p>

                            <div className="space-y-3 mb-10">
                                {type.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                                        {feature}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-sm group-hover:translate-x-2 transition-transform">
                                Raportează <ChevronRight size={20} />
                            </div>
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
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Mountain size={16} /> Siguranță
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Info size={16} /> Transparență
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddReportSelectionPage;
