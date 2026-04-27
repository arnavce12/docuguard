import { ShieldCheck, Activity, AlertTriangle, ArrowUpRight, Search, FileSearch, CheckCircle, PieChart, HeartPulse } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useState, useEffect } from 'react';

const Dashboard: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) { setLoading(false); return; }
        apiClient.fetch('/history', {}, session.access_token)
            .then(data => setHistory(data.history ?? []))
            .catch(err => console.error("Error fetching history:", err))
            .finally(() => setLoading(false));
    }, [session]);

    // Compute user-specific stats from unified history
    const totalActivity = history.length;
    
    const fraudScans = history.filter(item => item.type === 'fraud');
    const kydProfiles = history.filter(item => item.type === 'kyd');
    
    const highRiskCount = fraudScans.filter(s => s.result === 'high' || s.result === 'medium').length;
    const safeCount = fraudScans.filter(s => s.result === 'low').length;

    // Calculate average health score from documents that have it
    const scansWithHealth = fraudScans.filter(s => s.raw?.health_score_overall != null);
    const avgHealthScore = scansWithHealth.length > 0
        ? Math.round(scansWithHealth.reduce((sum, s) => sum + s.raw.health_score_overall, 0) / scansWithHealth.length)
        : null;

    const recentScans = history.slice(0, 4);

    // Calculate percentages for Breakdown
    const totalScansForBreakdown = fraudScans.length > 0 ? fraudScans.length : 1; // avoid /0
    const safePercentage = Math.round((safeCount / totalScansForBreakdown) * 100) || 0;
    const riskPercentage = Math.round((highRiskCount / totalScansForBreakdown) * 100) || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-800/80 border border-zinc-600/50 rounded-full text-zinc-200 text-xs font-bold uppercase tracking-wider shadow-inner">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span>Command Center</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary drop-shadow-sm">Overview</h1>
                    <p className="text-secondary text-lg">Your document security and identity profile summary.</p>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashCard 
                    label="Total Activity" 
                    value={loading ? '—' : String(totalActivity)} 
                    subtitle={`${fraudScans.length} Scans, ${kydProfiles.length} Profiles`}
                    icon={<ShieldCheck className="w-6 h-6" />}
                    accent="blue"
                />
                <DashCard 
                    label="Risk Alerts" 
                    value={loading ? '—' : String(highRiskCount)} 
                    subtitle="High & Medium Risk Documents"
                    icon={<AlertTriangle className="w-6 h-6" />}
                    accent="orange"
                />
                <DashCard 
                    label="Avg Document Health" 
                    value={loading ? '—' : avgHealthScore !== null ? `${avgHealthScore}/100` : 'N/A'} 
                    subtitle={avgHealthScore ? "Based on legitimate documents" : "Scan more documents to compute"}
                    icon={<HeartPulse className="w-6 h-6" />}
                    accent="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Recent Activity Feed */}
                <div className="glass p-8 rounded-3xl space-y-6 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" /> Recent Activity
                        </h3>
                        <Link to="/history" className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-wider">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {recentScans.length > 0 ? recentScans.map((item) => (
                            <RecentItem key={item.id} item={item} />
                        )) : (
                            <div className="text-center py-10 bg-zinc-800/20 rounded-2xl border border-zinc-800/50">
                                <p className="text-zinc-500 font-medium tracking-wide">
                                    {loading ? 'Loading history...' : 'No activity yet. Analyze a document to get started!'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Quick Actions Panel */}
                    <div className="glass p-8 rounded-3xl space-y-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
                        <h3 className="text-xl font-bold flex items-center gap-2 relative z-10 text-primary">
                            <ArrowUpRight className="w-5 h-5 text-purple-500" /> Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                            <button 
                                onClick={() => navigate('/scanner')}
                                className="p-6 glass border border-zinc-700 hover:border-blue-500/50 text-left rounded-2xl transition-all duration-300 hover:-translate-y-1 group"
                            >
                                <Search className="w-6 h-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                                <p className="font-bold text-white group-hover:text-blue-400 transition-colors text-lg">Fraud Scan</p>
                                <p className="text-sm text-zinc-300 mt-1">Detect forgery and tampering instantly.</p>
                            </button>
                            <button 
                                onClick={() => navigate('/kyd')}
                                className="p-6 glass border border-zinc-700 hover:border-purple-500/50 text-left rounded-2xl transition-all duration-300 hover:-translate-y-1 group"
                            >
                                <FileSearch className="w-6 h-6 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                                <p className="font-bold text-white group-hover:text-purple-400 transition-colors text-lg">Verify Identity</p>
                                <p className="text-sm text-zinc-300 mt-1">Extract profile and intent via KYD.</p>
                            </button>
                        </div>
                    </div>

                    {/* Scan Category Breakdown */}
                    <div className={`glass p-8 rounded-3xl space-y-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-black ${
                        fraudScans.length > 0 ? (
                            riskPercentage > 50 ? 'shadow-[0_0_50px_rgba(239,68,68,0.15)]' : 
                            riskPercentage > 20 ? 'shadow-[0_0_50px_rgba(234,179,8,0.15)]' : 
                            'shadow-[0_0_50px_rgba(34,197,94,0.15)]'
                        ) : ''
                    }`}>
                        <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                            fraudScans.length > 0 ? (
                                riskPercentage > 50 ? 'bg-red-600/10' : 
                                riskPercentage > 20 ? 'bg-yellow-600/10' : 
                                'bg-green-600/10'
                            ) : 'bg-indigo-600/10'
                        }`}></div>
                        <div className="flex items-center justify-between relative z-10">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                <PieChart className={`w-5 h-5 ${
                                    fraudScans.length > 0 ? (
                                        riskPercentage > 50 ? 'text-red-400' : 
                                        riskPercentage > 20 ? 'text-yellow-400' : 
                                        'text-green-400'
                                    ) : 'text-indigo-400'
                                }`} /> Security Posture
                            </h3>
                            <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest bg-zinc-800/80 border border-zinc-700 px-3 py-1.5 rounded-md shadow-inner">Past 30 Days</span>
                        </div>
                        
                        {fraudScans.length > 0 ? (
                            <div className="space-y-5">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-2xl font-black text-green-500">{safePercentage}%</p>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Safe Documents</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-red-500">{riskPercentage}%</p>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Suspicious</p>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-zinc-800 rounded-full flex overflow-hidden ring-1 ring-inset ring-black/50">
                                    <div className="h-full bg-green-500" style={{ width: `${safePercentage}%` }}></div>
                                    <div className="h-full bg-red-500" style={{ width: `${riskPercentage}%` }}></div>
                                </div>
                                <div className="flex justify-center gap-6 pt-3 relative z-10">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 rounded-full border border-zinc-800">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                        <span className="text-[13px] text-zinc-300 font-bold tracking-wide">Legit ({safeCount})</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/80 rounded-full border border-zinc-800">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                        <span className="text-[13px] text-zinc-300 font-bold tracking-wide">Risk ({highRiskCount})</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                    <PieChart className="w-5 h-5 text-zinc-600" />
                                </div>
                                <p className="text-zinc-500 text-sm font-medium">Not enough scan data to calculate your posture.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashCard = ({ label, value, subtitle, icon, accent }: any) => {
    const bgColors: any = {
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
        orange: "bg-orange-500/10 border-orange-500/20 text-orange-500",
        green: "bg-green-500/10 border-green-500/20 text-green-500"
    };

    const textColors: any = {
        blue: "text-blue-400",
        orange: "text-orange-400",
        green: "text-green-400"
    };

    return (
        <div className={`glass p-6 rounded-2xl flex items-start gap-5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-zinc-800/50 group relative overflow-hidden`}>
            <div className={`p-3 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300 ${bgColors[accent]}`}>
                {icon}
            </div>
            <div className="space-y-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${textColors[accent]}`}>{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black tracking-tight text-primary">{value}</p>
                </div>
                {subtitle && <p className="text-xs font-medium leading-tight mt-1 text-secondary">{subtitle}</p>}
            </div>
        </div>
    );
};

const RecentItem = ({ item }: { item: any }) => {
    const isFraud = item.type === 'fraud';
    const isHighRisk = item.result === 'high' || item.result === 'medium';
    
    // Determine colors
    let badgeColor = "bg-green-500/10 text-green-500 border-green-500/20";
    let badgeText = "Safe";
    let Icon = CheckCircle;

    if (isFraud && isHighRisk) {
        badgeColor = item.result === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20";
        badgeText = `${item.result} Risk`;
        Icon = AlertTriangle;
    } else if (!isFraud) {
        badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
        badgeText = "Profiled";
        Icon = FileSearch;
    }

    return (
        <div className="flex items-center justify-between p-4 bg-zinc-800/30 hover:bg-zinc-800/60 rounded-xl border border-zinc-800 flex-wrap gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl border group-hover:scale-110 transition-transform shadow-inner ${badgeColor.replace('text-', 'bg-').replace('/10', '/5')}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-bold text-[15px] text-primary line-clamp-1 group-hover:text-blue-500 transition-colors">{item.document_name}</p>
                    <p className="text-[13px] text-secondary font-medium mt-0.5">
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${badgeColor}`}>
                {badgeText}
            </span>
        </div>
    );
};

export default Dashboard;
