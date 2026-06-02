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
        regions: [],
        types: [],
        causes: [],
        orientations: []
    });

    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [showCustomActivity, setShowCustomActivity] = useState(false);
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [avalanche, massifs, regions, types, causes, orientations] = await Promise.all([
                    avalancheService.getById(id),
                    metadataService.getMassifs(),
                    metadataService.getRegions(),
                    metadataService.getTypes(),
                    metadataService.getCauses(),
                    metadataService.getOrientations()
                ]);

                setMetadata({ massifs, regions, types, causes, orientations });

                const matchedMassif = massifs.find(m => m.id === avalanche.massifId);
                const initialRegionId = matchedMassif?.regionId || matchedMassif?.region?.id || '';
                setSelectedRegionId(initialRegionId);

                const defaultActivities = ['Schi de tură / Splitboard', 'Alpinism / Escaladă', 'Drumeție', 'Snowmobil', 'Lucrări utilitare / Monitorizare'];
                if (avalanche.activity && !defaultActivities.includes(avalanche.activity)) {
                    setShowCustomActivity(true);
                }

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
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleRegionChange = (e) => {
        const regId = e.target.value;
        setSelectedRegionId(regId);
        setFormData(prev => ({ ...prev, massifId: '' }));
    };

    const handleActivityChange = (e) => {
        const val = e.target.value;
        if (val === 'Altele') {
            setShowCustomActivity(true);
            setFormData(prev => ({ ...prev, activity: '' }));
        } else {
            setShowCustomActivity(false);
            setFormData(prev => ({ ...prev, activity: val }));
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
            <div className="text-primary animate-pulse font-bold">Se încarcă detaliile pentru editare...</div>
        </div>
    );

    return (
        <div className="container py-6" style={{ maxWidth: '800px' }}>
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold">Editează Evenimentul</h1>
                    <p className="text-text-muted">Pasul {step} din 4 (ID: {id})</p>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((s) => (
                        <div
                            key={s}
                            className={`h-2 w-12 rounded-full transition-all ${s === step ? 'bg-primary w-20' : 'bg-glass-border'}`}
                        />
                    ))}
                </div>
            </div>

            <form
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                className="space-y-8 glass p-8 rounded-2xl shadow-2xl border border-glass-border"
            >
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Info size={24} /> <h2>Informații Generale</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Titlu Eveniment <span className="text-accent-red">*</span></label>
                            <input name="title" className="w-full font-medium" value={formData.title} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Link Sursă (avalanseincarpati.ro)</label>
                            <input name="link" className="w-full font-medium" value={formData.link || ''} onChange={handleChange} placeholder="https://..." />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Data <span className="text-accent-red">*</span></label>
                                <input name="date" type="date" className="w-full font-medium" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Ora Evenimentului</label>
                                <input name="eventTime" type="time" className="w-full font-medium text-white" value={formData.eventTime} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Regiune <span className="text-accent-red">*</span></label>
                                <select 
                                    className="w-full font-semibold text-white" 
                                    value={selectedRegionId} 
                                    onChange={handleRegionChange} 
                                    required
                                >
                                    <option value="" className="bg-bg-dark">Alege regiunea...</option>
                                    {metadata.regions.map(r => <option key={r.id} value={r.id} className="bg-bg-dark">{r.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Masiv Muntos <span className="text-accent-red">*</span></label>
                                <select 
                                    name="massifId" 
                                    className="w-full font-semibold text-white" 
                                    value={formData.massifId} 
                                    onChange={handleChange} 
                                    required
                                    disabled={!selectedRegionId}
                                >
                                    <option value="" className="bg-bg-dark">Alege masivul...</option>
                                    {metadata.massifs
                                        .filter(m => !selectedRegionId || m.regionId == selectedRegionId || m.region?.id == selectedRegionId)
                                        .map(m => <option key={m.id} value={m.id} className="bg-bg-dark">{m.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Mărime Avalanșă <span className="text-accent-red">*</span></label>
                                <div className="flex gap-2">
                                    {['mica', 'medie', 'mare'].map(sz => (
                                        <button
                                            key={sz}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, size: sz }))}
                                            className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                                                formData.size === sz
                                                    ? 'bg-primary/20 border-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                                    : 'bg-glass-bg border-glass-border text-text-muted hover:border-white/20 hover:text-white'
                                            }`}
                                        >
                                            {sz === 'mica' ? 'Mică' : sz === 'medie' ? 'Medie' : 'Mare'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Activitate desfășurată</label>
                                <select 
                                    className="w-full font-semibold text-white" 
                                    value={showCustomActivity ? 'Altele' : (['Schi de tură / Splitboard', 'Alpinism / Escaladă', 'Drumeție', 'Snowmobil', 'Lucrări utilitare / Monitorizare'].includes(formData.activity) ? formData.activity : (formData.activity ? 'Altele' : ''))}
                                    onChange={handleActivityChange}
                                >
                                    <option value="" className="bg-bg-dark">Alege activitatea...</option>
                                    <option value="Schi de tură / Splitboard" className="bg-bg-dark">Schi de tură / Splitboard</option>
                                    <option value="Alpinism / Escaladă" className="bg-bg-dark">Alpinism / Escaladă</option>
                                    <option value="Drumeție" className="bg-bg-dark">Drumeție</option>
                                    <option value="Snowmobil" className="bg-bg-dark">Snowmobil</option>
                                    <option value="Lucrări utilitare / Monitorizare" className="bg-bg-dark">Lucrări utilitare / Monitorizare</option>
                                    <option value="Altele" className="bg-bg-dark">Alta activitate (scrie manual)...</option>
                                </select>
                                {showCustomActivity && (
                                    <input 
                                        name="activity" 
                                        className="w-full mt-2 font-medium animate-in slide-in-from-top-2 duration-200" 
                                        placeholder="Scrie activitatea desfășurată..." 
                                        value={formData.activity} 
                                        onChange={handleChange}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-glass-border">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-2">
                                    <Maximize size={16} /> Editare Poze ({formData.imageUrls.length + newImages.length} / 4 maxime)
                                </label>
                            </div>

                            {formData.imageUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-4">
                                    {formData.imageUrls.map((url, idx) => {
                                        const cleanUrl = url.trim();
                                        const imgSrc = cleanUrl.startsWith('http') ? cleanUrl : (cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`);
                                        return (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-glass-border">
                                                <img src={imgSrc} alt="Prezentare" className="w-full h-24 object-cover" />
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
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Map size={24} /> <h2>Localizare și Detalii</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Latitudine</label>
                                <input name="latitude" type="number" step="any" className="w-full font-mono" value={formData.latitude} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Longitudine</label>
                                <input name="longitude" type="number" step="any" className="w-full font-mono" value={formData.longitude} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Zonă / Vale</label>
                            <input name="zone" className="w-full font-medium" value={formData.zone} onChange={handleChange} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Echipament de Protecție</label>
                            <input name="safetyEquipment" className="w-full font-medium" value={formData.safetyEquipment} onChange={handleChange} placeholder="Ex: transceiver / sonda / lopata" />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Tip Avalanșă</label>
                                <select name="typeId" className="w-full font-semibold text-white" value={formData.typeId} onChange={handleChange}>
                                    <option value="" className="bg-bg-dark">Alege tipul...</option>
                                    {metadata.types.map(t => <option key={t.id} value={t.id} className="bg-bg-dark">{t.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Cauză Probabilă</label>
                                <select name="causeId" className="w-full font-semibold text-white" value={formData.causeId} onChange={handleChange}>
                                    <option value="" className="bg-bg-dark">Alege cauza...</option>
                                    {metadata.causes.map(c => <option key={c.id} value={c.id} className="bg-bg-dark">{c.description}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Orientare Pantă</label>
                            <select name="orientationId" className="w-full font-semibold text-white" value={formData.orientationId} onChange={handleChange}>
                                <option value="" className="bg-bg-dark">Alege orientarea...</option>
                                {metadata.orientations
                                    .filter(o => ['N', 'V', 'S', 'E', 'NV', 'SE', 'NE', 'SV'].includes(o.direction))
                                    .map(o => <option key={o.id} value={o.id} className="bg-bg-dark">{o.direction}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Activity size={24} /> <h2>Detalii Tehnice</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Altitudine (m)</label>
                                <input name="altitude" type="number" className="w-full font-medium" value={formData.technicalDetails.altitude} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Înclinație (°)</label>
                                <input name="slopeInterpolation" type="number" className="w-full font-medium" value={formData.technicalDetails.slopeInterpolation} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lungime (m)</label>
                                <input name="trackLength" type="number" className="w-full font-medium" value={formData.technicalDetails.trackLength} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Gr. Coroană (cm)</label>
                                <input name="crownDepth" type="number" className="w-full font-medium" value={formData.technicalDetails.crownDepth} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lățime Coroană (m)</label>
                                <input name="crownWidth" type="number" className="w-full font-medium" value={formData.technicalDetails.crownWidth} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Cădere Vert. (m)</label>
                                <input name="verticalDrop" type="number" className="w-full font-medium" value={formData.technicalDetails.verticalDrop} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Arie Acumulare (m²)</label>
                                <input name="accumulationArea" type="number" className="w-full font-medium" value={formData.technicalDetails.accumulationArea} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Mărime Relativă (1-5)</label>
                                <input name="relativeSize" className="w-full font-medium" value={formData.technicalDetails.relativeSize} onChange={(e) => handleChange(e, 'technicalDetails')} placeholder="Ex: 3" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lat Acumulare</label>
                                <input name="accumLat" type="number" step="any" className="w-full font-mono" value={formData.technicalDetails.accumLat} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lng Acumulare</label>
                                <input name="accumLng" type="number" step="any" className="w-full font-mono" value={formData.technicalDetails.accumLng} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Cădere Runout (m)</label>
                                <input name="runoutVerticalDrop" type="number" className="w-full font-medium" value={formData.technicalDetails.runoutVerticalDrop} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Descriere Coroană</label>
                            <textarea name="crownDepthText" className="w-full font-medium" rows="2" value={formData.technicalDetails.crownDepthText} onChange={(e) => handleChange(e, 'technicalDetails')} placeholder="Detalii despre stratul de zăpadă..." />
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Users size={24} /> <h2>Victime și Pagube</h2>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-[10px] uppercase font-bold text-text-muted mb-2">Prinși</label>
                                <input name="personsCaught" type="number" className="w-full text-center font-bold" value={formData.damagesAndVictims.personsCaught} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-[10px] uppercase font-bold text-text-muted mb-2">Parțial Acop.</label>
                                <input name="personsPartially" type="number" className="w-full text-center font-bold" value={formData.damagesAndVictims.personsPartially} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-[10px] uppercase font-bold text-text-muted mb-2">Total Acop.</label>
                                <input name="personsFully" type="number" className="w-full text-center font-bold" value={formData.damagesAndVictims.personsFully} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-[10px] uppercase font-bold text-text-muted mb-2">Răniți</label>
                                <input name="personsInjured" type="number" className="w-full text-center font-bold" value={formData.damagesAndVictims.personsInjured} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-[10px] uppercase font-bold text-text-muted mb-2">Decedați</label>
                                <input name="personsKilled" type="number" className="w-full text-center font-bold" value={formData.damagesAndVictims.personsKilled} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                            <div className="card bg-glass-bg border-glass-border p-4">
                                <label className="block text-[10px] uppercase font-bold text-text-muted mb-2">Pagube Mat.</label>
                                <input name="materialDamage" type="number" className="w-full text-center font-bold" value={formData.damagesAndVictims.materialDamage} onChange={(e) => handleChange(e, 'damagesAndVictims')} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-8 border-t border-glass-border">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="btn-secondary">
                            <ChevronLeft size={18} /> Înapoi
                        </button>
                    ) : <div></div>}

                    {step < 4 ? (
                        <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl">
                            Înainte <ChevronRight size={18} />
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
                                    Salvează și Validează
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
