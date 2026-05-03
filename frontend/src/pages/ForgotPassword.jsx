import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
    const [searchParams] = useSearchParams();
    const isFirstLogin = searchParams.get('firstLogin') === 'true';
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message || 'Un link de resetare a fost trimis pe email-ul tău.');
        } catch (err) {
            setError(err.response?.data?.message || 'Eroare la solicitarea resetării. Verifică email-ul.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" />

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
                    <div className="mb-8 text-center">
                        <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 mb-4 border border-blue-500/20">
                            <Mail className="h-8 w-8 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {isFirstLogin ? 'Resetare parolă la prima utilizare' : 'Ai uitat parola?'}
                        </h1>
                        <p className="text-slate-400">
                            {isFirstLogin 
                                ? 'Introdu adresa de email pentru a primi instrucțiunile de configurare a noii parole.' 
                                : 'Introdu adresa de email și îți vom trimite un link pentru resetare.'}
                        </p>
                    </div>

                    {message ? (
                        <div className="text-center animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-6">
                                <div className="p-4 rounded-full bg-green-500/20">
                                    <CheckCircle className="h-12 w-12 text-green-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">Email trimis cu succes!</h3>
                            <p className="text-slate-300 mb-8 leading-relaxed">{message}</p>
                            <Link to="/login" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                <ArrowLeft className="h-4 w-4" />
                                Înapoi la autentificare
                            </Link>
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
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        placeholder="nume@exemplu.ro"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary py-3 px-4 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Trimite Link
                                        <Send className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                                    <ArrowLeft className="h-4 w-4" />
                                    Înapoi la autentificare
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
