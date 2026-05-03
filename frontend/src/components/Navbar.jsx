import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Mountain, LogOut, User, ShieldCheck, PlusCircle, Search, Users, Cloud, Bell, Check, Trash2, UserCheck, Layers } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAdmin, isExpert, isUserAdmin, isReviewer, isDataEngineer } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();
    const isRestrictedAdmin = isUserAdmin && !isAdmin;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass sticky top-0 z-50 py-4 mb-10">
            <div className="container flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
                    <Mountain className="text-primary" size={28} />
                    <span className="text-text-main">AIC Avalanse</span>
                </Link>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-6">
                        {!isRestrictedAdmin && (
                            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Acasă</Link>
                        )}

                        {!isRestrictedAdmin && (
                            <>

                                <a href="/api/meteo" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <Cloud size={18} />
                                    <span>Risc Avalanșe (PDF)</span>
                                </a>

                                <Link to="/meteo" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <Cloud size={18} />
                                    <span>Prognoză Montană</span>
                                </Link>

                                {!isReviewer && !isDataEngineer && (
                                    <Link to="/add" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                        <PlusCircle size={18} />
                                        <span>Eveniment Nou</span>
                                    </Link>
                                )}
                            </>
                        )}

                        {(isExpert || isReviewer) && (
                            <Link to="/validation" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                <ShieldCheck size={18} />
                                <span>Validare</span>
                            </Link>
                        )}

                        {user && (
                            <Link to="/search" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                <Search size={18} />
                                <span>Căutare</span>
                            </Link>
                        )}

                        {(isUserAdmin || isDataEngineer) && (
                            <>
                                <Link to="/admin/users" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <Users size={18} />
                                    <span>Utilizatori</span>
                                </Link>
                                <Link to="/admin/requests" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <UserCheck size={18} />
                                    <span>Cereri Conturi</span>
                                </Link>
                                {(isAdmin || isDataEngineer) && (
                                    <Link to="/admin/metadata" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                        <Layers size={18} />
                                        <span>Metadate</span>
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4 pl-6 border-l relative">
                        {user ? (
                            <>
                                {/* Buton Notificari */}
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 transition-colors"
                                    style={{ position: 'relative', borderRadius: '50%' }}
                                    title="Notificări"
                                >
                                    <Bell size={20} className="text-text-main" />
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute', top: -5, right: -5,
                                            backgroundColor: 'var(--accent-red)', color: 'white',
                                            fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px',
                                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Notificari */}
                                {showNotifications && (
                                    <div style={{
                                        position: 'absolute', top: '100%', right: 0, marginTop: '1rem',
                                        width: '24rem', backgroundColor: '#1e2330', border: '1px solid var(--border)',
                                        borderRadius: '1rem', boxShadow: 'var(--shadow)', overflow: 'hidden', zIndex: 50
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                            <h3 style={{ fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>Notificări</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={markAllAsRead} style={{ color: 'var(--text-muted)', background: 'none' }} title="Marchează toate ca citite">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={clearAll} style={{ color: 'var(--accent-red)', background: 'none' }} title="Șterge toate">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                                            {notifications.length === 0 ? (
                                                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    Nu ai nicio notificare.
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => markAsRead(notif.id)}
                                                        style={{
                                                            padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                            cursor: 'pointer', backgroundColor: notif.read ? 'transparent' : 'rgba(255,255,255,0.03)',
                                                            display: 'flex', gap: '0.75rem'
                                                        }}
                                                    >
                                                        <div style={{
                                                            marginTop: '0.25rem', width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                                            backgroundColor: notif.type === 'admin' ? '#3b82f6' : '#22c55e',
                                                            opacity: notif.read ? 0 : 1
                                                        }}></div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '0.875rem', color: notif.read ? 'var(--text-muted)' : 'white', fontWeight: notif.read ? 'normal' : '500' }}>
                                                                {notif.message}
                                                            </p>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                                                {new Date(notif.date).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-text-muted bg-white/5 py-1.5 px-3 rounded-full">
                                    <User size={14} />
                                    <span className="font-medium">{user.username}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-accent-red/20 text-accent-red rounded-xl transition-colors"
                                    title="Deconectare"
                                >
                                    <LogOut size={20} />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="btn-primary bg-white/10 hover:bg-white/20 text-white" style={{ padding: '0.6rem 1.2rem' }}>Intră în cont</Link>
                                <Link to="/register" className="btn-primary" style={{ padding: '0.6rem 1.2rem' }}>Cont nou</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
