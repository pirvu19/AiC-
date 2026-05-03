import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import metadataService from '../services/metadataService';
import conditionsService from '../services/conditionsService';
import { Save, ChevronRight, ChevronLeft, Info, Cloud, Contact, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConditionsEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [metadata, setMetadata] = useState({
        massifs: [],
        regions: []
    });

    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [conditions, massifs, regions] = await Promise.all([
                    conditionsService.getById(id),
                    metadataService.getMassifs(),
                    metadataService.getRegions()
                ]);

                setMetadata({ massifs, regions });
                setFormData({
                    ...conditions,
                    guestContactInfo: conditions.guestContactInfo || {
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: ''
                    }
                });
            } catch (err) {
                console.error('Eroare la încărcarea condițiilor:', err);
                alert('Nu am putut încărca datele raportului pentru editare.');
                navigate('/validate');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

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

    const handleFinalSubmit = async () => {
        try {
            await conditionsService.update(id, formData);
            alert('Modificările au fost salvate cu succes!');
            navigate(`/conditions/${id}`);
        } catch (err) {
            alert('Eroare la salvarea modificărilor.');
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
        <div className="max-w-4xl mx-auto py-10">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold">Editează Raport Condiții</h1>
                    <p className="text-text-muted">Pasul {step} din 2 (ID: {id})</p>
                </div>
                <div className="flex gap-2">
                    {[1, 2].map((s) => (
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
                            <input name="title" className="w-full" value={formData.title} onChange={handleChange} required />
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
                            >
                                <option value="">Alege masivul...</option>
                                {metadata.massifs
                                    .filter(m => !formData.regionId || m.regionId == formData.regionId || m.region?.id == formData.regionId)
                                    .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        {(formData.guestContactInfo && !formData.visitorId) && (
                            <div className="pt-6 border-t border-glass-border space-y-6">
                                <div className="flex items-center gap-2 text-xl font-bold text-primary">
                                    <Contact size={24} /> <h2>Date Contact Vizitator</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label>Nume</label>
                                        <input name="lastName" className="w-full" value={formData.guestContactInfo.lastName} onChange={(e) => handleChange(e, 'guestContactInfo')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label>Prenume</label>
                                        <input name="firstName" className="w-full" value={formData.guestContactInfo.firstName} onChange={(e) => handleChange(e, 'guestContactInfo')} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label>Email</label>
                                        <input name="email" type="email" className="w-full" value={formData.guestContactInfo.email} onChange={(e) => handleChange(e, 'guestContactInfo')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label>Telefon</label>
                                        <input name="phone" className="w-full" value={formData.guestContactInfo.phone} onChange={(e) => handleChange(e, 'guestContactInfo')} />
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
                                <input name="temperature" type="number" step="0.5" className="w-full" value={formData.temperature} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label>Grosime Strat Zăpadă (cm)</label>
                                <input name="snowDepth" type="number" className="w-full" value={formData.snowDepth} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label>Viteză Vânt (km/h)</label>
                                <input name="windSpeed" type="number" className="w-full" value={formData.windSpeed} onChange={handleChange} />
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
                                    <option value="Medie">Medie</option>
                                    <option value="Scăzută">Scăzută</option>
                                    <option value="Foarte scăzută">Foarte scăzută</option>
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
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-between pt-8 border-t border-glass-border">
                    {step > 1 ? (
                        <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 hover:bg-glass-bg rounded-lg transition-colors font-bold">
                            <ChevronLeft size={20} /> Înapoi
                        </button>
                    ) : <div></div>}

                    {step < 2 ? (
                        <button type="button" onClick={nextStep} className="btn-primary bg-accent-blue hover:bg-accent-blue/80 flex items-center gap-2">
                            Înainte <ChevronRight size={20} />
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            {formData.status === 'PENDING' && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await conditionsService.update(id, formData);
                                            await conditionsService.validate(id);
                                            alert('Raport salvat și validat!');
                                            navigate('/validate');
                                        } catch (err) {
                                            alert('Eroare la salvare și validare.');
                                        }
                                    }}
                                    className="bg-accent-green hover:bg-accent-green/80 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold transition-all hover:scale-105"
                                >
                                    <ShieldCheck size={20} /> Salvează și Validează
                                </button>
                            )}
                            <button type="button" onClick={handleFinalSubmit} className="btn-primary bg-primary hover:bg-primary/80 flex items-center gap-2">
                                <Save size={20} /> Salvează Modificările
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default ConditionsEditPage;
