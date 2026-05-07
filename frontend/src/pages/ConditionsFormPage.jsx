import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import metadataService from '../services/metadataService';
import conditionsService from '../services/conditionsService';
import { Save, ChevronRight, ChevronLeft, Info, Cloud, Map, Contact } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConditionsFormPage = () => {
    const [step, setStep] = useState(1);
    const [metadata, setMetadata] = useState({
        massifs: [],
        regions: []
    });

    const { user } = useAuth();
    const [images, setImages] = useState([]);

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
        if (selectedFiles.length > 4) {
            alert('Poți selecta maxim 4 imagini.');
            setImages(selectedFiles.slice(0, 4));
        } else {
            setImages(selectedFiles);
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

    return (
        <div className="container py-10">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold">Raport Condiții Nou</h1>
                    <p className="text-text-muted">Pasul {step} din 3</p>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-2 w-12 rounded-full transition-all ${s === step ? 'bg-accent-blue w-20' : 'bg-glass-border'}`}
                        />
                    ))}
                </div>
            </div>

            <form className="space-y-8 glass p-8 rounded-2xl shadow-2xl">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-accent-blue mb-4">
                            <Info size={24} /> <h2>Informații Generale</h2>
                        </div>

                        <div className="space-y-2">
                            <label>Titlu Observație</label>
                            <input name="title" className="w-full" value={formData.title} onChange={handleChange} required placeholder="Ex: Starea zăpezii în Munții Făgăraș" />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label>Data</label>
                                <input name="date" type="date" className="w-full" value={formData.date} onChange={handleChange} required />
                            </div>
                            <div className="space-y-2">
                                <label>Regiune</label>
                                <select name="regionId" className="w-full" value={formData.regionId} onChange={handleChange} required>
                                    <option value="">Alege regiunea...</option>
                                    {metadata.regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label>Masiv Muntos</label>
                            <select
                                name="massifId"
                                className="w-full"
                                value={formData.massifId}
                                onChange={handleChange}
                                required
                                disabled={!formData.regionId}
                            >
                                <option value="">Alege masivul...</option>
                                {metadata.massifs
                                    .filter(m => !formData.regionId || m.regionId == formData.regionId || m.region?.id == formData.regionId)
                                    .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {!user && (
                            <div className="pt-6 border-t border-glass-border animate-in fade-in duration-500 space-y-6">
                                <div className="flex items-center gap-2 text-xl font-bold text-primary">
                                    <Contact size={24} /> <h2>Date Contact Vizitator</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label>Nume <span className="text-red-500">*</span></label>
                                        <input name="lastName" className="w-full" value={formData.guestContactInfo.lastName} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label>Prenume <span className="text-red-500">*</span></label>
                                        <input name="firstName" className="w-full" value={formData.guestContactInfo.firstName} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label>Email <span className="text-red-500">*</span></label>
                                        <input name="email" type="email" className="w-full" value={formData.guestContactInfo.email} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label>Telefon <span className="text-red-500">*</span></label>
                                        <input name="phone" className="w-full" value={formData.guestContactInfo.phone} onChange={(e) => handleChange(e, 'guestContactInfo')} required />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-accent-blue mb-4">
                            <Cloud size={24} /> <h2>Observații Detaliate</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label>Temperatură (°C)</label>
                                <input name="temperature" type="number" step="0.5" className="w-full" value={formData.temperature} onChange={handleChange} placeholder="Ex: -5" />
                            </div>
                            <div className="space-y-2">
                                <label>Grosime Strat Zăpadă (cm)</label>
                                <input name="snowDepth" type="number" className="w-full" value={formData.snowDepth} onChange={handleChange} placeholder="Ex: 120" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label>Viteză Vânt (km/h)</label>
                                <input name="windSpeed" type="number" className="w-full" value={formData.windSpeed} onChange={handleChange} placeholder="Ex: 25" />
                            </div>
                            <div className="space-y-2">
                                <label>Direcție Vânt</label>
                                <select name="windDirection" className="w-full" value={formData.windDirection} onChange={handleChange}>
                                    <option value="">Alege...</option>
                                    <option value="N">Nord (N)</option>
                                    <option value="NE">Nord-Est (NE)</option>
                                    <option value="E">Est (E)</option>
                                    <option value="SE">Sud-Est (SE)</option>
                                    <option value="S">Sud (S)</option>
                                    <option value="SV">Sud-Vest (SV)</option>
                                    <option value="V">Vest (V)</option>
                                    <option value="NV">Nord-Vest (NV)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label>Vizibilitate</label>
                                <select name="visibility" className="w-full" value={formData.visibility} onChange={handleChange}>
                                    <option value="">Alege...</option>
                                    <option value="Excelentă">Excelentă</option>
                                    <option value="Bună">Bună</option>
                                    <option value="Medie">Medie (Ceață slabă)</option>
                                    <option value="Scăzută">Scăzută (Ceață densă)</option>
                                    <option value="Foarte scăzută">Foarte scăzută (Viscol)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label>Descrierea Condițiilor</label>
                            <textarea
                                name="description"
                                className="w-full"
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 text-xl font-bold text-accent-blue mb-4">
                            <Map size={24} /> <h2>Imagini</h2>
                        </div>

                        <div className="space-y-4">
                            <p className="text-text-muted text-sm">Adaugă până la 4 imagini relevante pentru condițiile observate.</p>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-black file:bg-accent-blue file:text-white hover:file:bg-accent-blue/80 transition-all cursor-pointer"
                            />
                            <div className="flex gap-4 mt-6">
                                {images.map((img, i) => (
                                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-glass-border">
                                        <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-8 border-t border-glass-border">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 hover:bg-glass-bg rounded-lg transition-colors font-bold">
                            <ChevronLeft size={20} /> Înapoi
                        </button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button type="button" onClick={nextStep} className="btn-primary bg-accent-blue hover:bg-accent-blue/80 flex items-center gap-2">
                            Înainte <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button type="button" onClick={handleFinalSubmit} className="btn-primary bg-accent-green hover:bg-accent-green/80 flex items-center gap-2">
                            <Save size={20} /> Trimite Raportul
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ConditionsFormPage;
