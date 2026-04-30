import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, Loader2, Info, Search, Activity, Camera, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/image';
import { useNavigate } from 'react-router-dom';

const KydPage: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [storagePath, setStoragePath] = useState<string | null>(null);
    const [loadingStage, setLoadingStage] = useState<'idle' | 'compressing' | 'uploading' | 'analyzing'>('idle');
    const [isTakingLong, setIsTakingLong] = useState(false);

    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
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
            const path = session ? `${session.user.id}/kyd_${uuid}.${ext}` : `public/kyd_${uuid}.${ext}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(path, fileToUpload);

            if (uploadError) throw uploadError;

            setLoadingStage('analyzing');
            const current_storage_path = uploadData.path;
            setStoragePath(current_storage_path);
            
            const endpoint = '/kyd';
            const token = session?.access_token;

            const data = await apiClient.fetch(endpoint, {
                method: 'POST',
                body: JSON.stringify({ storage_path: current_storage_path })
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

    const handleFraudHandoff = () => {
        // Pass the file and storage context to Scanner
        navigate('/scanner', { state: { preloadedFile: file, storagePath: storagePath } });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold uppercase tracking-wider">
                    <Search className="w-3 h-3" />
                    <span>Document Intelligence</span>
                </div>
                <h1 className="font-bold tracking-tight" style={{ fontSize: 'clamp(1.6rem, 6vw, 3rem)' }}>Know Your <span className="text-purple-500">Document</span></h1>
                <p className="text-zinc-400" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.125rem)' }}>Upload any document to instantly determine its type, issuing authority, purpose, and detailed data capabilities before checking for fraud.</p>
            </div>

            {!result ? (
                <div className="glass rounded-3xl border-dashed border-2 border-zinc-700 flex flex-col items-center justify-center space-y-8 hover:border-purple-500/30 transition-all group bg-zinc-900/20" style={{ padding: 'clamp(2rem, 6vw, 4rem)' }}>
                    <div className="p-8 bg-purple-500/10 rounded-3xl group-hover:bg-purple-500/20 transition-all">
                        <Upload className="w-24 h-24 text-purple-500" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-2xl font-bold">Upload to Identify</p>
                        <p className="text-zinc-500">Drag and drop or tap to upload (PDF, JPG, PNG, WEBP)</p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        id="kyd-upload"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    {isMobile && (
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            id="kyd-camera"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <label
                            htmlFor="kyd-upload"
                            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl transition-all cursor-pointer shadow-xl shadow-purple-600/20 active:scale-95 text-base flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" /> Select Document
                        </label>
                        {isMobile && (
                            <label
                                htmlFor="kyd-camera"
                                className="px-8 py-4 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-2xl transition-all cursor-pointer active:scale-95 text-base flex items-center gap-2 border border-zinc-600"
                            >
                                <Camera className="w-4 h-4" /> Take Photo
                            </label>
                        )}
                    </div>
                    {file && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-800/80 rounded-xl border border-zinc-700">
                            <FileText className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <button onClick={() => setFile(null)} className="text-zinc-500 hover:text-white transition-colors">×</button>
                        </div>
                    )}

                    {file && (
                        <div className="w-full max-w-md flex flex-col items-center gap-4">
                            <button
                                onClick={handleUpload}
                                disabled={loading}
                                className="w-full px-12 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xl shadow-purple-600/30 active:scale-95 text-lg disabled:opacity-50 relative overflow-hidden"
                            >
                                {loading ? (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>
                                                {loadingStage === 'compressing' && 'Optimizing Image...'}
                                                {loadingStage === 'uploading' && 'Uploading...'}
                                                {loadingStage === 'analyzing' && 'Analyzing Document...'}
                                            </span>
                                        </div>
                                        {isTakingLong && (
                                            <span className="text-[10px] text-purple-200 animate-pulse font-medium">Still working, please don't close...</span>
                                        )}
                                    </>
                                ) : 'Analyze Document'}
                            </button>
                            
                            {isTakingLong && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-500 text-xs text-center animate-in fade-in slide-in-from-top-2">
                                    <p className="font-bold mb-1">Deep analysis in progress</p>
                                    <p>High-resolution documents require extra forensic layers. This process may take up to 60 seconds on mobile networks.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-20">
                    {/* Primary Identity Header Section */}
                    <div className="glass p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold uppercase tracking-wider">
                                        Identity Profile
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{result.document_type}</h2>
                                    <div className="flex items-center gap-3 text-zinc-400">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                        <p className="text-xl">Known as: <span className="text-white font-semibold">{result.common_name}</span></p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Official Purpose</h4>
                                    <p className="text-lg text-zinc-300 leading-relaxed max-w-3xl">
                                        {result.purpose}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <div className="glass p-6 rounded-3xl bg-zinc-900/40 border-zinc-800">
                                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2 block">Origin / Authority</span>
                                    <p className="font-bold text-lg text-white">
                                        {result.issuing_authority || 'Standard Template'}
                                    </p>
                                </div>
                                
                                {result.notes && (
                                    <div className="glass p-6 rounded-3xl bg-yellow-500/5 border-yellow-500/20">
                                        <span className="text-[10px] text-yellow-500 uppercase font-black tracking-[0.2em] mb-2 block">Observations</span>
                                        <p className="text-sm text-yellow-100/80 leading-snug">
                                            {result.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Data Capabilities Card */}
                        <div className="glass rounded-[2rem] overflow-hidden flex flex-col">
                            <div className="bg-blue-500/5 p-6 border-b border-zinc-800 flex items-center gap-4">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-white">Data Categories</h3>
                                    <p className="text-xs text-zinc-500 font-medium">Types of information contained</p>
                                </div>
                            </div>
                            <div className="p-8 flex flex-wrap gap-2.5">
                                {result.data_categories?.map((cat: string, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-300 text-sm font-medium hover:border-blue-500/30 hover:text-blue-400 transition-all cursor-default">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Content structure Card */}
                        <div className="glass rounded-[2rem] overflow-hidden flex flex-col">
                            <div className="bg-green-500/5 p-6 border-b border-zinc-800 flex items-center gap-4">
                                <div className="p-2.5 bg-green-500/10 rounded-xl text-green-400">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-white">Key Identifiers</h3>
                                    <p className="text-xs text-zinc-500 font-medium">Critical fields detected on-page</p>
                                </div>
                            </div>
                            <div className="p-8 flex flex-wrap gap-2.5">
                                {result.key_fields_present?.map((field: string, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-300 text-sm font-medium hover:border-green-500/30 hover:text-green-400 transition-all cursor-default">
                                        {field}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Usage & Handoff Footer Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                        <div className="lg:col-span-2 glass p-10 rounded-[2rem] space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                                <h4 className="font-bold text-2xl">Standard Use Cases</h4>
                            </div>
                            <p className="text-zinc-400 text-base">This document is typically required for:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {result.typical_use_cases?.map((useCase: string, i: number) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                                        <div className="mt-1.5 p-1 bg-purple-500/20 rounded-full">
                                            <CheckCircle2 className="w-3 h-3 text-purple-400" />
                                        </div>
                                        <span className="text-zinc-200 text-sm font-medium leading-relaxed">{useCase}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="glass p-8 rounded-[2rem] flex flex-grow flex-col items-center justify-center text-center space-y-6 bg-purple-600/10 border-purple-500/30 relative overflow-hidden group shadow-2xl shadow-purple-900/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-20 h-20 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 relative z-10">
                                    <Activity className="w-10 h-10 animate-pulse" />
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <p className="font-bold text-2xl">Next Step</p>
                                    <p className="text-sm text-zinc-400 px-4">Verify this document for manipulations or forgeries.</p>
                                </div>
                                
                                <button
                                    onClick={handleFraudHandoff}
                                    className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-purple-600/40 flex items-center justify-center gap-3 active:scale-95 relative z-10 text-lg"
                                >
                                    Check for Fraud <ArrowRight className="w-5 h-5" />
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setResult(null);
                                        setFile(null);
                                        setStoragePath(null);
                                    }}
                                    className="w-full py-4 text-zinc-400 hover:text-white font-semibold rounded-2xl transition-all hover:bg-zinc-800/50 relative z-10 text-sm"
                                >
                                    Analyze Another Document
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KydPage;
