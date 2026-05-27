import React, { useState, useEffect, useCallback, useRef } from 'react';

const SingleSlider = ({ min, max, step, value, onChange, label, suffix = '' }) => {
    const range = useRef(null);

    const getPercent = useCallback(
        (val) => Math.round(((val - min) / (max - min)) * 100),
        [min, max]
    );

    useEffect(() => {
        if (range.current) {
            const percent = getPercent(value);
            range.current.style.left = '0%';
            range.current.style.width = `${percent}%`;
        }
    }, [value, getPercent]);

    return (
        <div className="search-slider-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span className="search-slider-label">{label}</span>
                <span className="search-slider-value">
                    Min: {value}{suffix}
                </span>
            </div>

            <div className="range-slider-container">
                {/* Background track */}
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
                
                {/* Active track (colored) */}
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
                
                {/* Slider input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="thumb"
                    style={{
                        pointerEvents: 'all',
                        position: 'absolute',
                        height: '0',
                        width: '100%',
                        outline: 'none',
                        background: 'none',
                        border: 'none',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 10
                    }}
                />
            </div>
        </div>
    );
};

export default SingleSlider;
