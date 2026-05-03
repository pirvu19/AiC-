import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Key, User as UserIcon, Shield, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        lastName: '',
        firstName: '',
        email: '',
        phone: '',
        institution: '',
        projectDetails: '',
        projectPeriod: '',
        requestedRole: 'user'
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/account-requests', formData);
            setSuccess(true);
        } catch (err) {
            setError('Eroare la trimiterea cererii. Te rugăm să încerci din nou mai târziu.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex justify-center items-center min-h-[70vh]">
                <div className="card glass p-10 text-center max-w-md">
                    <CheckCircle className="text-accent-green mx-auto mb-4" size={64} />
                    <h1 className="text-3xl font-bold mb-2">Cerere trimisă!</h1>
                    <p className="text-text-muted">
                        Cererea ta de creare cont a fost trimisă către un administrator. 
                        Vei primi un e-mail cu datele de autentificare imediat ce contul este aprobat.
                    </p>
                    <button 
                        onClick={() => navigate('/')} 
                        className="btn-primary mt-6 px-8"
                    >
                        Înapoi la prima pagină
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-[80vh] py-10 px-4">
            <div className="card glass w-full max-w-2xl p-8 md:p-12">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-primary/20 p-4 rounded-full mb-4">
                        <UserPlus className="text-primary" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold">Solicitare Cont Nou</h1>
                    <p className="text-text-muted mt-2 text-center">Accesează platforma prin trimiterea unei cereri de înregistrare</p>
                </div>

                {error && (
                    <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red p-4 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Nume (Nume de familie)</label>
                            <input name="lastName" className="w-full" value={formData.lastName} onChange={handleChange} required placeholder="Popescu" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Prenume</label>
                            <input name="firstName" className="w-full" value={formData.firstName} onChange={handleChange} required placeholder="Ion" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Email Instituțional/Personal</label>
                            <input name="email" type="email" className="w-full" value={formData.email} onChange={handleChange} required placeholder="contact@exemplu.ro" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Telefon</label>
                            <input name="phone" className="w-full" value={formData.phone} onChange={handleChange} placeholder="07xx xxx xxx" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Instituție / Organizație</label>
                        <input name="institution" className="w-full" value={formData.institution} onChange={handleChange} required placeholder="Universitatea din București / ONG / Privat" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Rol Solicitat</label>
                            <input className="w-full bg-glass-bg/50 cursor-not-allowed opacity-70" value="User (Monitorizare)" disabled />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Perioada Proiect</label>
                            <input name="projectPeriod" className="w-full" value={formData.projectPeriod} onChange={handleChange} placeholder="Ex: Iarna 2024-2025" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted mb-1 block uppercase tracking-wider text-[10px]">Detalii Proiect / Motivul solicitării</label>
                        <textarea 
                            name="projectDetails" 
                            className="w-full h-24 bg-glass-bg border border-glass-border rounded-xl p-3 text-sm focus:border-primary outline-none text-white" 
                            value={formData.projectDetails} 
                            onChange={handleChange}
                            required
                            placeholder="Descrie pe scurt activitatea pentru care ai nevoie de acces..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-4 text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20"
                    >
                        {loading ? 'Se trimite solicitarea...' : 'Trimite Cerere de Cont'}
                    </button>
                </form>

                <p className="text-center mt-8 text-text-muted text-sm">
                    Revenire la <Link to="/login" className="text-primary hover:underline font-medium">Autentificare</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
