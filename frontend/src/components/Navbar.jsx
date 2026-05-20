import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Mountain, LogOut, User, ShieldCheck, PlusCircle, Search, Users, Cloud, Bell, Check, Trash2, UserCheck, Layers, Menu, X, Wind, BarChart2 } from 'lucide-react';

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
                            <>
                                <a href="/api/meteo" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <Cloud size={18} />
                                    <span>Risc Avalanșe (PDF)</span>
                                </a>

                                <Link to="/meteo" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <Cloud size={18} />
                                    <span>Prognoză</span>
                                </Link>
                                <Link to="/meteo-ro" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <Wind size={18} />
                                    <span>Meteo RO</span>
                                </Link>
                                <Link to="/statistici" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <BarChart2 size={18} />
                                    <span>Statistici</span>
                                </Link>
                                <Link to="/map3d" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                    <Mountain size={18} />
                                    <span>Hartă 3D</span>
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
                                    <div 
                                        className="absolute top-full right-0 mt-4 w-80 md:w-[450px] rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.9)] z-[1000] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 border border-white/10"
                                        style={{ backgroundColor: '#0f172a', opacity: 1 }}
                                    >
                                        <div className="flex items-center justify-between p-5 bg-[#1e293b]/50 border-b border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <Bell size={20} className="text-primary" />
                                                </div>
                                                <h3 className="text-base font-bold text-white m-0 tracking-tight">Centru Notificări</h3>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={markAllAsRead} 
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all bg-transparent" 
                                                    title="Marchează toate ca citite"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button 
                                                    onClick={clearAll} 
                                                    className="p-2 text-accent-red/70 hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all bg-transparent" 
                                                    title="Șterge tot istoricul"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-[#0f172a]">
                                            {notifications.length === 0 ? (
                                                <div className="p-16 text-center flex flex-col items-center gap-4">
                                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                                        <Bell size={32} className="text-slate-700" />
                                                    </div>
                                                    <p className="text-slate-500 text-sm font-medium m-0">Nu ai nicio notificare momentan.</p>
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => { markAsRead(notif.id); setShowNotifications(false); }}
                                                        className={`p-5 border-b border-white/5 cursor-pointer flex gap-5 transition-all duration-300 ${
                                                            notif.read 
                                                            ? 'bg-[#0f172a] hover:bg-[#1e293b]/30' 
                                                            : 'bg-[#1e293b]/80 hover:bg-[#1e293b] border-l-4 border-l-primary'
                                                        }`}
                                                    >
                                                        <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                                                            notif.type === 'admin' 
                                                            ? 'bg-primary/20 text-primary' 
                                                            : 'bg-accent-green/20 text-accent-green'
                                                        }`}>
                                                            {notif.type === 'admin' ? <ShieldCheck size={20} /> : <Mountain size={20} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${notif.type === 'admin' ? 'text-primary' : 'text-accent-green'}`}>
                                                                    {notif.type === 'admin' ? 'Sistem' : 'Activitate'}
                                                                </span>
                                                                {!notif.read && (
                                                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                                                                )}
                                                            </div>
                                                            <p className={`m-0 text-sm leading-relaxed break-words ${notif.read ? 'text-slate-400' : 'text-slate-100 font-semibold'}`}>
                                                                {notif.message}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-3">
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                                                    <span>{new Date(notif.date).toLocaleDateString()}</span>
                                                                    <span className="opacity-30">|</span>
                                                                    <span>{new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                </div>
                                                            </div>
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
                                <a href="/api/meteo" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Cloud size={18} className="text-primary" />
                                    <span>Risc Avalanșe (PDF)</span>
                                </a>
                                <Link to="/meteo" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Cloud size={18} className="text-primary" />
                                    <span>Prognoză Montană</span>
                                </Link>
                                <Link to="/meteo-ro" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Wind size={18} className="text-primary" />
                                    <span>Meteo RO</span>
                                </Link>
                                <Link to="/statistici" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <BarChart2 size={18} className="text-primary" />
                                    <span>Statistici Risc</span>
                                </Link>
                                <Link to="/map3d" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Mountain size={18} className="text-primary" />
                                    <span>Hartă 3D Interactivă</span>
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
