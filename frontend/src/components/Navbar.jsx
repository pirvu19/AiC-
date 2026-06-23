import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Mountain, LogOut, User, ShieldCheck, PlusCircle, Search, Users, Cloud, Bell, Check, Trash2, UserCheck, Layers, Menu, X, Wind, BarChart2, Activity, PieChart } from 'lucide-react';

const Navbar = () => {
    const { user, logout, isAdmin, isExpert, isReviewer, isDataEngineer, isUserAdmin } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAdminDropdown, setShowAdminDropdown] = useState(false);
    const [showMeteoDropdown, setShowMeteoDropdown] = useState(false);
    const [showStatsDropdown, setShowStatsDropdown] = useState(false);
    const adminRef = useRef(null);
    const meteoRef = useRef(null);
    const statsRef = useRef(null);
    const navigate = useNavigate();
    const isRestrictedAdmin = isUserAdmin && !isAdmin;

    // Închide dropdown-urile când se dă click în afara lor
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (adminRef.current && !adminRef.current.contains(e.target)) {
                setShowAdminDropdown(false);
            }
            if (meteoRef.current && !meteoRef.current.contains(e.target)) {
                setShowMeteoDropdown(false);
            }
            if (statsRef.current && !statsRef.current.contains(e.target)) {
                setShowStatsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

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
                                {/* ── Dropdown Meteo & Risc (numai pt admin) ── */}
                                {isAdmin ? (
                                    <div ref={meteoRef} style={{ position: 'relative' }}>
                                        <button
                                            onClick={() => { setShowMeteoDropdown(v => !v); setShowAdminDropdown(false); setShowStatsDropdown(false); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                fontSize: '0.875rem', fontWeight: 500,
                                                color: showMeteoDropdown ? 'var(--primary)' : 'inherit',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                padding: '0.25rem 0', transition: 'color 0.2s',
                                            }}
                                        >
                                            <Cloud size={18} />
                                            <span>Meteo & Risc</span>
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                                                style={{ transition: 'transform 0.2s', transform: showMeteoDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>

                                        {showMeteoDropdown && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0,
                                                minWidth: '210px',
                                                background: '#0f172a',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '1rem',
                                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)',
                                                padding: '0.5rem',
                                                zIndex: 1000,
                                            }}>
                                                <Link to="/rapoarte-risc"
                                                    onClick={() => setShowMeteoDropdown(false)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                        padding: '0.65rem 0.9rem', borderRadius: '0.65rem',
                                                        fontSize: '0.875rem', fontWeight: 500, color: 'inherit',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <Cloud size={16} style={{ color: 'var(--primary)' }} />
                                                    Risc Avalanșe (PDF)
                                                </Link>
                                                <Link to="/meteo"
                                                    onClick={() => setShowMeteoDropdown(false)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                        padding: '0.65rem 0.9rem', borderRadius: '0.65rem',
                                                        fontSize: '0.875rem', fontWeight: 500, color: 'inherit',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <Cloud size={16} style={{ color: 'var(--primary)' }} />
                                                    Prognoză Montană
                                                </Link>
                                                <Link to="/meteo-ro"
                                                    onClick={() => setShowMeteoDropdown(false)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                        padding: '0.65rem 0.9rem', borderRadius: '0.65rem',
                                                        fontSize: '0.875rem', fontWeight: 500, color: 'inherit',
                                                        transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                >
                                                    <Wind size={16} style={{ color: 'var(--primary)' }} />
                                                    Meteo RO (Live)
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <Link to="/rapoarte-risc" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                            <Cloud size={18} />
                                            <span>Risc Avalanșe (PDF)</span>
                                        </Link>

                                        <Link to="/meteo" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                            <Cloud size={18} />
                                            <span>Prognoză</span>
                                        </Link>
                                        <Link to="/meteo-ro" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                                            <Wind size={18} />
                                            <span>Meteo RO</span>
                                        </Link>
                                    </>
                                )}

                                {/* ── Dropdown Statistici ── */}
                                <div ref={statsRef} style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => { 
                                            setShowStatsDropdown(v => !v); 
                                            setShowAdminDropdown(false); 
                                            setShowMeteoDropdown(false); 
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            fontSize: '0.875rem', fontWeight: 500,
                                            color: showStatsDropdown ? 'var(--primary)' : 'inherit',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            padding: '0.25rem 0', transition: 'color 0.2s',
                                        }}
                                    >
                                        <BarChart2 size={18} />
                                        <span>Statistici</span>
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                                            style={{ transition: 'transform 0.2s', transform: showStatsDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>

                                    {showStatsDropdown && (
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0,
                                            minWidth: '320px',
                                            background: '#0f172a',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '1rem',
                                            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)',
                                            padding: '0.75rem',
                                            zIndex: 1000,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem',
                                        }}>
                                            <Link to="/statistici"
                                                onClick={() => setShowStatsDropdown(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                                    padding: '0.75rem 0.9rem', borderRadius: '0.75rem',
                                                    color: 'inherit', textDecoration: 'none',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <BarChart2 size={18} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>Risc Avalanșă</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                                                        Evoluția gradelor de risc în zonele monitorizate
                                                    </div>
                                                </div>
                                            </Link>
                                            
                                            <Link to="/statistici/bilant-uman"
                                                onClick={() => setShowStatsDropdown(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                                    padding: '0.75rem 0.9rem', borderRadius: '0.75rem',
                                                    color: 'inherit', textDecoration: 'none',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <Activity size={18} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>Bilanț Uman &amp; Victime</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                                                        Focus pe siguranță, decese/salvări, echipamente folosite
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link to="/statistici/analiza-teren"
                                                onClick={() => setShowStatsDropdown(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                                    padding: '0.75rem 0.9rem', borderRadius: '0.75rem',
                                                    color: 'inherit', textDecoration: 'none',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <Mountain size={18} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>Analiza Terenului</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                                                        Top masive active, orientări pante, altitudini vs. înclinație
                                                    </div>
                                                </div>
                                            </Link>

                                            <Link to="/statistici/cauze-tipologii"
                                                onClick={() => setShowStatsDropdown(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                                    padding: '0.75rem 0.9rem', borderRadius: '0.75rem',
                                                    color: 'inherit', textDecoration: 'none',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <PieChart size={18} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff' }}>Cauze &amp; Tipologii</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', lineHeight: '1.3' }}>
                                                        Tipuri de zăpadă, cauze naturale vs. umane, dimensiuni
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                </div>
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
                            <div ref={adminRef} style={{ position: 'relative' }}>
                                {/* Trigger */}
                                <button
                                    onClick={() => { setShowAdminDropdown(v => !v); setShowMeteoDropdown(false); setShowStatsDropdown(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        fontSize: '0.875rem', fontWeight: 500,
                                        color: showAdminDropdown ? 'var(--primary)' : 'inherit',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '0.25rem 0', transition: 'color 0.2s',
                                    }}
                                >
                                    <Layers size={18} />
                                    <span>Administrare</span>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                                        style={{ transition: 'transform 0.2s', transform: showAdminDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>

                                {/* Dropdown panel */}
                                {showAdminDropdown && (
                                    <div style={{
                                        position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                                        minWidth: '200px',
                                        background: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '1rem',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)',
                                        padding: '0.5rem',
                                        zIndex: 1000,
                                    }}>
                                        <Link to="/admin/users"
                                            onClick={() => setShowAdminDropdown(false)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                padding: '0.65rem 0.9rem', borderRadius: '0.65rem',
                                                fontSize: '0.875rem', fontWeight: 500, color: 'inherit',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <Users size={16} style={{ color: 'var(--primary)' }} />
                                            Utilizatori
                                        </Link>
                                        <Link to="/admin/requests"
                                            onClick={() => setShowAdminDropdown(false)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                padding: '0.65rem 0.9rem', borderRadius: '0.65rem',
                                                fontSize: '0.875rem', fontWeight: 500, color: 'inherit',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                                            Cereri Conturi
                                        </Link>
                                        {(isAdmin || isDataEngineer) && (
                                            <Link to="/admin/metadata"
                                                onClick={() => setShowAdminDropdown(false)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                    padding: '0.65rem 0.9rem', borderRadius: '0.65rem',
                                                    fontSize: '0.875rem', fontWeight: 500, color: 'inherit',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <Layers size={16} style={{ color: 'var(--primary)' }} />
                                                Metadate
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Notification & User Actions */}
                    <div className="flex items-center gap-3 md:pl-6 md:border-l relative">
                        {user ? (
                            <>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="p-2 transition-colors rounded-full hover:bg-white/5"
                                        title="Notificări"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Bell size={20} className="text-white" />
                                    </button>
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>

                                <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted bg-white/5 py-1.5 px-3 rounded-full border border-white/5">
                                    <User size={14} />
                                    <span className="font-medium truncate max-w-[100px]">{user.username}</span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-accent-red/20 text-accent-red rounded-xl transition-colors"
                                    title="Deconectare"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <LogOut size={20} />
                                </button>

                                {showNotifications && (
                                    <div className="navbar-notifications-dropdown">
                                        {/* Dropdown Header */}
                                        <div className="notifications-header">
                                            <div className="notifications-header-title">
                                                <div className="notifications-icon-bg">
                                                    <Bell size={18} className="text-primary" />
                                                </div>
                                                <span>Centru Notificări</span>
                                            </div>
                                            <div className="notifications-header-actions">
                                                <button 
                                                    onClick={markAllAsRead} 
                                                    className="notifications-action-btn"
                                                    title="Marchează toate ca citite"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button 
                                                    onClick={clearAll} 
                                                    className="notifications-action-btn delete"
                                                    title="Șterge tot istoricul"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dropdown Body / List */}
                                        <div className="notifications-list custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <div className="notifications-empty-state">
                                                    <div className="notifications-empty-icon">
                                                        <Bell size={28} />
                                                    </div>
                                                    <p>Nu ai nicio notificare momentan.</p>
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => { markAsRead(notif.id); setShowNotifications(false); }}
                                                        className={`notification-item ${notif.read ? 'read' : 'unread'} ${notif.type === 'admin' ? 'admin' : 'activity'}`}
                                                    >
                                                        {/* Status badge / icon */}
                                                        <div className="notification-item-icon-wrap">
                                                            {notif.type === 'admin' ? <ShieldCheck size={18} /> : <Mountain size={18} />}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="notification-item-content">
                                                            <div className="notification-item-meta">
                                                                <span className="notification-item-type">
                                                                    {notif.type === 'admin' ? 'Sistem' : 'Activitate'}
                                                                </span>
                                                                {!notif.read && <span className="notification-unread-dot" />}
                                                            </div>
                                                            <p className="notification-item-message">{notif.message}</p>
                                                            <div className="notification-item-time">
                                                                <span>{new Date(notif.date).toLocaleDateString()}</span>
                                                                <span className="time-separator">|</span>
                                                                <span>{new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                <Link to="/rapoarte-risc" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Cloud size={18} className="text-primary" />
                                    <span>Risc Avalanșe (PDF)</span>
                                </Link>
                                <Link to="/meteo" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Cloud size={18} className="text-primary" />
                                    <span>Prognoză Montană</span>
                                </Link>
                                <Link to="/meteo-ro" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                    <Wind size={18} className="text-primary" />
                                    <span>Meteo RO</span>
                                </Link>
                                <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-2">
                                    <span className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest">Statistici</span>
                                    <Link to="/statistici" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                        <BarChart2 size={18} className="text-primary" />
                                        <span>Risc Avalanșă</span>
                                    </Link>
                                    <Link to="/statistici/bilant-uman" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                        <Activity size={18} className="text-primary" />
                                        <span>Bilanț Uman &amp; Victime</span>
                                    </Link>
                                    <Link to="/statistici/analiza-teren" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                        <Mountain size={18} className="text-primary" />
                                        <span>Analiza Terenului</span>
                                    </Link>
                                    <Link to="/statistici/cauze-tipologii" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm font-medium">
                                        <PieChart size={18} className="text-primary" />
                                        <span>Cauze &amp; Tipologii</span>
                                    </Link>
                                </div>
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
