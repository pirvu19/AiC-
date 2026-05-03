import React from 'react';
import { Compass } from 'lucide-react';

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
    const toggleOrientation = (id) => {
        const newValue = value.includes(id)
            ? value.filter(i => i !== id)
            : [...value, id];
        onChange(newValue);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', backgroundColor: '#0B0F19', borderRadius: '24px', width: '100%', maxWidth: '384px', margin: '0 auto', userSelect: 'none' }}>

            {/* Busola */}
            <div
                style={{
                    width: '280px',
                    height: '280px',
                    position: 'relative',
                    borderRadius: '50%',
                    backgroundColor: '#111827',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}
            >
                {/* Liniile axelor */}
                <div style={{ position: 'absolute', width: '1px', height: '100%', left: '50%', top: '0', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ position: 'absolute', width: '100%', height: '1px', top: '50%', left: '0', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>

                {/* Centrul busolei cu iconița */}
                <div
                    style={{
                        position: 'absolute',
                        width: '50px',
                        height: '50px',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 5,
                        borderRadius: '50%',
                        backgroundColor: '#1F2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Compass style={{ width: '24px', height: '24px', color: value.length > 0 ? '#3B82F6' : '#64748B', transition: 'color 0.3s' }} />
                </div>

                {/* Butoanele cu stiluri EXPLICITE care nu pot fi suprascrise */}
                {ORIENTATIONS.map((opt) => {
                    const isActive = value.includes(opt.id);

                    return (
                        <button
                            key={opt.id}
                            onClick={() => toggleOrientation(opt.id)}
                            style={{
                                position: 'absolute',
                                top: opt.top,
                                left: opt.left,
                                // Scalare și centrare exactă
                                transform: `translate(-50%, -50%) scale(${isActive ? 1.1 : 1})`,
                                width: '48px',
                                height: '48px',
                                zIndex: 10,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',

                                // CULORILE FORȚATE AICI
                                backgroundColor: isActive ? '#2563EB' : '#1F2937', // Albastru activ, Gri închis inactiv
                                color: isActive ? '#FFFFFF' : '#9CA3AF',           // Alb activ, Gri deschis inactiv
                                border: isActive ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: isActive ? '0 0 15px rgba(37,99,235,0.6)' : 'none',
                                outline: 'none'
                            }}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {/* Sumar Selecție */}
            <div style={{ marginTop: '32px', minHeight: '24px' }}>
                {value.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                        <p style={{ color: '#60A5FA', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                            {value.length} {value.length === 1 ? 'direcție selectată' : 'direcții selectate'}
                        </p>
                    </div>
                ) : (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>Nicio direcție selectată</p>
                )}
            </div>
        </div>
    );
};

export default CompassFilter;