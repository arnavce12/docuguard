import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Activity, FileText, CheckCircle, Shield, Download, Share2 } from 'lucide-react';

interface HealthScoreState {
    health_score: {
        overall: number;
        axes: {
            completeness: { score: number, note: string };
            legibility: { score: number, note: string };
            consistency: { score: number, note: string };
            validity: { score: number, note: string };
            scan_quality: { score: number, note: string };
        };
        flags: string[];
        grade: "A" | "B" | "C" | "D" | "F";
    };
    fileName: string;
    scanResult: any;
    preloadedFile: File | null;
}

const HealthScore: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [animate, setAnimate] = useState(false);
    
    useEffect(() => {
        setAnimate(true);
    }, []);
    
    // Check if state exists
    if (!location.state || !location.state.health_score) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-20">
                <AlertTriangle className="w-12 h-12 text-zinc-500" />
                <h2 className="text-2xl font-bold">No Health Score Found</h2>
                <p className="text-zinc-500">Please run a document analysis first.</p>
                <button onClick={() => navigate('/scanner')} className="px-6 py-3 bg-blue-600 font-bold rounded-xl text-white hover:bg-blue-700 transition-colors">
                    Go to Scanner
                </button>
            </div>
        );
    }

    const { health_score, fileName, scanResult, preloadedFile } = location.state as HealthScoreState;

    const getGradeStyles = (grade: string) => {
        const _grade = grade?.toUpperCase() || 'F';
        if (_grade === 'A') return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' };
        if (_grade === 'B') return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'shadow-blue-500/20' };
        if (_grade === 'C') return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' };
        if (_grade === 'D') return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', glow: 'shadow-orange-500/20' };
        return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'shadow-red-500/20' };
    };

    const getAxisColor = (score: number) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 75) return 'bg-blue-500';
        if (score >= 60) return 'bg-amber-500';
        if (score >= 45) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const axesConfig = [
        { key: 'completeness', label: 'Completeness', weight: 30 },
        { key: 'validity', label: 'Validity', weight: 25 },
        { key: 'consistency', label: 'Consistency', weight: 20 },
        { key: 'legibility', label: 'Legibility', weight: 15 },
        { key: 'scan_quality', label: 'Scan Quality', weight: 10 },
    ];

    const styles = getGradeStyles(health_score.grade);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = animate ? circumference - (health_score.overall / 100) * circumference : circumference;

    const handleBack = () => {
        // Fix: Explicitly pass back the scanResult and file state to keep Scanner page populated
        navigate('/scanner', { 
            state: { 
                scanResult, 
                preloadedFile 
            } 
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Nav & Meta Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
                <div className="space-y-4">
                    <button 
                        onClick={handleBack} 
                        className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all w-fit px-3 py-1.5 -ml-3 rounded-xl hover:bg-zinc-800/50"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                        <span className="font-medium">Back to Forensic Verdict</span>
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Shield className="w-5 h-5 text-blue-500" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Health Certificate</h1>
                        </div>
                        <p className="text-zinc-500 flex items-center gap-2 text-sm font-medium">
                            <FileText className="w-4 h-4 text-zinc-600" /> {fileName} 
                            <span className="w-1 h-1 bg-zinc-700 rounded-full mx-1"></span>
                            <span className="text-zinc-600">ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-xl">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-2xl transition-all shadow-xl active:scale-95">
                        <Download className="w-5 h-5" /> Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Score Hero Section */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="glass rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group border-zinc-800/50 shadow-2xl">
                        <div className={`absolute inset-0 bg-gradient-to-b ${styles.bg} to-transparent opacity-30`} />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        
                        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                            {/* Animated Background Rings */}
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse" />
                            <div className="absolute inset-4 rounded-full border border-white/5 animate-reverse-spin duration-[10s]" />
                            
                            <svg className="w-full h-full -rotate-90 filter drop-shadow-2xl" viewBox="0 0 180 180">
                                <circle cx="90" cy="90" r={radius} className="stroke-zinc-800/50" strokeWidth="10" fill="none" />
                                <circle 
                                    cx="90" cy="90" r={radius} 
                                    className={`transition-all duration-1500 ease-out fill-none stroke-current ${styles.color}`} 
                                    style={{ strokeDasharray: circumference, strokeDashoffset }}
                                    strokeWidth="10" strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-6xl font-black font-mono text-primary tracking-tighter drop-shadow-lg">{health_score.overall}</span>
                                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em] mt-1">PERCENTILE</span>
                            </div>
                        </div>
                        
                        <div className={`relative z-10 px-8 py-4 rounded-2xl border ${styles.border} ${styles.bg} ${styles.glow} backdrop-blur-md shadow-2xl ring-1 ring-inset ring-white/10 group-hover:-translate-y-1 transition-all duration-300`}>
                            <div className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60 mb-1">Global Verdict</div>
                            <div className={`text-4xl font-black ${styles.color}`}>Grade {health_score.grade}</div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2rem] bg-zinc-900/40 border-zinc-800/50">
                        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Security Insights</h4>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            This score reflects the technical integrity of the document assets. A higher score indicates lower digital noise and higher structural consistency.
                        </p>
                    </div>
                </div>

                {/* Axes Breakdown Section */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="glass p-8 md:p-10 rounded-[2.5rem] border-zinc-800/50">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <Activity className="w-6 h-6 text-blue-500" />
                                <h3 className="text-2xl font-bold">Structural Analysis</h3>
                            </div>
                            <div className="text-xs text-zinc-500 font-mono">WEIGHTED AGGREGATE</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {axesConfig.map((axis) => {
                                const data = health_score.axes[axis.key as keyof typeof health_score.axes];
                                if (!data) return null;
                                return (
                                    <div key={axis.key} className="space-y-4 group">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-primary group-hover:text-blue-500 transition-colors">{axis.label}</span>
                                                    <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/50 text-zinc-500 font-bold">{axis.weight}%</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 leading-snug max-w-[200px] group-hover:text-zinc-400 transition-colors">{data.note}</p>
                                            </div>
                                            <span className="text-xl font-mono font-black text-primary drop-shadow-sm">{data.score}</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden p-[2px] border border-white/5">
                                            <div 
                                                className={`h-full rounded-full ${getAxisColor(data.score)} transition-all duration-1500 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`} 
                                                style={{ width: animate ? `${data.score}%` : '0%' }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Flags / Clean Section */}
                    {health_score.flags && health_score.flags.length > 0 ? (
                        <div className="glass p-8 md:p-10 rounded-[2.5rem] border-orange-500/20 bg-orange-500/5 shadow-2xl shadow-orange-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AlertTriangle className="w-24 h-24 text-orange-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-8 relative z-10">
                                <div className="p-2 bg-orange-500/20 rounded-xl">
                                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-bold text-orange-400">Anomalies Detected</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                {health_score.flags.map((flag, i) => (
                                    <div key={i} className="flex gap-4 items-center bg-zinc-950/40 p-5 rounded-2xl border border-orange-500/10 hover:border-orange-500/30 transition-all hover:bg-zinc-950/60 group">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] group-hover:scale-125 transition-transform" />
                                        <span className="text-zinc-300 text-sm font-medium leading-relaxed">{flag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass p-10 rounded-[2.5rem] border-emerald-500/20 bg-emerald-500/5 shadow-2xl shadow-emerald-500/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-6 bg-emerald-500/10 rounded-[2rem] relative z-10">
                                <CheckCircle className="w-12 h-12 text-emerald-500 animate-pulse" />
                            </div>
                            <div className="relative z-10 text-center md:text-left space-y-2">
                                <h3 className="text-2xl font-bold text-emerald-400 tracking-tight">Optimal Integrity Verified</h3>
                                <p className="text-emerald-500/60 font-medium leading-relaxed max-w-md">
                                    This document exhibits perfect structural alignment and zero digital tampering artifacts across all measured dimensions.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium CTA Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                <button 
                    onClick={() => navigate('/scanner')}
                    className="group relative px-8 py-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold rounded-[2rem] transition-all overflow-hidden shadow-2xl active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col items-center gap-1">
                        <Activity className="w-6 h-6 text-blue-500 mb-1" />
                        <span className="text-lg text-primary">Scan New Document</span>
                        <span className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">RETURN TO LABORATORY</span>
                    </div>
                </button>
                <button 
                    onClick={() => navigate('/kyd')}
                    className="group relative px-8 py-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-[2rem] transition-all overflow-hidden shadow-2xl shadow-purple-600/20 active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col items-center gap-1">
                        <Shield className="w-6 h-6 text-white mb-1" />
                        <span className="text-lg">Explore Identity Profile</span>
                        <span className="text-[10px] text-purple-200/50 font-black tracking-widest uppercase">INTEL ANALYTICS</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default HealthScore;
