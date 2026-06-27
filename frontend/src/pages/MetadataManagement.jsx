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
        { id: 'massifs', label: 'Masive', singularLabel: 'Masiv', icon: <Mountain size={18} />, endpoint: '/metadata/massifs', field: 'name' },
        { id: 'regions', label: 'Regiuni', singularLabel: 'Regiune', icon: <Map size={18} />, endpoint: '/metadata/regions', field: 'name' },
        { id: 'types', label: 'Tipuri', singularLabel: 'Tip', icon: <Layers size={18} />, endpoint: '/metadata/types', field: 'name' },
        { id: 'causes', label: 'Cauze', singularLabel: 'Cauză', icon: <HelpCircle size={18} />, endpoint: '/metadata/causes', field: 'description' },
        { id: 'orientations', label: 'Orientări', singularLabel: 'Orientare', icon: <Compass size={18} />, endpoint: '/metadata/orientations', field: 'direction' },
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

    const groupedItems = activeTab === 'massifs' 
        ? items.reduce((acc, item) => {
            const regionName = item.region ? item.region.name : 'Alte Regiuni';
            if (!acc[regionName]) acc[regionName] = [];
            acc[regionName].push(item);
            return acc;
        }, {})
        : null;

    const sortedRegionEntries = groupedItems 
        ? Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b))
        : [];

    const renderItem = (item) => (
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
                    <div className="flex justify-end gap-2 mt-2">
                        <button 
                            onClick={() => setEditingId(null)} 
                            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Anulează"
                        >
                            <X size={18} />
                        </button>
                        <button 
                            onClick={() => handleUpdate(item.id)} 
                            className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg text-white text-xs font-bold transition-all shadow-lg shadow-primary/20"
                        >
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
                            <span className="text-white font-medium tracking-wide">{item[currentTab.field]}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button 
                            onClick={() => startEditing(item)} 
                            className="p-2 text-primary hover:text-white bg-primary/10 hover:bg-primary rounded-lg transition-all"
                            title="Editează"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-2 text-accent-red hover:text-white bg-accent-red/10 hover:bg-accent-red rounded-lg transition-all"
                            title="Șterge"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 underline decoration-primary/40 underline-offset-8 decoration-4">Management Metadate</h1>
                    <p className="text-slate-400 text-sm font-medium">Configurează opțiunile globale ale platformei</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex flex-wrap md:flex-nowrap gap-1 p-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
                            activeTab === tab.id 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {/* Add New Section (Horizontal) */}
                <div className="card glass p-6">
                    <div className="flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-sm font-medium text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-2">
                                <Plus size={14} className="text-primary" /> Adaugă {currentTab.singularLabel}
                            </label>
                            <input 
                                className="w-full" 
                                placeholder={`ex: ${activeTab === 'massifs' ? 'Făgăraș' : 'Nume nou'}`}
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                            />
                        </div>

                        {activeTab === 'massifs' && (
                            <div className="flex-1 w-full space-y-2">
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
                            className="w-full md:w-auto btn-primary py-[0.8rem] px-8 text-sm font-bold flex items-center justify-center gap-2 md:mt-0"
                        >
                            Creează
                        </button>
                    </div>
                </div>

                {/* List Section */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
                    {loading && (
                        <div className="p-12 text-center text-slate-500">Se încarcă...</div>
                    )}
                    
                    {!loading && items.length === 0 && (
                        <div className="p-12 text-center text-slate-500">Nu există elemente în această categorie.</div>
                    )}

                    {!loading && items.length > 0 && (
                        <div className="divide-y divide-white/5">
                            {activeTab === 'massifs' ? (
                                sortedRegionEntries.map(([regionName, regionItems]) => (
                                    <div key={regionName} className="border-b border-white/5 last:border-0">
                                        <div className="bg-slate-800/30 px-6 py-3 flex items-center gap-3 border-b border-white/5">
                                            <Map size={14} className="text-primary/70" />
                                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{regionName}</span>
                                            <span className="ml-auto text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full shadow-inner">
                                                {regionItems.length} masive
                                            </span>
                                        </div>
                                        <div className="divide-y divide-white/5 bg-slate-900/20">
                                            {regionItems.map((item) => renderItem(item))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                items.map((item) => renderItem(item))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MetadataManagement;
