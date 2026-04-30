import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertTriangle, Loader2, Activity, ShieldAlert, CheckCircle2, Camera } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/image';

const Scanner: React.FC = () => {
    const { session } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(() => location.state?.preloadedFile || null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<any>(() => location.state?.scanResult || null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isMobile, setIsMobile] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [tempName, setTempName] = useState('');
    const [renameLoading, setRenameLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<'idle' | 'compressing' | 'uploading' | 'analyzing'>('idle');
    const [isTakingLong, setIsTakingLong] = useState(false);

    useEffect(() => {
        // Detect mobile/tablet — capture="environment" only works on real mobile browsers
        setIsMobile(/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        if (location.state?.preloadedFile && !file) {
            setFile(location.state.preloadedFile);
        }
    }, [location.state]);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setSaveStatus('idle');
        setIsTakingLong(false);
        setLoadingStage('compressing');

        const longTimer = setTimeout(() => setIsTakingLong(true), 25000);

        try {
            // Compress image for mobile speed
            let fileToUpload: File | Blob = file;
            if (file.type !== 'application/pdf') {
                try {
                    fileToUpload = await compressImage(file);
                    console.log(`[DEBUG] Compressed image from ${file.size} to ${fileToUpload.size} bytes`);
                } catch (e) {
                    console.warn("Compression failed, uploading original", e);
                }
            }

            setLoadingStage('uploading');
            const ext = file.name.split('.').pop() || 'jpg';
            const uuid = crypto.randomUUID();
            const path = session ? `${session.user.id}/${uuid}.${ext}` : `public/${uuid}.${ext}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(path, fileToUpload);

            if (uploadError) throw uploadError;

            setLoadingStage('analyzing');
            const storage_path = uploadData.path;
            const endpoint = session ? '/analyze' : '/analyze_public';
            const token = session?.access_token;

            const data = await apiClient.fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ storage_path })
            }, token);
            
            setResult(data);
            
            // Invalidate caches so dashboard and analytics refresh
            apiClient.invalidateCache('/history');
            apiClient.invalidateCache('/stats');
        } catch (err) {
            console.error(err);
            alert("Analysis failed. This might be due to a network timeout on mobile. Please try a smaller file or a stronger connection.");
        } finally {
            clearTimeout(longTimer);
            setLoading(false);
            setLoadingStage('idle');
            setIsTakingLong(false);
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

    const handleRename = async () => {
        if (!result?.scan_id || !tempName.trim()) return;
        setRenameLoading(true);
        try {
            await apiClient.fetch('/history', {
                method: 'PATCH',
                body: JSON.stringify({
                    id: result.scan_id,
                    type: 'fraud',
                    new_name: tempName.trim()
                })
            }, session?.access_token);
            setResult({ ...result, document_label: tempName.trim() });
            setIsRenaming(false);
        } catch (err) {
            console.error(err);
            alert("Failed to rename document.");
        } finally {
            setRenameLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <Activity className="w-3 h-3" />
                    <span>Real-time Forensic Engine</span>
                </div>
                <h1 className="font-bold tracking-tight" style={{ fontSize: 'clamp(1.6rem, 6vw, 3rem)' }}>AI-Powered <span className="text-blue-500">Document Integrity</span></h1>
                <p className="text-zinc-400" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.125rem)' }}>Experience the world's most advanced document forensic engine. Upload any document to see pixel-level tampering analysis.</p>
            </div>

            {!result ? (
                <div className="glass rounded-3xl border-dashed border-2 border-zinc-700 flex flex-col items-center justify-center space-y-8 hover:border-blue-500/30 transition-all group bg-zinc-900/20" style={{ padding: 'clamp(2rem, 6vw, 4rem)' }}>
                    <div className="p-8 bg-blue-500/10 rounded-3xl group-hover:bg-blue-500/20 transition-all">
                        <Upload className="w-24 h-24 text-blue-500" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-2xl font-bold">Verify Document Integrity</p>
                        <p className="text-zinc-500">Drag and drop or tap to upload (PDF, JPG, PNG, WEBP)</p>
                    </div>
                    {/* Hidden file input */}
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {/* Hidden camera input — only rendered on mobile */}
                    {isMobile && (
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            id="camera-upload"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <label
                            htmlFor="file-upload"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-xl shadow-blue-600/20 active:scale-95 text-base flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" /> Select Document
                        </label>
                        {/* Camera button — only shown on mobile where capture works */}
                        {isMobile && (
                            <label
                                htmlFor="camera-upload"
                                className="px-8 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-2xl transition-all cursor-pointer active:scale-95 text-base flex items-center gap-2 border border-zinc-600"
                            >
                                <Camera className="w-4 h-4" /> Take Photo
                            </label>
                        )}
                    </div>
                    {file && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/80 rounded-xl border border-zinc-700">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-white transition-colors">×</button>
                        </div>
                    )}

                    {file && (
                        <div className="w-full max-w-md flex flex-col items-center gap-4">
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className="w-full px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xl shadow-blue-600/30 active:scale-95 text-lg disabled:opacity-50 relative overflow-hidden"
                            >
                                {loading ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>
                                                {loadingStage === 'compressing' && 'Optimizing Image...'}
                                                {loadingStage === 'uploading' && 'Uploading...'}
                                                {loadingStage === 'analyzing' && 'Running Forensic Analysis...'}
                                            </span>
                                        </div>
                                        {isTakingLong && (
                                            <span className="text-[10px] text-blue-200 animate-pulse font-medium">Still working, please don't close...</span>
                                        )}
                                    </>
                                ) : 'Run Forensic Analysis'}
                            </button>
                            
                            {isTakingLong && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs text-center animate-in fade-in slide-in-from-top-2">
                                    <p className="font-bold mb-1">Heavy processing detected</p>
                                    <p>The AI is performing a deep scan on this high-resolution document. This can take up to 60 seconds on mobile.</p>
                                </div>
                            )}
                        </div>
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
                                
                                {result.fraud_likelihood === 'low' && result.health_score && (
                                    <div className="pt-4">
                                        <button
                                            onClick={() => navigate('/results/health-score', {
                                                state: {
                                                    health_score: result.health_score,
                                                    fileName: file?.name || 'Document',
                                                    scanResult: result,
                                                    preloadedFile: file
                                                }
                                            })}
                                            className="px-6 py-3 bg-green-500/20 text-green-400 font-bold rounded-xl border border-green-500/30 hover:bg-green-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/10 flex items-center gap-2"
                                        >
                                            <Activity className="w-5 h-5" /> View Health Score
                                        </button>
                                    </div>
                                )}
                                {result.fraud_likelihood === 'low' && !result.health_score && (
                                    <p className="text-xs text-zinc-500 italic mt-2">Health score unavailable for this document</p>
                                )}
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
                                    <div className="flex flex-col items-center gap-2 group/name">
                                        {isRenaming ? (
                                            <div className="flex items-center gap-2 w-full max-w-xs">
                                                <input 
                                                    type="text" 
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:border-blue-500"
                                                    autoFocus
                                                />
                                                <button 
                                                    onClick={handleRename}
                                                    disabled={renameLoading}
                                                    className="p-1.5 bg-blue-600 rounded-lg text-white disabled:opacity-50"
                                                >
                                                    {renameLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => setIsRenaming(false)}
                                                    className="p-1.5 bg-zinc-800 rounded-lg text-zinc-400"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                                    {result.document_label || "Unnamed Document"}
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        setTempName(result.document_label || "");
                                                        setIsRenaming(true);
                                                    }}
                                                    className="opacity-0 group-hover/name:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-white"
                                                    title="Rename document"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-400">Analysis permanently stored in your forensic history.</p>
                                </div>
                                {session ? (
                                    <button
                                        onClick={handleSaveToHistory}
                                        disabled={saving || saveStatus === 'success'}
                                        className={`w-full py-4 font-bold rounded-2xl transition-all duration-300 shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2 ${saveStatus === 'success'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-blue-600/30'
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
