import React, { useState, useEffect, useCallback, useRef } from 'react';

const RangeSlider = ({ min, max, step, minVal, maxVal, onChange, label, suffix = '' }) => {
    const range = useRef(null);

    const getPercent = useCallback(
        (value) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    useEffect(() => {
        if (range.current) {
            const minPercent = getPercent(minVal);
            const maxPercent = getPercent(maxVal);

            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minVal, maxVal, getPercent]);

    return (
        <div className="search-slider-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span className="search-slider-label">{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="search-slider-value">
                        {minVal}{suffix}
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontWeight: 'bold' }}>—</span>
                    <span className="search-slider-value">
                        {maxVal}{suffix}
                    </span>
                </div>
            </div>

            <div className="range-slider-container">
                <div 
                    style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        height: '6px', 
                        width: '100%', 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        borderRadius: '999px' 
                    }} 
                />
                
                <div 
                    ref={range} 
                    style={{
                        position: 'absolute',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '6px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '999px',
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)',
                        zIndex: 2
                    }}
                />
                
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minVal}
                    onChange={(e) => {
                        const value = Math.min(Number(e.target.value), maxVal - 1);
                        onChange('min', value);
                    }}
                    className="thumb thumb--left"
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxVal}
                    onChange={(e) => {
                        const value = Math.max(Number(e.target.value), minVal + 1);
                        onChange('max', value);
                    }}
                    className="thumb thumb--right"
                />
            </div>
        </div>
    );
};

export default RangeSlider;

