import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Layers, Plus, Edit2, Trash2, Save, X, ChevronRight, Map, Mountain, HelpCircle, Compass } from 'lucide-react';

const MetadataManagement = () => {
    const [activeTab, setActiveTab] = useState('massifs');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [editSecondaryValue, setEditSecondaryValue] = useState(''); // For Region ID in Massifs
    const [newValue, setNewValue] = useState('');
    const [newSecondaryValue, setNewSecondaryValue] = useState('');
    const [regions, setRegions] = useState([]);
    const { user } = useAuth();

    const tabs = [
        { id: 'massifs', label: 'Masive', icon: <Mountain size={18} />, endpoint: '/metadata/massifs', field: 'name' },
        { id: 'regions', label: 'Regiuni', icon: <Map size={18} />, endpoint: '/metadata/regions', field: 'name' },
        { id: 'types', label: 'Tipuri', icon: <Layers size={18} />, endpoint: '/metadata/types', field: 'name' },
        { id: 'causes', label: 'Cauze', icon: <HelpCircle size={18} />, endpoint: '/metadata/causes', field: 'description' },
        { id: 'orientations', label: 'Orientări', icon: <Compass size={18} />, endpoint: '/metadata/orientations', field: 'direction' },
    ];

    const currentTab = tabs.find(t => t.id === activeTab);

    useEffect(() => {
        fetchItems();
        if (activeTab === 'massifs') {
            fetchRegions();
        }
    }, [activeTab]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await api.get(currentTab.endpoint);
            setItems(response.data);
        } catch (err) {
            console.error("Error fetching metadata:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRegions = async () => {
        try {
            const response = await api.get('/metadata/regions');
            setRegions(response.data);
        } catch (err) {
            console.error("Error fetching regions:", err);
        }
    };

    const handleCreate = async () => {
        if (!newValue) return;
        try {
            const payload = { [currentTab.field]: newValue };
            if (activeTab === 'massifs' && newSecondaryValue) {
                payload.region = { id: parseInt(newSecondaryValue) };
            }
            await api.post(currentTab.endpoint, payload);
            setNewValue('');
            setNewSecondaryValue('');
            fetchItems();
        } catch (err) {
            console.error("Error creating item:", err);
        }
    };

    const handleUpdate = async (id) => {
        try {
            const payload = { [currentTab.field]: editValue };
            if (activeTab === 'massifs' && editSecondaryValue) {
                payload.region = { id: parseInt(editSecondaryValue) };
            }
            await api.put(`${currentTab.endpoint}/${id}`, payload);
            setEditingId(null);
            fetchItems();
        } catch (err) {
            console.error("Error updating item:", err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Sigur vrei să ștergi acest element?")) return;
        try {
            await api.delete(`${currentTab.endpoint}/${id}`);
            fetchItems();
        } catch (err) {
            console.error("Error deleting item:", err);
            alert("Nu se poate șterge elementul. Probabil este folosit în avalanșe deja raportate.");
        }
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        setEditValue(item[currentTab.field]);
        if (activeTab === 'massifs' && item.region) {
            setEditSecondaryValue(item.region.id.toString());
        } else {
            setEditSecondaryValue('');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 underline decoration-primary/40 underline-offset-8 decoration-4">Management Metadate</h1>
                    <p className="text-slate-400 text-sm font-medium">Configurează opțiunile globale ale platformei</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* List Section */}
                <div className="md:col-span-2 space-y-4">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
                        {loading && (
                            <div className="p-12 text-center text-slate-500">Se încarcă...</div>
                        )}
                        
                        {!loading && items.length === 0 && (
                            <div className="p-12 text-center text-slate-500">Nu există elemente în această categorie.</div>
                        )}

                        {!loading && items.length > 0 && (
                            <div className="divide-y divide-white/5">
                                {items.map((item) => (
                                    <div key={item.id} className="p-4 hover:bg-white/5 transition-colors group">
                                        {editingId === item.id ? (
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        className="flex-1 bg-slate-800 border border-primary/30 rounded-lg px-3 py-2 text-white outline-none focus:border-primary"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                    {activeTab === 'massifs' && (
                                                        <select
                                                            className="bg-slate-800 border border-primary/30 rounded-lg px-3 py-2 text-white outline-none focus:border-primary text-sm"
                                                            value={editSecondaryValue}
                                                            onChange={(e) => setEditSecondaryValue(e.target.value)}
                                                        >
                                                            <option value="">Alege regiune...</option>
                                                            {regions.map(r => (
                                                                <option key={r.id} value={r.id}>{r.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-white">
                                                        <X size={18} />
                                                    </button>
                                                    <button onClick={() => handleUpdate(item.id)} className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-white text-xs font-bold">
                                                        <Save size={14} /> Salvează
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                        {item.id}
                                                    </div>
                                                    <div>
                                                        <span className="text-white font-medium">{item[currentTab.field]}</span>
                                                        {activeTab === 'massifs' && item.region && (
                                                            <span className="ml-3 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                                                                {item.region.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEditing(item)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-accent-red hover:bg-accent-red/10 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Add New Section */}
                <div className="space-y-6">
                    <div className="card glass p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-xl">
                                <Plus size={20} className="text-primary" />
                            </div>
                            <h3 className="text-white font-bold">Adaugă {currentTab.label.slice(0, -1)}</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-400 uppercase tracking-wider text-[10px]">
                                    Nume / Valoare
                                </label>
                                <input 
                                    className="w-full" 
                                    placeholder={`ex: ${activeTab === 'massifs' ? 'Făgăraș' : 'Nume nou'}`}
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                />
                            </div>

                            {activeTab === 'massifs' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400 uppercase tracking-wider text-[10px]">
                                        Regiune
                                    </label>
                                    <select 
                                        className="w-full"
                                        value={newSecondaryValue}
                                        onChange={(e) => setNewSecondaryValue(e.target.value)}
                                    >
                                        <option value="">Selectează regiune...</option>
                                        {regions.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                disabled={!newValue}
                                onClick={handleCreate}
                                className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Creează
                            </button>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                        <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                            <Layers size={16} className="text-primary" />
                            Notă Importante
                        </h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            Modificarea metadatelor afectează toți utilizatorii platformei. Fii atent la ștergerea elementelor care ar putea avea legături active.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetadataManagement;
