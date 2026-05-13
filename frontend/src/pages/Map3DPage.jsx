import { Mountain } from 'lucide-react';

const Map3DPage = () => {
    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: 'calc(100vh - 72px)',
                marginLeft: 'calc(-50vw + 50%)',
                marginTop: '-40px',
                backgroundColor: '#020617',
                overflow: 'hidden',
            }}
        >
            {/* Status + titlu – top-left */}
            <div style={{ position: 'absolute', top: '12px', left: '16px', zIndex: 20, display: 'flex', gap: '12px', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(12px)' }}>
                    <div style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sistem Activ</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '12px', backdropFilter: 'blur(12px)' }}>
                    <Mountain size={14} color="#38bdf8" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Explorator 3D Relief</span>
                </div>
            </div>

            {/* Harta fullscreen */}
            <iframe
                src="/map3d/avalanse_mapbox_demo_dropdown.html"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Mapbox 3D Avalanche Map"
                allow="geolocation"
            />

            {/* Controale – bottom-center */}
            <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 20, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: '9999px', backdropFilter: 'blur(12px)' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Navigare</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Click Stânga</span>
                    <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Orbit</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Click Dreapta</span>
                    <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Zoom</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Scroll Mouse</span>
                </div>
            </div>
        </div>
    );
};

export default Map3DPage;