import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import metadataService from '../services/metadataService';
import avalancheService from '../services/avalancheService';
import { Save, ChevronRight, ChevronLeft, Map, Info, Users, Activity, LocateFixed, Contact } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AvalancheFormPage = () => {
    const [step, setStep] = useState(1);
    const [metadata, setMetadata] = useState({
        massifs: [],
        types: [],
        causes: [],
        orientations: []
    });

    const { user } = useAuth();
    const [images, setImages] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        latitude: 45.0,
        longitude: 25.0,
        massifId: '',
        typeId: '',
        causeId: '',
        orientationId: '',
        size: '',
        zone: '',
        activity: '',
        safetyEquipment: '',
        eventTime: '',
        technicalDetails: {
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
        damagesAndVictims: {
            personsCaught: 0,
            personsPartially: 0,
            personsFully: 0,
            personsInjured: 0,
            personsKilled: 0,
            materialDamage: 0
        },
        guestContactInfo: {
            firstName: '',
            lastName: '',
            email: '',
            phone: ''
        }
    });

    const navigate = useNavigate();

    useEffect(() => {
        const loadMetadata = async () => {
            const [massifs, types, causes, orientations] = await Promise.all([
                metadataService.getMassifs(),
                metadataService.getTypes(),
                metadataService.getCauses(),
                metadataService.getOrientations()
            ]);
            setMetadata({ massifs, types, causes, orientations });
        };
        loadMetadata();
    }, []);

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

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 4) {
            alert('Poți selecta maxim 4 imagini.');
            // Only take the first 4
            setImages(selectedFiles.slice(0, 4));
        } else {
            setImages(selectedFiles);
        }
    };

    const handleFinalSubmit = async () => {
        try {
            await avalancheService.createWithImages(formData, images);
            navigate('/');
        } catch (err) {
            const message = err.response?.data?.message || 'Eroare la trimiterea raportului. Asigură-te că toate câmpurile sunt completate corect.';
            alert(message);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.title || !formData.date || !formData.massifId) {
                alert('Te rugăm să completezi toate câmpurile obligatorii.');
                return;
            }
            if (!user) {
                const { firstName, lastName, email, phone } = formData.guestContactInfo;
                if (!firstName || !lastName || !email || !phone) {
                    alert('Te rugăm să completezi toate datele de contact.');
                    return;
                }
            }
        }
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocația nu este suportată de browser-ul tău.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(position.coords.latitude.toFixed(4)),
                    longitude: parseFloat(position.coords.longitude.toFixed(4))
                }));
            },
            (error) => {
                alert('Nu am putut obține locația: ' + error.message);
            }
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold">Eveniment Nou</h1>
                    <p className="text-text-muted">Pasul {step} din 4</p>
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
                className="space-y-8 glass p-8 rounded-2xl"
            >
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Info size={24} /> <h2>Informații Generale</h2>
                        </div>

                        <div className="space-y-2">
                            <label>Titlu Eveniment</label>
                            <input name="title" className="w-full" value={formData.title} onChange={handleChange} required placeholder="Ex: Avalanșă Bâlea Lac" />
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

                        <div className="space-y-2">
                            <label>Imagini (Țineți apăsat CTRL pt. a alege max. 4)</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-button-text hover:file:bg-primary/90 text-text-muted cursor-pointer"
                            />
                            {images.length > 0 && (
                                <p className="text-sm text-theme-secondary mt-2">
                                    {images.length} imagine(i) selectată(e).
                                </p>
                            )}
                        </div>

                        {!user && (
                            <div className="pt-6 border-t border-glass-border animate-in fade-in duration-500 space-y-6">
                                <div className="flex items-center gap-2 text-xl font-bold text-accent-blue">
                                    <Contact size={24} /> <h2>Date Contact Vizitator</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label>Nume <span className="text-red-500">*</span></label>
                                        <input
                                            name="lastName"
                                            className="w-full"
                                            value={formData.guestContactInfo.lastName}
                                            onChange={(e) => handleChange(e, 'guestContactInfo')}
                                            placeholder="Numele dumneavoastră"
                                            required={!user}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label>Prenume <span className="text-red-500">*</span></label>
                                        <input
                                            name="firstName"
                                            className="w-full"
                                            value={formData.guestContactInfo.firstName}
                                            onChange={(e) => handleChange(e, 'guestContactInfo')}
                                            placeholder="Prenumele dumneavoastră"
                                            required={!user}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label>Email <span className="text-red-500">*</span></label>
                                        <input
                                            name="email"
                                            type="email"
                                            className="w-full"
                                            value={formData.guestContactInfo.email}
                                            onChange={(e) => handleChange(e, 'guestContactInfo')}
                                            placeholder="adresa@email.com"
                                            required={!user}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label>Telefon <span className="text-red-500">*</span></label>
                                        <input
                                            name="phone"
                                            className="w-full"
                                            value={formData.guestContactInfo.phone}
                                            onChange={(e) => handleChange(e, 'guestContactInfo')}
                                            placeholder="07xxxxxxxx"
                                            required={!user}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-xl font-bold text-primary">
                                <Map size={24} /> <h2>Localizare și Detalii</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="flex items-center gap-2 text-sm bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors px-3 py-1.5 rounded-lg font-medium"
                            >
                                <LocateFixed size={16} /> Folosește Locația Mea
                            </button>
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
                            <input name="zone" className="w-full" value={formData.zone} onChange={handleChange} placeholder="Ex: Căldarea Bâlii" />
                        </div>

                        <div className="space-y-2">
                            <label>Echipament de Protecție (DVA, Sondă, Lopată, etc.)</label>
                            <input name="safetyEquipment" className="w-full" value={formData.safetyEquipment} onChange={handleChange} placeholder="Ex: DVA/Sonda/Lopata sau Fără" />
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
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
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
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
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
                        <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2">
                            Înainte <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button type="button" onClick={handleFinalSubmit} className="btn-primary bg-accent-green hover:bg-accent-green/80 flex items-center gap-2">
                            <Save size={20} /> Trimite Evenimentul
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AvalancheFormPage;
