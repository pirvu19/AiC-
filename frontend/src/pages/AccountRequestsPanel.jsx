import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Search, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const API_URL = 'http://localhost:8080/api/account-requests';

const AccountRequestsPanel = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');

    const loadRequests = async () => {
        setLoading(true);
        try {
            const response = await api.get('/account-requests');
            setRequests(response.data);
            setError(null);
        } catch (err) {
            console.error('Error loading requests:', err);
            setError('Eroare la încărcarea cererilor. Verifică drepturile de acces.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id) => {
        if (!window.confirm('Ești sigur că vrei să aprobi această cerere? Se va crea un cont automat și se va trimite un email cu parola.')) return;
        
        try {
            await api.put(`/account-requests/${id}/approve`);
            loadRequests();
        } catch (err) {
            alert('Eroare la aprobarea cererii.');
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm('Ești sigur că vrei să respingi această cerere?')) return;
        
        try {
            await api.put(`/account-requests/${id}/reject`);
            loadRequests();
        } catch (err) {
            alert('Eroare la respingerea cererii.');
        }
    };

    const filteredRequests = requests.filter(r => 
        r.lastName?.toLowerCase().includes(filter.toLowerCase()) || 
        r.firstName?.toLowerCase().includes(filter.toLowerCase()) ||
        r.email?.toLowerCase().includes(filter.toLowerCase()) ||
        r.institution?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Cereri Conturi Noi</h1>
                    <p className="text-text-muted mt-2">Gestionează solicitările de acces pentru proiecte și instituții</p>
                </div>
                <button onClick={loadRequests} className="p-2 hover:bg-glass-bg rounded-xl transition-all">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {error && (
                <div className="card glass border-accent-red/20 bg-accent-red/5 p-4 flex items-center gap-3 text-accent-red">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                    <input 
                        className="w-full pl-10" 
                        placeholder="Caută după nume, email sau instituție..." 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="card glass overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-glass-border bg-white/5">
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Solicitant</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Instituție / Proiect</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Contact</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Rol Cerut</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Status</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && requests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-text-muted">Se încarcă...</td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-text-muted">Nicio cerere găsită.</td>
                                </tr>
                            ) : (
                                filteredRequests.map(r => (
                                    <tr key={r.id} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold">{r.lastName} {r.firstName}</div>
                                            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                                                Creat la: {new Date(r.createdAt).toLocaleDateString('ro-RO')}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium">{r.institution || 'N/A'}</div>
                                            <div className="text-xs text-text-muted max-w-xs truncate" title={r.projectDetails}>
                                                {r.projectDetails || 'Fără detalii proiect'}
                                            </div>
                                            <div className="text-[10px] italic text-primary/70">Perioada: {r.projectPeriod || 'Nespecificată'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{r.email}</div>
                                            <div className="text-xs text-text-muted">{r.phone || 'Fără telefon'}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase border border-primary/20">
                                                {r.requestedRole}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                r.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                                                r.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                                {r.status === 'PENDING' && <Clock size={12} />}
                                                {r.status === 'APPROVED' && <CheckCircle size={12} />}
                                                {r.status === 'REJECTED' && <XCircle size={12} />}
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {r.status === 'PENDING' && (
                                                <div className="flex gap-2 justify-end">
                                                    <button 
                                                        onClick={() => handleApprove(r.id)}
                                                        className="p-2 hover:bg-green-500/20 text-green-500 rounded-xl transition-all"
                                                        title="Aprobă"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReject(r.id)}
                                                        className="p-2 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                                                        title="Respinge"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountRequestsPanel;
