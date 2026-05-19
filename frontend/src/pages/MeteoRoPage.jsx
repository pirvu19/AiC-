import { useState, useEffect } from 'react';
import { Activity, ListFilter } from 'lucide-react';
import api from '../services/api';

const MeteoRoPage = () => {
    const [roData, setRoData] = useState(null);
    const [roLoading, setRoLoading] = useState(false);

    useEffect(() => {
        const fetchMeteoRo = async () => {
            setRoLoading(true);
            try {
                const response = await api.get('/meteo/ro');
                setRoData(response.data);
            } catch (error) {
                console.error('Eroare:', error);
                alert('A apărut o eroare la extragerea datelor Meteo RO.');
            } finally {
                setRoLoading(false);
            }
        };

        fetchMeteoRo();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pt-8">
            <header className="pb-8 border-b border-white/5">
                <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Meteo RO</h1>
                <p className="text-text-muted text-lg font-medium">Date meteorologice în timp real</p>
            </header>

            <div className="animate-in fade-in zoom-in-95">
                {roLoading ? (
                    <div className="flex justify-center py-16">
                        <Activity className="animate-spin text-primary" size={48} />
                    </div>
                ) : roData && roData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roData.map((station, idx) => (
                            <div key={idx} className="card glass hover:border-primary/50 transition-all p-6 min-h-[160px] flex flex-col justify-between group">
                                <div className="space-y-3 relative z-10">
                                    <h3 className="text-xl font-black group-hover:text-primary transition-colors">{station.properties.nume}</h3>
                                    <div className="space-y-1.5 text-sm text-text-muted group-hover:text-white transition-colors">
                                        <p className="flex items-center gap-2"><span className="w-16">Temp:</span> <b className="text-primary">{station.properties.tempe}°C</b></p>
                                        <p className="flex items-center gap-2"><span className="w-16">Vânt:</span> <b>{station.properties.vant}</b></p>
                                        <p className="flex items-center gap-2"><span className="w-16">Presiune:</span> <b>{station.properties.presiunetext}</b></p>
                                        <p className="flex items-center gap-2"><span className="w-16">Fenomen:</span> <b>{station.properties.fenomen_e}</b></p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-text-muted/50 text-right mt-4 relative z-10">
                                    Actualizat: {station.properties.actualizat}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="col-span-full py-24 text-center card glass bg-white/2">
                        <ListFilter className="mx-auto mb-4 text-text-muted" size={48} />
                        <h3 className="text-xl font-bold mb-1">Nu există date</h3>
                        <p className="text-text-muted">Momentan nu sunt disponibile date pentru Meteo RO.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeteoRoPage;
