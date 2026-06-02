import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import metadataService from '../services/metadataService';
import conditionsService from '../services/conditionsService';
import { Save, ChevronRight, ChevronLeft, Info, Cloud, Map, Contact, Check, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConditionsFormPage = () => {
    const [step, setStep] = useState(1);
    const [metadata, setMetadata] = useState({
        massifs: [],
        regions: []
    });

    const { user } = useAuth();
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        regionId: '',
        massifId: '',
        description: '',
        temperature: '',
        windSpeed: '',
        windDirection: '',
        visibility: '',
        snowDepth: '',
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
            const [massifs, regions] = await Promise.all([
                metadataService.getMassifs(),
                metadataService.getRegions()
            ]);
            setMetadata({ massifs, regions });
        };
        loadMetadata();
    }, []);

    const handleChange = (e, section = null) => {
        const { name, value } = e.target;
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

    const handleFinalSubmit = async () => {
        try {
            await conditionsService.createWithImages(formData, images);
            alert('Raportul a fost trimis cu succes!');
            navigate('/');
        } catch (err) {
            const message = err.response?.data?.message || 'Eroare la trimiterea raportului.';
            alert(message);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.title || !formData.date || !formData.regionId || !formData.massifId) {
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
        if (step === 2 && !formData.description) {
            alert('Te rugăm să adaugi o descriere.');
            return;
        }
        setStep(step + 1);
    };
    const prevStep = () => setStep(step - 1);

    const steps = [
        { number: 1, label: 'Generale', icon: Info },
        { number: 2, label: 'Observații', icon: Cloud },
        { number: 3, label: 'Imagini', icon: Map }
    ];

    return (
        <div className="container py-6">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-black mb-2 text-white">Raport <span className="text-primary italic">Condiții Nou</span></h1>
                <p className="text-text-muted text-sm mb-8">Introdu observațiile actuale despre starea zăpezii și vreme</p>
                
                <div className="stepper-container" style={{ maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
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

            <form className="space-y-8 glass p-8 rounded-2xl shadow-2xl border border-glass-border">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Info size={24} /> <h2>Informații Generale</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Titlu Observație <span className="text-accent-red">*</span></label>
                            <input name="title" className="w-full font-medium" value={formData.title} onChange={handleChange} required placeholder="Ex: Starea zăpezii în Munții Făgăraș" />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Data <span className="text-accent-red">*</span></label>
                                <input name="date" type="date" className="w-full font-medium" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Regiune <span className="text-accent-red">*</span></label>
                                <select name="regionId" className="w-full font-semibold text-white" value={formData.regionId} onChange={handleChange} required>
                                    <option value="" className="bg-bg-dark">Alege regiunea...</option>
                                    {metadata.regions.map(r => <option key={r.id} value={r.id} className="bg-bg-dark">{r.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Masiv Muntos <span className="text-accent-red">*</span></label>
                            <select
                                name="massifId"
                                className="w-full font-semibold text-white"
                                value={formData.massifId}
                                onChange={handleChange}
                                required
                                disabled={!formData.regionId}
                            >
                                <option value="" className="bg-bg-dark">Alege masivul...</option>
                                {metadata.massifs
                                    .filter(m => !formData.regionId || m.regionId == formData.regionId || m.region?.id == formData.regionId)
                                    .map(m => <option key={m.id} value={m.id} className="bg-bg-dark">{m.name}</option>)}
                            </select>
                        </div>

                        {!user && (
                            <div className="pt-6 border-t border-glass-border animate-in fade-in duration-500 space-y-6">
                                <div className="flex items-center gap-2 text-xl font-bold text-primary">
                                    <Contact size={24} /> <h2>Date Contact Vizitator</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Nume <span className="text-accent-red">*</span></label>
                                        <input name="lastName" className="w-full font-medium" value={formData.guestContactInfo.lastName} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Prenume <span className="text-accent-red">*</span></label>
                                        <input name="firstName" className="w-full font-medium" value={formData.guestContactInfo.firstName} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Email <span className="text-accent-red">*</span></label>
                                        <input name="email" type="email" className="w-full font-medium" value={formData.guestContactInfo.email} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Telefon <span className="text-accent-red">*</span></label>
                                        <input name="phone" className="w-full font-medium" value={formData.guestContactInfo.phone} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Cloud size={24} /> <h2>Observații Detaliate</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Temperatură (°C)</label>
                                <input name="temperature" type="number" step="0.5" className="w-full font-medium" value={formData.temperature} onChange={handleChange} placeholder="Ex: -5" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Grosime Strat Zăpadă (cm)</label>
                                <input name="snowDepth" type="number" className="w-full font-medium" value={formData.snowDepth} onChange={handleChange} placeholder="Ex: 120" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Viteză Vânt (km/h)</label>
                                <input name="windSpeed" type="number" className="w-full font-medium" value={formData.windSpeed} onChange={handleChange} placeholder="Ex: 25" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Direcție Vânt</label>
                                <select name="windDirection" className="w-full font-semibold text-white" value={formData.windDirection} onChange={handleChange}>
                                    <option value="" className="bg-bg-dark">Alege...</option>
                                    <option value="N" className="bg-bg-dark">Nord (N)</option>
                                    <option value="NE" className="bg-bg-dark">Nord-Est (NE)</option>
                                    <option value="E" className="bg-bg-dark">Est (E)</option>
                                    <option value="SE" className="bg-bg-dark">Sud-Est (SE)</option>
                                    <option value="S" className="bg-bg-dark">Sud (S)</option>
                                    <option value="SV" className="bg-bg-dark">Sud-Vest (SV)</option>
                                    <option value="V" className="bg-bg-dark">Vest (V)</option>
                                    <option value="NV" className="bg-bg-dark">Nord-Vest (NV)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Vizibilitate</label>
                                <select name="visibility" className="w-full font-semibold text-white" value={formData.visibility} onChange={handleChange}>
                                    <option value="" className="bg-bg-dark">Alege...</option>
                                    <option value="Excelentă" className="bg-bg-dark">Excelentă</option>
                                    <option value="Bună" className="bg-bg-dark">Bună</option>
                                    <option value="Medie" className="bg-bg-dark">Medie (Ceață slabă)</option>
                                    <option value="Scăzută" className="bg-bg-dark">Scăzută (Ceață densă)</option>
                                    <option value="Foarte scăzută" className="bg-bg-dark">Foarte scăzută (Viscol)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Descrierea Condițiilor <span className="text-accent-red">*</span></label>
                            <textarea
                                name="description"
                                className="w-full font-medium"
                                rows="8"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Descrie starea zăpezii, vizibilitatea, pericolele observate..."
                                required
                            />
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-primary mb-4">
                            <Map size={24} /> <h2>Imagini</h2>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-text-muted">Imagini Condiții (Maxim 4 imagini)</label>
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
                    </div>
                )}

                <div className="flex justify-between pt-8 border-t border-glass-border">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="btn-secondary">
                            <ChevronLeft size={18} /> Înapoi
                        </button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl">
                            Înainte <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button type="button" onClick={handleFinalSubmit} className="btn-primary bg-accent-green hover:bg-accent-green/80 flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-white">
                            <Save size={18} /> Trimite Raportul
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ConditionsFormPage;
