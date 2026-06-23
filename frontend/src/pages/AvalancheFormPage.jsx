import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import metadataService from '../services/metadataService';
import avalancheService from '../services/avalancheService';
import { Save, ChevronRight, ChevronLeft, Map, Info, Users, Activity, LocateFixed, Contact, Check, Upload, X, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AvalancheFormPage = () => {
    const [step, setStep] = useState(1);
    const [metadata, setMetadata] = useState({
        massifs: [],
        regions: [],
        types: [],
        causes: [],
        orientations: []
    });

    const { user } = useAuth();
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [showCustomActivity, setShowCustomActivity] = useState(false);

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
            const [massifs, regions, types, causes, orientations] = await Promise.all([
                metadataService.getMassifs(),
                metadataService.getRegions(),
                metadataService.getTypes(),
                metadataService.getCauses(),
                metadataService.getOrientations()
            ]);
            setMetadata({ massifs, regions, types, causes, orientations });
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
        setImages(prev => {
            const combined = [...prev, ...selectedFiles];
            if (combined.length > 4) {
                alert('Poți selecta maxim 4 imagini.');
                return combined.slice(0, 4);
            }
            return combined;
        });
    };

    const removeImage = (indexToRemove) => {
        setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
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
            if (!formData.title || !formData.date || !formData.massifId || !formData.size) {
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

    const steps = [
        { number: 1, label: 'Generale', icon: Info },
        { number: 2, label: 'Localizare', icon: Map },
        { number: 3, label: 'Date Tehnice', icon: Activity },
        { number: 4, label: 'Impact & Victime', icon: Users }
    ];

    const renderCounter = (label, section, field) => {
        const value = formData[section][field] || 0;
        
        const handleIncrement = () => {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: (prev[section][field] || 0) + 1
                }
            }));
        };
        
        const handleDecrement = () => {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: Math.max(0, (prev[section][field] || 0) - 1)
                }
            }));
        };
        
        return (
            <div className="counter-card">
                <label>{label}</label>
                <div className="counter-control">
                    <button
                        type="button"
                        className="counter-btn"
                        onClick={handleDecrement}
                        disabled={value === 0}
                    >
                        <Minus size={16} />
                    </button>
                    <span className={`counter-value ${value > 0 ? 'has-value' : ''}`}>{value}</span>
                    <button
                        type="button"
                        className="counter-btn"
                        onClick={handleIncrement}
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="container py-6">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black mb-2 text-white">Raportează un <span className="text-primary italic">Eveniment Nou</span></h1>
                <p className="text-text-muted text-sm mb-8">Introdu datele cât mai precis pentru a ajuta comunitatea montană</p>
                
                <div className="stepper-container">
                    <div className="stepper-line">
                        <div 
                            className="stepper-line-progress" 
                            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                        />
                    </div>
                    {steps.map((s) => {
                        const StepIcon = s.icon;
                        const isActive = s.number === step;
                        const isCompleted = s.number < step;
                        
                        return (
                            <div 
                                key={s.number} 
                                className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                onClick={() => {
                                    if (s.number < step) {
                                        setStep(s.number);
                                    }
                                }}
                            >
                                <div className={`stepper-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                    {isCompleted ? <Check size={18} /> : <StepIcon size={18} />}
                                </div>
                                <div className="stepper-label">{s.label}</div>
                            </div>
                        );
                    })}
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
                            <input name="title" className="w-full font-medium" value={formData.title} onChange={handleChange} required placeholder="Ex: Avalanșă Bâlea Lac" />
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

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Imagini Eveniment (Maxim 4 imagini)</label>
                            <div 
                                className="dropzone"
                                onClick={triggerFileInput}
                            >
                                <div className="dropzone-icon-wrap">
                                    <Upload size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">Faceți clic pentru a selecta imagini</p>
                                    <p className="text-text-muted text-xs mt-1">Sunt acceptate formatele PNG, JPG sau JPEG (Max. 4)</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </div>
                            
                            {images.length > 0 && (
                                <div className="image-preview-grid">
                                    {images.map((img, index) => (
                                        <div key={index} className="image-preview-card">
                                            <img src={URL.createObjectURL(img)} alt={`Preview ${index}`} />
                                            <button
                                                type="button"
                                                className="image-preview-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeImage(index);
                                                }}
                                                title="Elimină imaginea"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {!user && (
                            <div className="pt-6 border-t border-glass-border animate-in fade-in duration-500 space-y-6">
                                <div className="flex items-center gap-2 text-xl font-bold text-primary">
                                    <Contact size={24} /> <h2>Date Contact Vizitator</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Nume <span className="text-accent-red">*</span></label>
                                        <input
                                            name="lastName"
                                            className="w-full font-medium"
                                            value={formData.guestContactInfo.lastName}
                                            onChange={(e) => handleChange(e, 'guestContactInfo')}
                                            placeholder="Numele dumneavoastră"
                                            required={!user}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Prenume <span className="text-accent-red">*</span></label>
                                        <input
                                            name="firstName"
                                            className="w-full font-medium"
                                            value={formData.guestContactInfo.firstName}
                                            onChange={(e) => handleChange(e, 'guestContactInfo')}
                                            placeholder="Prenumele dumneavoastră"
                                            required={!user}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Email <span className="text-accent-red">*</span></label>
                                        <input
                                            name="email"
                                            type="email"
                                            className="w-full font-medium"
                                            value={formData.guestContactInfo.email}
                                            onChange={(e) => handleChange(e, 'guestContactInfo')}
                                            placeholder="adresa@email.com"
                                            required={!user}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Telefon <span className="text-accent-red">*</span></label>
                                        <input
                                            name="phone"
                                            className="w-full font-medium"
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
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-xl font-bold text-primary">
                                <Map size={24} /> <h2>Localizare și Detalii</h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="flex items-center gap-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-all px-4 py-2 rounded-xl font-bold border border-primary/20 glow-on-hover"
                            >
                                <LocateFixed size={16} className="animate-pulse" /> Folosește Locația Mea
                            </button>
                        </div>

                        <div className="coords-panel space-y-4">
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
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Zonă / Vale</label>
                            <input name="zone" className="w-full font-medium" value={formData.zone} onChange={handleChange} placeholder="Ex: Căldarea Bâlii" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Echipament de Protecție (DVA, Sondă, Lopată, etc.)</label>
                            <input name="safetyEquipment" className="w-full font-medium" value={formData.safetyEquipment} onChange={handleChange} placeholder="Ex: DVA/Sonda/Lopata sau Fără" />
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
                                <input name="altitude" type="number" className="w-full font-medium" value={formData.technicalDetails.altitude || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Înclinație (°)</label>
                                <input name="slopeInterpolation" type="number" className="w-full font-medium" value={formData.technicalDetails.slopeInterpolation || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lungime (m)</label>
                                <input name="trackLength" type="number" className="w-full font-medium" value={formData.technicalDetails.trackLength || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Gr. Coroană (cm)</label>
                                <input name="crownDepth" type="number" className="w-full font-medium" value={formData.technicalDetails.crownDepth || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lățime Coroană (m)</label>
                                <input name="crownWidth" type="number" className="w-full font-medium" value={formData.technicalDetails.crownWidth || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Cădere Vert. (m)</label>
                                <input name="verticalDrop" type="number" className="w-full font-medium" value={formData.technicalDetails.verticalDrop || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Arie Acumulare (m²)</label>
                                <input name="accumulationArea" type="number" className="w-full font-medium" value={formData.technicalDetails.accumulationArea || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Mărime Relativă (1-5)</label>
                                <input name="relativeSize" className="w-full font-medium" value={formData.technicalDetails.relativeSize} onChange={(e) => handleChange(e, 'technicalDetails')} placeholder="Ex: 3" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lat Acumulare</label>
                                <input name="accumLat" type="number" step="any" className="w-full font-mono" value={formData.technicalDetails.accumLat || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Lng Acumulare</label>
                                <input name="accumLng" type="number" step="any" className="w-full font-mono" value={formData.technicalDetails.accumLng || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Cădere Runout (m)</label>
                                <input name="runoutVerticalDrop" type="number" className="w-full font-medium" value={formData.technicalDetails.runoutVerticalDrop || ''} onChange={(e) => handleChange(e, 'technicalDetails')} />
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

                        <div className="grid grid-cols-3 gap-4">
                            {renderCounter('Persoane Surprinse', 'damagesAndVictims', 'personsCaught')}
                            {renderCounter('Acoperite Parțial', 'damagesAndVictims', 'personsPartially')}
                            {renderCounter('Acoperite Total', 'damagesAndVictims', 'personsFully')}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {renderCounter('Persoane Rănite', 'damagesAndVictims', 'personsInjured')}
                            {renderCounter('Persoane Decedate', 'damagesAndVictims', 'personsKilled')}
                            {renderCounter('Pagube Materiale', 'damagesAndVictims', 'materialDamage')}
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
                        <button type="button" onClick={handleFinalSubmit} className="btn-primary bg-accent-green hover:bg-accent-green/80 flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-white">
                            <Save size={18} /> Trimite Evenimentul
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AvalancheFormPage;
