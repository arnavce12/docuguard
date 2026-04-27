import React, { useEffect, useState } from 'react';
import { Search, Trash2, ExternalLink, Activity, FileSearch, ShieldAlert, Loader2, Calendar, Pencil, Check, X } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

type TabFilter = 'all' | 'fraud' | 'kyd';

const History: React.FC = () => {
    const { session } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [filter, setFilter] = useState<TabFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const fetchHistory = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const data = await apiClient.fetch('/history', {}, session.access_token);
            setHistory(data.history);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [session]);

    const handleDelete = async (id: string, type: string) => {
        if (!confirm('Are you sure you want to delete this record from your history?')) return;
        try {
            await apiClient.fetch(`/history?id=${id}&type=${type}`, { method: 'DELETE' }, session?.access_token);
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Failed to delete', error);
            alert('Failed to delete scan. Please try again.');
        }
    };

    const handleView = async (item: any) => {
        const path = item.type === 'fraud' ? item.raw.storage_path : item.raw.file_name;
        if (!path) {
            alert('File path not found for this record.');
            return;
        }

        try {
            const data = await apiClient.fetch(`/signed-url?path=${encodeURIComponent(path)}`, {}, session?.access_token);
            window.open(data.url, '_blank');
        } catch (error) {
            console.error('Failed to get signed URL', error);
            alert('Failed to open document. It may have been deleted from storage.');
        }
    };

    const handleRename = async (id: string, type: string) => {
        if (!editName.trim()) return;
        setEditLoading(true);
        try {
            await apiClient.fetch('/history', {
                method: 'PATCH',
                body: JSON.stringify({
                    id,
                    type,
                    new_name: editName.trim()
                })
            }, session?.access_token);
            
            setHistory(prev => prev.map(item => 
                item.id === id ? { ...item, document_name: editName.trim() } : item
            ));
            setEditingId(null);
        } catch (error) {
            console.error('Failed to rename', error);
            alert('Failed to rename document.');
        } finally {
            setEditLoading(false);
        }
    };

    const filteredHistory = history.filter(item => {
        if (filter !== 'all' && item.type !== filter) return false;
        if (searchQuery) {
            return item.document_name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    const getRiskColor = (risk: string) => {
        if (risk === 'high') return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (risk === 'medium') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        if (risk === 'low') return 'bg-green-500/10 text-green-500 border-green-500/20';
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800/50 border border-zinc-700/50 rounded-full text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        <span>Activity Log</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Timeline</h1>
                    <p className="text-zinc-400 text-lg">Manage and review all your forensic analyses and document identities.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search document name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 transition-colors w-full text-white caret-white shadow-inner"
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex px-1.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl w-fit">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'all' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    All Activity
                </button>
                <button
                    onClick={() => setFilter('fraud')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${filter === 'fraud' ? 'bg-blue-600/10 text-blue-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Activity className="w-4 h-4" /> Fraud Scans
                </button>
                <button
                    onClick={() => setFilter('kyd')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${filter === 'kyd' ? 'bg-purple-600/10 text-purple-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <FileSearch className="w-4 h-4" /> KYD Profiles
                </button>
            </div>

            {/* History Table Container */}
            <div className="glass overflow-hidden rounded-[2rem] border border-zinc-800 shadow-xl shadow-black/20">
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full text-left" style={{ minWidth: '800px' }}>
                        <thead>
                            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                <th className="px-8 py-5">Operation Type</th>
                                <th className="px-8 py-5">Document Target</th>
                                <th className="px-8 py-5">Result / Status</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                                            <span className="text-zinc-500 font-medium">Loading history...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHistory.length > 0 ? (
                                filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-800/20 transition-colors group">
                                        
                                        {/* Operation Type Column */}
                                        <td className="px-8 py-5">
                                            {item.type === 'fraud' ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                                                    <Activity className="w-4 h-4" />
                                                    <span className="font-bold text-xs uppercase tracking-wide">Fraud Scan</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                                                    <FileSearch className="w-4 h-4" />
                                                    <span className="font-bold text-xs uppercase tracking-wide">KYD Profile</span>
                                                </div>
                                            )}
                                        </td>
                                        
                                        {/* Document Target Column */}
                                        <td className="px-8 py-5">
                                            {editingId === item.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm w-full max-w-[200px] focus:outline-none focus:border-blue-500"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRename(item.id, item.type);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                    />
                                                    <button 
                                                        onClick={() => handleRename(item.id, item.type)}
                                                        disabled={editLoading}
                                                        className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-bold text-zinc-200">{item.document_name}</div>
                                                    {item.type === 'fraud' && item.raw.is_public_demo && (
                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1 block">Public Demo</span>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        
                                        {/* Result/Status Column */}
                                        <td className="px-8 py-5">
                                            {item.type === 'fraud' ? (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${getRiskColor(item.result)}`}>
                                                        {item.result} Risk
                                                    </span>
                                                    <span className="text-xs text-zinc-500 font-semibold">{item.confidence}% Confidence</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                    Successfully Identified
                                                </div>
                                            )}
                                        </td>
                                        
                                        {/* Date Column */}
                                        <td className="px-8 py-5 text-sm font-medium text-zinc-400">
                                            {new Date(item.date).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>

                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <button 
                                                    onClick={() => {
                                                        setEditingId(item.id);
                                                        setEditName(item.document_name);
                                                    }}
                                                    className="p-2.5 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 rounded-xl text-zinc-400 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40" 
                                                    title="Rename document"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleView(item)}
                                                    className="p-2.5 bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 rounded-xl text-zinc-400 hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40" 
                                                    title="View original document"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id, item.type)}
                                                    className="p-2.5 bg-zinc-800/50 hover:bg-red-500/10 border border-zinc-700/50 hover:border-red-500/20 rounded-xl text-zinc-400 hover:text-red-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10" 
                                                    title="Delete record"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                                            <div className="p-4 bg-zinc-900 rounded-full border border-zinc-800">
                                                <ShieldAlert className="w-8 h-8 text-zinc-600" />
                                            </div>
                                            <h3 className="text-lg font-bold">No Activity Found</h3>
                                            <p className="text-zinc-500 text-sm">
                                                You haven't run any scans or generated KYD profiles yet, or they don't match your current filter.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default History;
