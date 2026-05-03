import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import metadataService from '../services/metadataService';
import avalancheService from '../services/avalancheService';
import { Save, ChevronRight, ChevronLeft, Map, Info, Users, Activity, Trash2, Upload, Maximize, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AvalancheEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [newImages, setNewImages] = useState([]);
    const [metadata, setMetadata] = useState({
        massifs: [],
        types: [],
        causes: [],
        orientations: []
    });

    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [avalanche, massifs, types, causes, orientations] = await Promise.all([
                    avalancheService.getById(id),
                    metadataService.getMassifs(),
                    metadataService.getTypes(),
                    metadataService.getCauses(),
                    metadataService.getOrientations()
                ]);

                setMetadata({ massifs, types, causes, orientations });

                // Initialize form with fetched data
                setFormData({
                    title: avalanche.title || '',
                    status: avalanche.status || 'PENDING',
                    date: avalanche.date || new Date().toISOString().split('T')[0],
                    imageUrls: avalanche.imageUrls || [],
                    latitude: avalanche.latitude || 45.0,
                    longitude: avalanche.longitude || 25.0,
                    massifId: avalanche.massifId || '',
                    typeId: avalanche.typeId || '',
                    causeId: avalanche.causeId || '',
                    orientationId: avalanche.orientationId || '',
                    size: avalanche.size || '',
                    zone: avalanche.zone || '',
                    activity: avalanche.activity || '',
                    safetyEquipment: avalanche.safetyEquipment || '',
                    eventTime: avalanche.eventTime || '',
                    technicalDetails: avalanche.technicalDetails || {
                        altitude: 0,
                        slopeInterpolation: 0,
                        trackLength: 0,
                        crownDepth: 0,
                        crownWidth: 0,
                        verticalDrop: 0,
                        accumulationArea: 0,
                        accumLat: 0,
                        accumLng: 0,
                        runoutVerticalDrop: 0,
                        relativeSize: '',
                        crownDepthText: ''
                    },
                    damagesAndVictims: avalanche.damagesAndVictims || {
                        personsCaught: 0,
                        personsPartially: 0,
                        personsFully: 0,
                        personsInjured: 0,
                        personsKilled: 0,
                        materialDamage: 0
                    }
                });
            } catch (err) {
                console.error('Eroare la încărcarea avalanșei:', err);
                alert('Nu am putut încărca datele avalanșei pentru editare.');
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    const handleChange = (e, section = null) => {
        let { name, value, type } = e.target;
        
        if (type === 'number') {
            value = value === '' ? null : Number(value);
        }

        if (section) {
            setFormData({
                ...formData,
                [section]: { ...formData[section], [name]: value }
            });
        } else {
            console.log(`Updating ${name} to`, value);
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const currentCount = formData.imageUrls.length;
        if (currentCount + selectedFiles.length > 4) {
            alert(`Poți avea maxim 4 imagini în total. Date fiind cele ${currentCount} imagini deja existente, mai poți adăuga încă ${4 - currentCount}.`);
            setNewImages(selectedFiles.slice(0, 4 - currentCount));
        } else {
            setNewImages(selectedFiles);
        }
    };

    const handleDeleteExistingImage = async (url) => {
        if (window.confirm('Ești sigur că vrei să ștergi definitiv această imagine? (Acțiunea este instantanee)')) {
            try {
                await avalancheService.deleteImage(id, url);
                setFormData({
                    ...formData,
                    imageUrls: formData.imageUrls.filter(img => img !== url)
                });
            } catch (err) {
                alert('Eroare la ștergerea imaginii.');
            }
        }
    };

    const handleFinalSubmit = async () => {
        try {
            await avalancheService.update(id, formData);
            if (newImages.length > 0) {
                await avalancheService.uploadImages(id, newImages);
            }
            navigate(`/avalanche/${id}`);
        } catch (err) {
            alert('Eroare la actualizarea raportului. Asigură-te că toate datele sunt corecte.');
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    if (loading) return (
        <div className="flex justify-center items-center py-40">
            <div className="text-primary animate-pulse">Se încarcă detaliile pentru editare...</div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold">Editează Evenimentul</h1>
                    <p className="text-text-muted">Pasul {step} din 4 (ID: {id})</p>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`h-2 w-12 rounded-full transition-all ${s === step ? 'bg-blue-500 w-20' : 'bg-glass-border'}`}
                        />
                    ))}
                </div>
            </div>

            <form
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className="space-y-8 glass p-8 rounded-2xl"
            >
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-blue-400 mb-4">
                            <Info size={24} /> <h2>Informații Generale</h2>
                        </div>

                        <div className="space-y-2">
                            <label>Titlu Eveniment</label>
                            <input name="title" className="w-full" value={formData.title} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <label>Link Sursă (avalanseincarpati.ro)</label>
                            <input name="link" className="w-full" value={formData.link || ''} onChange={handleChange} placeholder="https://..." />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label>Data</label>
                                <input name="date" type="date" className="w-full" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <label>Masiv Muntos</label>
                                <select name="massifId" className="w-full" value={formData.massifId} onChange={handleChange} required>
                                    <option value="">Alege masivul...</option>
                                    {metadata.massifs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-glass-border">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-text-muted flex items-center gap-2">
                                    <Maximize size={16} /> Editare Poze ({formData.imageUrls.length + newImages.length} / 4 maxime)
                                </label>
                            </div>

                            {/* Existing Images */}
                            {formData.imageUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-4">
                                    {formData.imageUrls.map((url, idx) => {
                                        const cleanUrl = url.trim();
                                        const backendUrl = window.location.origin.includes('localhost') ? 'http://localhost:8080' : window.location.origin.replace(':8081', ':8080');
                                        const imgSrc = cleanUrl.startsWith('http') ? cleanUrl : `${backendUrl}${cleanUrl}`;
                                        return (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-glass-border">
                                                <img src={imgSrc} alt="Prezentare avalanșă" className="w-full h-24 object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteExistingImage(url)}
                                                    className="absolute top-1 right-1 bg-accent-red hover:bg-red-600 text-white p-1 rounded-full shadow transition-colors"
                                                    title="Șterge definitiv"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Add New Images */}
                            {formData.imageUrls.length < 4 && (
                                <div className="space-y-2">
                                    <label className="text-xs text-text-muted">Adaugă imagini noi (cu CTRL)</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 text-text-muted cursor-pointer"
                                    />
                                    {newImages.length > 0 && (
                                        <p className="text-xs text-accent-green mt-2">
                                            {newImages.length} imagine(i) nouă selectată(e) pentru upload.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-blue-400 mb-4">
                            <Map size={24} /> <h2>Localizare și Detalii</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label>Latitudine</label>
                                <input name="latitude" type="number" step="any" className="w-full" value={formData.latitude} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label>Longitudine</label>
                                <input name="longitude" type="number" step="any" className="w-full" value={formData.longitude} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label>Zonă / Vale</label>
                            <input name="zone" className="w-full" value={formData.zone} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <label>Echipament de Protecție</label>
                            <input name="safetyEquipment" className="w-full" value={formData.safetyEquipment} onChange={handleChange} placeholder="Ex: transceiver / sonda / lopata" />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label>Tip Avalanșă</label>
                                <select name="typeId" className="w-full" value={formData.typeId} onChange={handleChange}>
                                    <option value="">Alege tipul...</option>
                                    {metadata.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label>Cauză Probabilă</label>
                                <select name="causeId" className="w-full" value={formData.causeId} onChange={handleChange}>
                                    <option value="">Alege cauza...</option>
                                    {metadata.causes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="space-y-2">
                                <label>Orientare Pantă</label>
                                <select name="orientationId" className="w-full" value={formData.orientationId} onChange={handleChange}>
                                    <option value="">Alege orientarea...</option>
                                    {metadata.orientations
                                        .filter(o => ['N', 'V', 'S', 'E', 'NV', 'SE', 'NE', 'SV'].includes(o.direction))
                                        .map(o => <option key={o.id} value={o.id}>{o.direction}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-blue-400 mb-4">
                            <Activity size={24} /> <h2>Detalii Tehnice</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label>Altitudine (m)</label>
                                <input name="altitude" type="number" className="w-full" value={formData.technicalDetails.altitude} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label>Înclinație (°)</label>
                                <input name="slopeInterpolation" type="number" className="w-full" value={formData.technicalDetails.slopeInterpolation} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label>Lungime (m)</label>
                                <input name="trackLength" type="number" className="w-full" value={formData.technicalDetails.trackLength} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label>Gr. Coroană (cm)</label>
                                <input name="crownDepth" type="number" className="w-full" value={formData.technicalDetails.crownDepth} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label>Lățime Coroană (m)</label>
                                <input name="crownWidth" type="number" className="w-full" value={formData.technicalDetails.crownWidth} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label>Cădere Vert. (m)</label>
                                <input name="verticalDrop" type="number" className="w-full" value={formData.technicalDetails.verticalDrop} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label>Arie Acumulare (m²)</label>
                                <input name="accumulationArea" type="number" className="w-full" value={formData.technicalDetails.accumulationArea} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label>Mărime Relativă (1-5)</label>
                                <input name="relativeSize" className="w-full" value={formData.technicalDetails.relativeSize} onChange={(e) => handleChange(e, 'technicalDetails')} placeholder="Ex: 3" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label>Lat Acumulare</label>
                                <input name="accumLat" type="number" step="any" className="w-full" value={formData.technicalDetails.accumLat} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label>Lng Acumulare</label>
                                <input name="accumLng" type="number" step="any" className="w-full" value={formData.technicalDetails.accumLng} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label>Cădere Runout (m)</label>
                                <input name="runoutVerticalDrop" type="number" className="w-full" value={formData.technicalDetails.runoutVerticalDrop} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label>Descriere Coroană</label>
                            <textarea name="crownDepthText" className="w-full" rows="2" value={formData.technicalDetails.crownDepthText} onChange={(e) => handleChange(e, 'technicalDetails')} placeholder="Detalii despre stratul de zăpadă..." />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-blue-400 mb-4">
                            <Users size={24} /> <h2>Victime și Pagube</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-xs uppercase mb-2">Prinși</label>
                                <input name="personsCaught" type="number" className="w-full text-center" value={formData.damagesAndVictims.personsCaught} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-xs uppercase mb-2">Parțial Acop.</label>
                                <input name="personsPartially" type="number" className="w-full text-center" value={formData.damagesAndVictims.personsPartially} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-xs uppercase mb-2">Total Acop.</label>
                                <input name="personsFully" type="number" className="w-full text-center" value={formData.damagesAndVictims.personsFully} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-xs uppercase mb-2">Răniți</label>
                                <input name="personsInjured" type="number" className="w-full text-center" value={formData.damagesAndVictims.personsInjured} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-xs uppercase mb-2">Decedați</label>
                                <input name="personsKilled" type="number" className="w-full text-center" value={formData.damagesAndVictims.personsKilled} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-xs uppercase mb-2">Pagube Mat.</label>
                                <input name="materialDamage" type="number" className="w-full text-center" value={formData.damagesAndVictims.materialDamage} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-8 border-t border-glass-border">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 hover:bg-glass-bg rounded-lg transition-colors">
                            <ChevronLeft size={20} /> Înapoi
                        </button>
                    ) : <div></div>}

                    {step < 4 ? (
                        <button type="button" onClick={nextStep} className="btn-primary bg-blue-500 hover:bg-blue-600 flex items-center gap-2">
                            Înainte <ChevronRight size={20} />
                        </button>
                    ) : (
                        <div className="flex flex-wrap gap-4">
                            {formData.status === 'PENDING' && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await avalancheService.update(id, formData);
                                            await avalancheService.validate(id);
                                            navigate('/validate');
                                        } catch (err) {
                                            alert('Eroare la salvare și validare.');
                                        }
                                    }}
                                    className="bg-accent-green hover:bg-accent-green/80 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all hover:scale-105 shadow-lg shadow-accent-green/20"
                                >
                                    <ShieldCheck size={20} /> Salvează și Validează
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleFinalSubmit}
                                className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-black transition-all hover:scale-105 shadow-lg shadow-primary/20"
                            >
                                <Save size={20} /> Salvează Modificările
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AvalancheEditPage;
