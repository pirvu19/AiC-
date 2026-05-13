import { useState } from 'react';
import api from '../services/api';
import { Map, LocateFixed, CloudLightning, Activity, MountainSnow, X } from 'lucide-react';

const mountainCoordinates = [
    { name: "Făgăraș (Bâlea/Moldoveanu)", lat: 45.600, lng: 24.747 },
    { name: "Bucegi (Vf. Omu)", lat: 45.445, lng: 25.456 },
    { name: "Parâng (Parângul Mare)", lat: 45.340, lng: 23.538 },
    { name: "Retezat (Peleaga)", lat: 45.362, lng: 22.894 },
    { name: "Călimani (Pietrosul)", lat: 47.123, lng: 25.218 },
    { name: "Piatra Craiului", lat: 45.526, lng: 25.215 },
    { name: "Postăvarul", lat: 45.566, lng: 25.565 },
];

const MeteoPage = () => {
    const [mode, setMode] = useState('list'); // 'list' or 'manual'
    const [lat, setLat] = useState(mountainCoordinates[0].lat);
    const [lng, setLng] = useState(mountainCoordinates[0].lng);
    const [htmlReport, setHtmlReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleMountainSelect = (e) => {
        const idx = e.target.value;
        const mt = mountainCoordinates[idx];
        setLat(mt.lat);
        setLng(mt.lng);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocația nu este suportată de browser-ul tău.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLat(parseFloat(position.coords.latitude.toFixed(4)));
                setLng(parseFloat(position.coords.longitude.toFixed(4)));
            },
            (error) => alert('Nu am putut obține locația: ' + error.message)
        );
    };

    const fetchForecast = async () => {
        if (!lat || !lng) {
            alert('Te rog introdu latitudinea și longitudinea!');
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/meteo/openmeteo?lat=${lat}&lng=${lng}`);
            setHtmlReport(response.data);
        } catch (error) {
            console.error('Eroare:', error);
            alert('A apărut o eroare la extragerea datelor meteo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container space-y-8">
            <div className="text-center space-y-2">
                <MountainSnow className="w-16 h-16 mx-auto text-primary" />
                <h1 className="text-4xl font-bold">Prognoză Meteo Montană</h1>
                <p className="text-text-muted">Află condițiile meteorologice în timp real și prognoza pentru masivele muntoase.</p>
            </div>

            <div className="glass p-8 rounded-2xl max-w-xl mx-auto items-start">
                <div className="space-y-6">
                    <div className="flex bg-glass-bg rounded-lg p-1 w-full gap-2">
                        <button
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${mode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                            onClick={() => setMode('list')}
                        >
                            Alege din Listă
                        </button>
                        <button
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${mode === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-white/5 hover:text-white'}`}
                            onClick={() => setMode('manual')}
                        >
                            Introducere Manuală
                        </button>
                    </div>

                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {mode === 'list' ? (
                            <div className="space-y-2 animate-in fade-in zoom-in-95">
                                <label className="text-sm font-medium text-text-muted">Masiv Muntos</label>
                                <div className="relative">
                                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                    <select
                                        className="w-full pl-10"
                                        onChange={handleMountainSelect}
                                    >
                                        {mountainCoordinates.map((c, i) => (
                                            <option key={i} value={i}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in zoom-in-95">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-muted">Latitudine</label>
                                        <input
                                            type="number"
                                            className="w-full"
                                            value={lat}
                                            onChange={(e) => setLat(e.target.value)}
                                            step="0.0001"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-text-muted">Longitudine</label>
                                        <input
                                            type="number"
                                            className="w-full"
                                            value={lng}
                                            onChange={(e) => setLng(e.target.value)}
                                            step="0.0001"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleGetLocation}
                                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 rounded-lg transition-colors text-sm font-medium"
                                >
                                    <LocateFixed size={18} /> Folosește Locația Mea (GPS)
                                </button>
                            </div>
                        )}

                        <button
                            onClick={fetchForecast}
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Activity className="animate-spin" size={20} />
                                    Se extrag datele...
                                </>
                            ) : (
                                <>
                                    <CloudLightning size={20} />
                                    Generează Prognoza
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Inline Weather Report */}
            {htmlReport && (
                <div className="w-full mt-10 animate-in fade-in slide-in-from-bottom-8 duration-300">
                    <div
                        className="mx-auto w-full"
                        dangerouslySetInnerHTML={{ __html: htmlReport }}
                    />
                </div>
            )}
        </div>
    );
};

export default MeteoPage;
