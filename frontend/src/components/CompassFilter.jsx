import React from 'react';
import { Compass } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ORIENTATIONS = [
    { id: 1, label: 'N', top: '12%', left: '50%' },
    { id: 6, label: 'NE', top: '23%', left: '77%' },
    { id: 2, label: 'E', top: '50%', left: '88%' },
    { id: 13, label: 'SE', top: '77%', left: '77%' },
    { id: 5, label: 'S', top: '88%', left: '50%' },
    { id: 4, label: 'SV', top: '77%', left: '23%' },
    { id: 3, label: 'V', top: '50%', left: '12%' },
    { id: 10, label: 'NV', top: '23%', left: '23%' }
];

const CompassFilter = ({ value = [], onChange }) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const toggleOrientation = (id) => {
        const newValue = value.includes(id)
            ? value.filter(i => i !== id)
            : [...value, id];
        onChange(newValue);
    };

    // Theme-aware colors
    const outerBg = isLight ? 'rgba(239, 246, 255, 0.8)' : '#0B0F19';
    const outerBorder = isLight ? '1px solid rgba(37, 99, 235, 0.15)' : 'none';
    const circleBg = isLight
        ? 'linear-gradient(135deg, #f0f7ff 0%, #e0eeff 100%)'
        : '#111827';
    const circleBorder = isLight
        ? '1px solid rgba(37, 99, 235, 0.12)'
        : '1px solid rgba(255,255,255,0.05)';
    const circleBoxShadow = isLight
        ? 'inset 0 0 20px rgba(37,99,235,0.05)'
        : 'inset 0 0 20px rgba(0,0,0,0.5)';
    const axisColor = isLight ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255,255,255,0.05)';
    const centerBg = isLight ? '#ffffff' : '#1F2937';
    const centerBorder = isLight
        ? '1px solid rgba(37, 99, 235, 0.15)'
        : '1px solid rgba(255,255,255,0.1)';

    const btnActiveBg = '#2563EB';
    const btnActiveColor = '#FFFFFF';
    const btnActiveBorder = '1px solid #60A5FA';
    const btnActiveBoxShadow = '0 0 15px rgba(37,99,235,0.6)';

    const btnInactiveBg = isLight ? 'rgba(255, 255, 255, 0.9)' : '#1F2937';
    const btnInactiveColor = isLight ? '#334155' : '#9CA3AF';
    const btnInactiveBorder = isLight
        ? '1px solid rgba(37, 99, 235, 0.2)'
        : '1px solid rgba(255,255,255,0.1)';

    const noSelectionColor = isLight ? 'rgba(71, 85, 105, 0.6)' : 'rgba(255,255,255,0.3)';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: outerBg,
            borderRadius: '20px',
            border: outerBorder,
            width: '100%',
            maxWidth: '340px',
            margin: '0 auto',
            userSelect: 'none',
            boxShadow: isLight ? '0 4px 20px rgba(37,99,235,0.06)' : 'none',
            transition: 'all 0.3s ease',
        }}>

            {/* Busola */}
            <div
                style={{
                    width: '260px',
                    height: '260px',
                    position: 'relative',
                    borderRadius: '50%',
                    background: circleBg,
                    boxShadow: circleBoxShadow,
                    border: circleBorder,
                }}
            >
                {/* Liniile axelor */}
                <div style={{ position: 'absolute', width: '1px', height: '100%', left: '50%', top: '0', backgroundColor: axisColor }}></div>
                <div style={{ position: 'absolute', width: '100%', height: '1px', top: '50%', left: '0', backgroundColor: axisColor }}></div>

                {/* Centrul busolei cu iconița */}
                <div
                    style={{
                        position: 'absolute',
                        width: '48px',
                        height: '48px',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 5,
                        borderRadius: '50%',
                        backgroundColor: centerBg,
                        border: centerBorder,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isLight ? '0 2px 8px rgba(37,99,235,0.1)' : 'none',
                    }}
                >
                    <Compass style={{ width: '22px', height: '22px', color: value.length > 0 ? '#3B82F6' : (isLight ? '#94a3b8' : '#64748B'), transition: 'color 0.3s' }} />
                </div>

                {/* Butoanele direcționale */}
                {ORIENTATIONS.map((opt) => {
                    const isActive = value.includes(opt.id);

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleOrientation(opt.id)}
                            style={{
                                position: 'absolute',
                                top: opt.top,
                                left: opt.left,
                                transform: `translate(-50%, -50%) scale(${isActive ? 1.1 : 1})`,
                                width: '46px',
                                height: '46px',
                                zIndex: 10,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                backgroundColor: isActive ? btnActiveBg : btnInactiveBg,
                                color: isActive ? btnActiveColor : btnInactiveColor,
                                border: isActive ? btnActiveBorder : btnInactiveBorder,
                                boxShadow: isActive ? btnActiveBoxShadow : (isLight ? '0 2px 6px rgba(37,99,235,0.08)' : 'none'),
                                outline: 'none',
                            }}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {/* Sumar Selecție */}
            <div style={{ marginTop: '20px', minHeight: '24px' }}>
                {value.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block' }} />
                        <p style={{ color: '#60A5FA', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                            {value.length} {value.length === 1 ? 'direcție selectată' : 'direcții selectate'}
                        </p>
                    </div>
                ) : (
                    <p style={{ color: noSelectionColor, fontSize: '14px', margin: 0 }}>Nicio direcție selectată</p>
                )}
            </div>
        </div>
    );
};

export default CompassFilter;