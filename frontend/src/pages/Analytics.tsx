import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, ShieldAlert, Activity } from 'lucide-react';
import { apiClient } from '../lib/api';

const Analytics: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        apiClient.fetch('/stats')
            .then(data => {
                setStats(data);
                setError(null);
            })
            .catch(err => {
                console.error(err);
                setError("Unable to connect to the forensics engine. Please ensure the backend is running.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-zinc-500 font-medium tracking-tight">Accessing Platform Forensics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                    <ShieldAlert className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Connection Error</h2>
                    <p className="text-zinc-400 max-w-md">{error}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all font-semibold"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-10">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold">Platform Analytics</h1>
                <p className="text-zinc-400">Global trends and detection performance over the last 30 days.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon={<Activity />} label="Total Scans" value={stats.total_scans} color="text-blue-500" />
                <StatCard icon={<ShieldAlert />} label="High Risk" value={stats.high_risk_count} color="text-red-500" />
                <StatCard icon={<TrendingUp />} label="Avg Confidence" value={`${stats.avg_confidence}%`} color="text-green-500" />
                <StatCard icon={<PieChart />} label="Red Flags" value={stats.top_red_flags.length} color="text-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold">Risk Distribution</h3>
                    <div className="space-y-4">
                        <RiskBar label="High Risk" count={stats.risk_distribution.high} total={stats.total_scans} color="bg-red-500" />
                        <RiskBar label="Medium Risk" count={stats.risk_distribution.medium} total={stats.total_scans} color="bg-yellow-500" />
                        <RiskBar label="Low Risk" count={stats.risk_distribution.low} total={stats.total_scans} color="bg-green-500" />
                    </div>
                </div>

                <div className="glass p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold">Top Red Flags</h3>
                    <div className="space-y-3">
                        {stats.top_red_flags.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-zinc-800/40 rounded-xl border border-zinc-800">
                                <span className="text-sm font-medium">{item.flag}</span>
                                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">{item.count} hits</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }: any) => (
    <div className="glass p-6 rounded-2xl space-y-2">
        <div className={`p-2 w-fit rounded-lg bg-zinc-800 ${color}`}>{icon}</div>
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

const RiskBar = ({ label, count, total, color }: any) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-zinc-400">{label}</span>
                <span>{Math.round(percent)}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
};

export default Analytics;
