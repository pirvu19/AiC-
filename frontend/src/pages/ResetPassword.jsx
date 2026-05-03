import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Key, ArrowLeft, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const RequirementItem = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-400' : 'text-slate-500'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-slate-600'}`} />
        <span>{text}</span>
    </div>
);

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [shake, setShake] = useState(false);

    const [requirements, setRequirements] = useState({
        length: false,
        upper: false,
        lower: false,
        digit: false,
        special: false
    });

    useEffect(() => {
        setRequirements({
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            digit: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{}|;':",.<>?/]/.test(password)
        });
    }, [password]);

    const isPasswordValid = Object.values(requirements).every(Boolean);

    useEffect(() => {
        const queryToken = new URLSearchParams(location.search).get('token');
        if (queryToken) {
            setToken(queryToken);
        } else {
            setError('Token lipsește. Te rugăm să folosești link-ul din email.');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Parolele nu coincid.');
            return;
        }

        if (!isPasswordValid) {
            setError('Parola nu îndeplinește toate cerințele de securitate.');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la resetarea parolei. Token-ul ar putea fi expirat.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="mb-8 text-center">
                        <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 mb-4 border border-blue-500/20">
                            <Key className="h-8 w-8 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Setează o parolă nouă</h1>
                        <p className="text-slate-400">Alege o parolă puternică pe care să o poți reține.</p>
                    </div>

                    {success ? (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 rounded-full bg-green-500/20">
                                    <CheckCircle className="h-12 w-12 text-green-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Parolă resetată!</h3>
                            <p className="text-slate-300 mb-8 leading-relaxed">
                                Parola ta a fost actualizată cu succes. Vei fi redirecționat către pagina de login...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-shake">
                                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Parolă Nouă</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading || !token}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                
                                <div className={`mt-4 p-4 bg-slate-800/30 rounded-xl border transition-all duration-300 ${shake ? 'border-red-500 animate-shake' : 'border-slate-700/50'} space-y-2`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${shake ? 'text-red-400' : 'text-slate-500'}`}>Cerințe Securitate</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <RequirementItem met={requirements.length} text="8-12+ caractere" />
                                        <RequirementItem met={requirements.upper} text="Cel puțin o literă mare (A-Z)" />
                                        <RequirementItem met={requirements.lower} text="Cel puțin o literă mică (a-z)" />
                                        <RequirementItem met={requirements.digit} text="Cel puțin o cifră (0-9)" />
                                        <RequirementItem met={requirements.special} text="Un caracter special (!@#$%^&*...)" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Confirmă Parola</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading || !token}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !token}
                                className="w-full btn-primary py-3 px-4 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Salvează Parola
                                        <Save className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                                    <ArrowLeft className="h-4 w-4" />
                                    Anulează
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
