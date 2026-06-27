import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const MultiSelect = ({ options = [], value = [], onChange, placeholder = "Selectează...", label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const updateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            updateDropdownPosition();
            window.addEventListener('scroll', updateDropdownPosition, true);
            window.addEventListener('resize', updateDropdownPosition);
        }
        return () => {
            window.removeEventListener('scroll', updateDropdownPosition, true);
            window.removeEventListener('resize', updateDropdownPosition);
        };
    }, [isOpen, updateDropdownPosition]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            const portalRoot = document.getElementById('portal-root');
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target) &&
                portalRoot &&
                !portalRoot.contains(e.target)
            ) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (id) => {
        const next = value.includes(id)
            ? value.filter(v => v !== id)
            : [...value, id];
        onChange(next);
    };

    const handleTriggerClick = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    };

    const filteredOptions = options.filter(opt => {
        const name = (opt.name || opt.direction || opt.description || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    // Theme-aware dropdown styles
    const dropdownBg = isLight ? '#ffffff' : '#1e293b';
    const dropdownBorder = isLight ? '1px solid rgba(37, 99, 235, 0.15)' : '1px solid rgba(255,255,255,0.1)';
    const dropdownShadow = isLight
        ? '0 20px 60px rgba(37,99,235,0.12), 0 4px 16px rgba(0,0,0,0.04)'
        : '0 20px 60px rgba(0,0,0,0.8)';

    const dropdown = isOpen ? createPortal(
        <div
            style={{
                ...dropdownStyle,
                backgroundColor: dropdownBg,
                border: dropdownBorder,
                boxShadow: dropdownShadow,
                borderRadius: '1rem',
                overflow: 'hidden',
            }}
        >
            <div style={{ maxHeight: '240px', overflowY: 'auto' }} className="custom-scrollbar">
                <div style={{ padding: '6px' }}>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => {
                            const isSelected = value.includes(opt.id);
                            return (
                                <div
                                    key={opt.id}
                                    onMouseDown={(e) => { e.preventDefault(); toggleOption(opt.id); }}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '0.6rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '2px',
                                        fontSize: '0.875rem',
                                        fontWeight: isSelected ? '700' : '400',
                                        backgroundColor: isSelected
                                            ? 'var(--primary)'
                                            : 'transparent',
                                        color: isSelected
                                            ? '#ffffff'
                                            : (isLight ? '#334155' : '#cbd5e1'),
                                        transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = isLight
                                                ? 'rgba(37, 99, 235, 0.06)'
                                                : 'rgba(255,255,255,0.08)';
                                            e.currentTarget.style.color = isLight ? '#0f172a' : '#ffffff';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = isLight ? '#334155' : '#cbd5e1';
                                        }
                                    }}
                                >
                                    <span>{opt.name || opt.direction || opt.description}</span>
                                    {isSelected && <Check size={14} color="#ffffff" />}
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: isLight ? '#94a3b8' : '#475569', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Niciun rezultat găsit
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.getElementById('portal-root')
    ) : null;

    return (
        <div className="relative space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 text-center" ref={containerRef}>
            <label className="text-[10px] uppercase font-black text-dark-blue px-1 tracking-widest flex items-center justify-center gap-2">
                {label}
                {value.length > 0 && (
                    <span className="text-primary bg-primary/10 px-1.5 rounded-md">{value.length}</span>
                )}
            </label>

            <div
                style={{
                    minHeight: '3rem',
                    padding: '8px',
                    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.05)',
                    border: isOpen
                        ? `2px solid var(--primary)`
                        : isLight
                            ? '1px solid rgba(37,99,235,0.18)'
                            : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0.75rem',
                    cursor: 'text',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen
                        ? '0 0 0 4px rgba(59,130,246,0.1)'
                        : isLight
                            ? '0 2px 8px rgba(37,99,235,0.05)'
                            : 'none',
                }}
                onClick={handleTriggerClick}
            >
                {value.length === 0 && !isOpen && (
                    <span style={{
                        color: isLight ? '#94a3b8' : 'rgba(148,163,184,0.5)',
                        fontSize: '0.875rem',
                        padding: '6px 8px',
                        textAlign: 'center',
                        width: '100%',
                    }}>
                        {placeholder}
                    </span>
                )}

                {value.map(id => {
                    const opt = options.find(o => o.id === id);
                    if (!opt) return null;
                    return (
                        <span
                            key={id}
                            className="bg-primary hover:bg-primary-hover text-white text-[11px] font-black py-1 px-3 rounded-lg flex items-center gap-2 shadow-lg animate-in zoom-in-95 duration-200"
                        >
                            {opt.name || opt.direction || opt.description}
                            <X
                                size={12}
                                className="cursor-pointer hover:scale-125 transition-transform"
                                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); toggleOption(id); }}
                            />
                        </span>
                    );
                })}

                {isOpen && (
                    <input
                        ref={inputRef}
                        autoFocus
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '4px',
                            fontSize: '0.875rem',
                            outline: 'none',
                            color: isLight ? '#0f172a' : '#ffffff',
                            minWidth: '80px',
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Caută..."
                    />
                )}
            </div>

            {dropdown}
        </div>
    );
};

export default MultiSelect;