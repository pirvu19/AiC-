import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Mountain, LogOut, User, ShieldCheck, PlusCircle, Search, Users, Cloud, Bell, Check, Trash2, UserCheck, Layers, Menu, X } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAdmin, isExpert, isUserAdmin, isReviewer, isDataEngineer } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isRestrictedAdmin = isUserAdmin && !isAdmin;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass sticky top-0 z-50 py-4 mb-10">
            <div className="container flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
                    <Mountain className="text-primary" size={28} />
                    <span className="text-text-main">AIC Avalanse</span>
                </Link>

                {/* Desktop Menu & Action Icons */}
                <div className="flex items-center gap-4">
                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
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
                                    <span>Prognoză</span>
                                </Link>

                                {(isAdmin || (!isReviewer && !isDataEngineer)) && (
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
                                    <span>Cereri</span>
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

                    {/* Notification & User Actions */}
                    <div className="flex items-center gap-3 md:pl-6 md:border-l relative">
                        {user ? (
                            <>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 transition-colors relative rounded-full hover:bg-white/5"
                                    title="Notificări"
                                >
                                    <Bell size={20} className="text-text-main" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute top-full right-0 mt-4 w-80 md:w-96 bg-[#1e2330] border border-glass-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2">
                                        <div className="flex items-center justify-between p-4 border-b border-glass-border">
                                            <h3 className="font-semibold text-text-main m-0">Notificări</h3>
                                            <div className="flex gap-2">
                                                <button onClick={markAllAsRead} className="text-text-muted hover:text-primary transition-colors bg-transparent" title="Marchează ca citite">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={clearAll} className="text-accent-red hover:text-accent-red/80 transition-colors bg-transparent" title="Șterge toate">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-text-muted text-sm italic">Nu ai nicio notificare.</div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => { markAsRead(notif.id); setShowNotifications(false); }}
                                                        className={`p-4 border-b border-white/5 cursor-pointer flex gap-3 transition-colors ${notif.read ? 'hover:bg-white/5' : 'bg-white/10 hover:bg-white/15'}`}
                                                    >
                                                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'admin' ? 'bg-primary' : 'bg-accent-green'} ${notif.read ? 'opacity-0' : 'opacity-1'}`}></div>
                                                        <div className="flex-1">
                                                            <p className={`m-0 text-sm leading-relaxed ${notif.read ? 'text-text-muted' : 'text-white font-medium'}`}>{notif.message}</p>
                                                            <span className="text-[10px] text-text-muted mt-1.5 block">{new Date(notif.date).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
                                    <User size={14} />
                                    <span className="font-medium truncate max-w-[100px]">{user.username}</span>
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
                            <div className="hidden sm:flex items-center gap-3">
                                <Link to="/login" className="text-sm font-medium text-white hover:text-primary transition-colors px-2">Intră în cont</Link>
                                <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Cont nou</Link>
                            </div>
                        )}

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-text-main hover:bg-white/5 rounded-lg"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden mt-4 border-t border-glass-border bg-[#0f172a]/95 backdrop-blur-xl animate-in slide-in-from-top-2">
                    <div className="container py-6 flex flex-col gap-4">
                        {!isRestrictedAdmin && (
                            <>
                                <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <span>Acasă</span>
                                </Link>
                                <a href="/api/meteo" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Cloud size={18} className="text-primary" />
                                    <span>Risc Avalanșe (PDF)</span>
                                </a>
                                <Link to="/meteo" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Cloud size={18} className="text-primary" />
                                    <span>Prognoză Montană</span>
                                </Link>
                                {(isAdmin || (!isReviewer && !isDataEngineer)) && (
                                    <Link to="/add" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                        <PlusCircle size={18} className="text-primary" />
                                        <span>Eveniment Nou</span>
                                    </Link>
                                )}
                            </>
                        )}

                        {(isExpert || isReviewer) && (
                            <Link to="/validation" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                <ShieldCheck size={18} className="text-primary" />
                                <span>Validare Evenimente</span>
                            </Link>
                        )}

                        {user && (
                            <Link to="/search" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                <Search size={18} className="text-primary" />
                                <span>Căutare Rapoarte</span>
                            </Link>
                        )}

                        {(isUserAdmin || isDataEngineer) && (
                            <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-2">
                                <span className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">Administrare</span>
                                <Link to="/admin/users" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Users size={18} className="text-primary" />
                                    <span>Gestiune Utilizatori</span>
                                </Link>
                                <Link to="/admin/requests" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <UserCheck size={18} className="text-primary" />
                                    <span>Cereri Conturi</span>
                                </Link>
                                {(isAdmin || isDataEngineer) && (
                                    <Link to="/admin/metadata" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                        <Layers size={18} className="text-primary" />
                                        <span>Gestiune Metadate</span>
                                    </Link>
                                )}
                            </div>
                        )}

                        {!user && (
                            <div className="mt-4 flex flex-col gap-3">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn-primary bg-white/10 text-white w-full">Intră în cont</Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn-primary w-full">Cont nou</Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
