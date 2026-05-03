import { useState, useEffect } from 'react';
import { Users, Trash2, Shield, User as UserIcon, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import userService from '../services/userService';

const UserManagementPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAll();
            setUsers(data);
            setError(null);
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Nu s-au putut încărca utilizatorii. Verifică drepturile de administrator.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await userService.updateRole(userId, newRole);
            loadUsers(); // Reload to get updated data
        } catch (err) {
            console.error('Error updating role:', err);
            alert('Eroare la actualizarea rolului.');
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Ești sigur că vrei să ștergi utilizatorul ${username}? Această acțiune este ireversibilă.`)) {
            try {
                await userService.delete(userId);
                loadUsers();
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Eroare la ștergerea utilizatorului.');
            }
        }
    };

    const getRoleIcon = (roleName) => {
        const normalized = roleName?.toUpperCase();
        switch (normalized) {
            case 'ADMIN':
            case 'ROLE_ADMIN': return <Shield size={16} className="text-accent-red" />;
            case 'EXPERT':
            case 'ROLE_EXPERT': return <ShieldCheck size={16} className="text-primary" />;
            case 'ADMIN_UTILIZATORI':
            case 'ROLE_ADMIN_UTILIZATORI': return <Shield size={16} className="text-indigo-400" />;
            case 'REVIEWER':
            case 'ROLE_REVIEWER': return <Shield size={16} className="text-amber-400" />;
            case 'DATA_ENGINEER':
            case 'ROLE_DATA_ENGINEER': return <Shield size={16} className="text-violet-400" />;
            default: return <UserIcon size={16} className="text-text-muted" />;
        }
    };

    const getRoleBadgeClass = (roleName) => {
        const normalized = roleName?.toUpperCase();
        switch (normalized) {
            case 'ADMIN':
            case 'ROLE_ADMIN': return 'bg-accent-red/10 text-accent-red';
            case 'EXPERT':
            case 'ROLE_EXPERT': return 'bg-primary/10 text-primary';
            case 'ADMIN_UTILIZATORI':
            case 'ROLE_ADMIN_UTILIZATORI': return 'bg-indigo-500/10 text-indigo-500';
            case 'REVIEWER':
            case 'ROLE_REVIEWER': return 'bg-amber-500/10 text-amber-500';
            case 'DATA_ENGINEER':
            case 'ROLE_DATA_ENGINEER': return 'bg-violet-500/10 text-violet-500';
            default: return 'bg-glass-bg text-text-muted';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Gestionare Utilizatori</h1>
                    <p className="text-text-muted mt-2">Administrează conturile și permisiunile utilizatorilor</p>
                </div>
                <button onClick={loadUsers} className="p-2 hover:bg-glass-bg rounded-xl transition-all">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {error && (
                <div className="card glass border-accent-red/20 bg-accent-red/5 p-4 flex items-center gap-3 text-accent-red">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="card glass overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-glass-border bg-white/5">
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Utilizator / Nume</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Contact</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Status / Rol</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted">Creat la</th>
                                <th className="p-4 text-xs font-black uppercase text-text-muted text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-text-muted">Se încarcă...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-10 text-center text-text-muted">Niciun utilizator găsit.</td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} className="border-b border-glass-border hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{u.username}</div>
                                                    <div className="text-[10px] text-text-muted uppercase tracking-wider">
                                                        {(u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Fără nume setat'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{u.email}</div>
                                            <div className="text-[10px] text-text-muted font-mono">{u.phone || 'Fără telefon'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${getRoleBadgeClass(u.roleName)}`}>
                                                    {getRoleIcon(u.roleName)}
                                                    {u.roleName?.replace('ROLE_', '')}
                                                </span>
                                                <select
                                                    className="bg-glass-bg border-none text-[10px] font-bold py-1 px-2 rounded-lg"
                                                    value={u.roleName?.toUpperCase()}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="ADMIN_UTILIZATORI">ADMIN UTILIZATORI</option>
                                                    <option value="REVIEWER">REVIEWER</option>
                                                    <option value="DATA_ENGINEER">DATA ENGINEER</option>
                                                    <option value="EXPERT">EXPERT</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-text-muted">
                                            {new Date(u.createdAt).toLocaleDateString('ro-RO')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(u.id, u.username)}
                                                className="p-2 hover:bg-accent-red/20 text-accent-red rounded-xl transition-all"
                                                title="Șterge utilizator"
                                            >
                                                <Trash2 size={18} />
                                            </button>
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

export default UserManagementPanel;
