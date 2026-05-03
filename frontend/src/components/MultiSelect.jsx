import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';

const MultiSelect = ({ options = [], value = [], onChange, placeholder = "Selectează...", label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const inputRef = useRef(null);

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

    const dropdown = isOpen ? createPortal(
        <div
            style={{ ...dropdownStyle, backgroundColor: '#1e293b' }}
            className="rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
        >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(opt => {
                        const isSelected = value.includes(opt.id);
                        return (
                            <div
                                key={opt.id}
                                onMouseDown={(e) => { e.preventDefault(); toggleOption(opt.id); }}
                                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all mb-1 ${isSelected
                                        ? 'bg-primary text-white font-black'
                                        : 'hover:bg-white/10 text-slate-300 hover:text-white'
                                    }`}
                            >
                                <span className="text-sm">{opt.name || opt.direction || opt.description}</span>
                                {isSelected && <Check size={14} />}
                            </div>
                        );
                    })
                ) : (
                    <div className="p-4 text-center text-slate-500 text-xs italic">
                        Niciun rezultat găsit
                    </div>
                )}
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
                className={`min-h-[3rem] p-2 bg-glass-bg/50 border border-glass-border rounded-xl cursor-text flex flex-wrap gap-2 justify-center transition-all duration-300 ${isOpen
                        ? 'ring-2 ring-primary/30 border-primary shadow-2xl bg-glass-bg'
                        : 'hover:border-glass-border-hover/30'
                    }`}
                onClick={handleTriggerClick}
            >
                {value.length === 0 && !isOpen && (
                    <span className="text-dark-blue text-sm py-1.5 px-2 text-center w-full">
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
                        className="flex-1 bg-transparent border-none p-1 text-sm outline-none text-white placeholder-dark-blue/50"
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