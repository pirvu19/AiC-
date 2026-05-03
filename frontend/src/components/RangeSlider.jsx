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
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex justify-between items-center mb-8">
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 min-w-[60px] text-center">
                        {minVal}{suffix}
                    </span>
                    <span className="text-white/20 font-bold">—</span>
                    <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 min-w-[60px] text-center">
                        {maxVal}{suffix}
                    </span>
                </div>
            </div>

            <div className="range-slider-container relative h-6 flex items-center">
                <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-full bg-white/10 rounded-full" />
                
                <div 
                    ref={range} 
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] z-[2]" 
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
