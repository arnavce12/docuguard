import React, { useEffect, useState } from 'react';
import { Clock, Search, Trash2, ExternalLink } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

const History: React.FC = () => {
    const { session } = useAuth();
    const [scans, setScans] = useState<any[]>([]);

    useEffect(() => {
        if (!session) return;
        apiClient.fetch('/scans', {}, session.access_token)
            .then(data => setScans(data.scans))
            .catch(console.error);
    }, [session]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold">Scan History</h1>
                    <p className="text-zinc-400">Manage and review your previous document analyses.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search scans..."
                        className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors w-full md:w-64 text-white caret-white"
                    />
                </div>
            </div>

            <div className="glass overflow-hidden rounded-2xl border border-zinc-800">
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full text-left" style={{ minWidth: '600px' }}>
                        <thead>
                            <tr className="bg-zinc-900/50 text-zinc-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Document</th>
                                <th className="px-6 py-4 font-semibold">Risk Level</th>
                                <th className="px-6 py-4 font-semibold">Confidence</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {scans.length > 0 ? scans.map((scan) => (
                                <tr key={scan.id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="font-medium">{scan.document_label || 'Unnamed Document'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${scan.fraud_likelihood === 'high' ? 'bg-red-500/10 text-red-500' :
                                            scan.fraud_likelihood === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-green-500/10 text-green-500'
                                            }`}>
                                            {scan.fraud_likelihood}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-300">{scan.confidence_score}%</td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {new Date(scan.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No scans found. Start by scanning your first document!
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
