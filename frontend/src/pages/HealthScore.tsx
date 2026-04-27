import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Activity, FileText, CheckCircle } from 'lucide-react';

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
}

const HealthScore: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
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

    const { health_score, fileName } = location.state as HealthScoreState;

    // Use thresholds as fallback, though trusting API string as primary
    const getGradeColor = (grade: string, score: number) => {
        const _grade = grade ? grade.toUpperCase() : score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';
        if (_grade === 'A') return 'text-green-500 bg-green-500/10 border-green-500/20 ring-green-500';
        if (_grade === 'B') return 'text-blue-500 bg-blue-500/10 border-blue-500/20 ring-blue-500';
        if (_grade === 'C') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 ring-yellow-500';
        if (_grade === 'D') return 'text-orange-500 bg-orange-500/10 border-orange-500/20 ring-orange-500';
        return 'text-red-500 bg-red-500/10 border-red-500/20 ring-red-500';
    };

    const getAxisColor = (score: number) => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 75) return 'bg-blue-500';
        if (score >= 60) return 'bg-yellow-500';
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

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = Math.max(0, circumference - (health_score.overall / 100) * circumference);
    const strokeColorClass = getGradeColor(health_score.grade, health_score.overall).split(' ').find(c => c.startsWith('text-'))?.replace('text-', '') || 'blue-500';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="space-y-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors w-fit px-2 py-1 -ml-2 rounded-lg hover:bg-zinc-800">
                    <ChevronLeft className="w-5 h-5" /> Back to Results
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Document Health Score</h1>
                        <p className="text-zinc-400 mt-1 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> {fileName}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Score Hero */}
                <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                            {/* Background track */}
                            <circle cx="70" cy="70" r={radius} className="stroke-zinc-800" strokeWidth="12" fill="none" />
                            {/* Value track */}
                            <circle 
                                cx="70" cy="70" r={radius} 
                                className="transition-all duration-1000 ease-out fill-none stroke-current" 
                                style={{ stroke: `var(--tw-colors-${strokeColorClass.split('-')[0]}-${strokeColorClass.split('-')[1]})`, strokeDasharray: circumference, strokeDashoffset }}
                                strokeWidth="12" strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold font-mono text-white tracking-tighter">{health_score.overall}</span>
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">SCORE</span>
                        </div>
                    </div>
                    
                    <div className={`px-6 py-2.5 rounded-xl border ${getGradeColor(health_score.grade, health_score.overall)} ring-1 ring-inset shadow-inner`}>
                        <span className="text-2xl font-black whitespace-nowrap">Grade {health_score.grade}</span>
                    </div>
                </div>

                {/* Axes Breakdown */}
                <div className="md:col-span-2 glass p-8 rounded-3xl space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-zinc-100 border-b border-zinc-800 pb-4">
                        <Activity className="w-5 h-5 text-blue-500" /> Axis Breakdown
                    </h3>
                    <div className="space-y-6">
                        {axesConfig.map((axis) => {
                            const data = health_score.axes[axis.key as keyof typeof health_score.axes];
                            if (!data) return null;
                            return (
                                <div key={axis.key} className="space-y-2.5">
                                    <div className="flex justify-between items-end gap-4">
                                        <div className="flex-1">
                                            <div className="font-bold flex items-center gap-2 text-zinc-200">
                                                {axis.label}
                                                <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 font-medium whitespace-nowrap">Weight: {axis.weight}%</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed truncate  md:whitespace-normal md:overflow-visible">{data.note}</p>
                                        </div>
                                        <span className="font-mono font-bold text-sm text-zinc-300 w-12 text-right">{data.score}/100</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full ${getAxisColor(data.score)} transition-all duration-1000`} 
                                            style={{ width: `${Math.max(0, Math.min(100, data.score))}%` }} 
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Flags Section */}
            {health_score.flags && health_score.flags.length > 0 ? (
                <div className="glass p-8 rounded-3xl space-y-6 border border-orange-500/20 bg-orange-500/5 shadow-xl shadow-orange-500/5">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-orange-400">
                        <AlertTriangle className="w-5 h-5" /> Issues Found
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {health_score.flags.map((flag, i) => (
                            <div key={i} className="flex gap-3 text-zinc-300 text-sm bg-zinc-950/50 p-4 rounded-xl border border-orange-500/20 shadow-inner">
                                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{flag}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass p-8 rounded-3xl flex items-center gap-4 border border-green-500/20 bg-green-500/5 shadow-xl shadow-green-500/5">
                    <div className="p-3 bg-green-500/10 rounded-2xl">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-green-400">No issues detected</h3>
                        <p className="text-sm text-green-500/70 mt-1">The document looks perfectly clean across all measured axes.</p>
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button 
                    onClick={() => navigate('/scanner')}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] focus:ring-2 focus:ring-zinc-600 focus:outline-none text-white font-bold rounded-2xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg hover:shadow-black/40"
                >
                    Run Fraud Detection Again
                </button>
                <button 
                    onClick={() => navigate('/kyd')}
                    className="flex-1 py-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 active:scale-[0.98] focus:ring-2 focus:ring-purple-500/50 focus:outline-none font-bold rounded-2xl transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/10"
                >
                    Know Your Document Profile
                </button>
            </div>
        </div>
    );
};

export default HealthScore;
