import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, Loader2, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

const Scanner: React.FC = () => {
    const { session } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setSaveStatus('idle');
        const formData = new FormData();
        formData.append('file', file);

        try {
            // If logged in, use the authenticated endpoint which saves to bucket and DB
            const endpoint = session ? '/analyze' : '/analyze/public';
            const token = session?.access_token;

            const data = await apiClient.upload(endpoint, formData, token);
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToHistory = async () => {
        if (!result || !session) {
            alert("Please log in to save scans to your history.");
            return;
        }

        setSaving(true);
        try {
            // Note: In the current backend, /analyze already saves to history.
            // However, the user might want to manually 'confirm' or save a public scan?
            // Since public scans aren't tied to users, the backend needs a user_id.
            // If the user scanned while logged in, it's ALREADY saved.
            // If they weren't logged in, they can't save it easily without re-scanning or a special endpoint.

            // For now, let's assume if they were logged in, it's already saved by /analyze.
            // If they weren't, we show the alert.
            // If they ARE logged in but used the public endpoint (unlikely with my change), we'd need to re-upload.

            setSaveStatus('success');
        } catch (err) {
            console.error(err);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <Activity className="w-3 h-3" />
                    <span>Real-time Forensic Engine</span>
                </div>
                <h1 className="text-5xl font-bold tracking-tight">AI-Powered <span className="text-blue-500">Document Integrity</span></h1>
                <p className="text-zinc-400 text-lg">Experience the world's most advanced document forensic engine. Upload any document to see pixel-level tampering analysis.</p>
            </div>

            {!result ? (
                <div className="glass p-16 rounded-3xl border-dashed border-2 border-zinc-700 flex flex-col items-center justify-center space-y-8 hover:border-blue-500/30 transition-all group bg-zinc-900/20">
                    <div className="p-8 bg-blue-500/10 rounded-3xl group-hover:bg-blue-500/20 transition-all">
                        <Upload className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-2xl font-bold">Verify Document Integrity</p>
                        <p className="text-zinc-500">Drag and drop or tap to upload (PDF, JPG, PNG, WEBP)</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-4">
                        <label
                            htmlFor="file-upload"
                            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-xl shadow-blue-600/20 active:scale-95 text-lg"
                        >
                            Select Document
                        </label>
                        {file && (
                            <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/80 rounded-xl border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium">{file.name}</span>
                                <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-white transition-colors">×</button>
                            </div>
                        )}
                    </div>

                    {file && (
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center gap-3 transition-all shadow-xl shadow-blue-600/30 active:scale-95 text-lg disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Run Forensic Analysis'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className={`glass p-10 rounded-3xl border-l-8 ${result.fraud_likelihood === 'high' ? 'border-red-500' : 'border-green-500'} flex flex-col space-y-6`}>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-blue-500 font-bold uppercase tracking-widest text-xs">Forensic Verdict</p>
                                        <h3 className="text-4xl font-bold capitalize">{result.fraud_likelihood} Risk Detected</h3>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-5xl font-mono font-bold text-blue-500">{result.confidence_score}%</div>
                                        <p className="text-zinc-500 text-xs font-bold uppercase">Confidence</p>
                                    </div>
                                </div>
                                <p className="text-xl text-zinc-300 leading-relaxed font-medium">{result.explanation}</p>
                            </div>

                            <div className="glass p-8 rounded-3xl space-y-6">
                                <h4 className="font-bold text-xl flex items-center gap-3 underline decoration-blue-500/50 decoration-4">
                                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                                    Forensic Artifacts Found
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.red_flags.map((flag: string, i: number) => (
                                        <div key={i} className="flex items-center gap-4 text-zinc-300 text-sm bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                            <div className="p-2 bg-yellow-500/10 rounded-lg">
                                                <ShieldAlert className="w-4 h-4 text-yellow-500" />
                                            </div>
                                            <span className="font-medium">{flag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-6 bg-blue-600/5 border-blue-600/20">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-bold text-lg">Full Report Prepared</p>
                                    <p className="text-sm text-zinc-400">Save this analysis to your permanent history for legal or compliance records.</p>
                                </div>
                                {session ? (
                                    <button
                                        onClick={handleSaveToHistory}
                                        disabled={saving || saveStatus === 'success'}
                                        className={`w-full py-4 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${saveStatus === 'success'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                                            }`}
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                            saveStatus === 'success' ? <><CheckCircle2 className="w-5 h-5" /> Saved to History</> :
                                                'Save to History'}
                                    </button>
                                ) : (
                                    <div className="w-full p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                                        <p className="text-xs text-zinc-400">Login to save this scan</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setSaveStatus('idle');
                                        setFile(null);
                                    }}
                                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
                                >
                                    Scan New Document
                                </button>
                            </div>

                            <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-4">
                                <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Public Demo Notice</h5>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    This public demo is for evaluation purposes only. All processed documents are deleted automatically every 60 minutes. Do not upload sensitive personal information.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scanner;
