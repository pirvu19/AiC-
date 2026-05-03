import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Date de autentificare incorecte. Vă rugăm să încercați din nou.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] animate-fade">
            <div className="card glass w-full max-w-md p-10">
                <div className="flex flex-col items-center mb-10">
                    <div className="bg-primary/20 p-5 rounded-full mb-6 text-primary">
                        <LogIn size={40} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Autentificare</h1>
                    <p className="text-text-muted mt-2">Accesează platforma AIC</p>
                </div>

                {error && (
                    <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red p-4 rounded-lg mb-6 flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                            <Mail size={16} /> Email
                        </label>
                        <input
                            type="email"
                            className="w-full"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="adresa@email.ro"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2"><Key size={16} /> Parolă</span>
                            <Link to="/forgot-password" size="sm" className="text-xs text-primary hover:underline">Ai uitat parola?</Link>
                        </label>
                        <input
                            type="password"
                            className="w-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex justify-center items-center gap-2 py-3"
                    >
                        {loading ? 'Se încarcă...' : 'Intră în cont'}
                    </button>
                </form>

                <p className="text-center mt-8 text-text-muted text-sm">
                    Nu ai cont? <Link to="/register" className="text-primary hover:underline font-medium">Înregistrează-te aici</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
