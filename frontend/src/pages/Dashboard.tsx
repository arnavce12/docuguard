import { ShieldCheck, Clock, FileText, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { useState, useEffect } from 'react';

const Dashboard: React.FC = () => {
    const { user, session } = useAuth();
    const [allScans, setAllScans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) { setLoading(false); return; }
        apiClient.fetch('/scans', {}, session.access_token)
            .then(data => setAllScans(data.scans ?? []))
            .catch(err => console.error("Error fetching scans:", err))
            .finally(() => setLoading(false));
    }, [session]);

    // Compute user-specific stats from their own scans only
    const totalScans = allScans.length;
    const avgConfidence = totalScans > 0
        ? Math.round(allScans.reduce((sum, s) => sum + (s.confidence_score ?? 0), 0) / totalScans)
        : 0;
    const highRiskCount = allScans.filter(s => s.fraud_likelihood === 'high').length;
    const recentScans = allScans.slice(0, 3);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="font-bold" style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)' }}>User Dashboard</h1>
                    <p className="text-zinc-400">Welcome back, {user?.user_metadata?.full_name || 'User'}. Here is your security summary.</p>
                </div>
                <Link
                    to="/scanner"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                >
                    New Scan <ArrowUpRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashCard label="My Scanned Documents" value={loading ? '—' : String(totalScans)} icon={<ShieldCheck className="text-green-500" />} />
                <DashCard label="My Avg Confidence" value={loading ? '—' : `${avgConfidence}%`} icon={<Clock className="text-blue-500" />} />
                <DashCard label="My Risk Alerts" value={loading ? '—' : String(highRiskCount)} icon={<AlertTriangle className="text-red-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Recent Scans</h3>
                        <Link to="/history" className="text-sm text-blue-500 hover:text-blue-400 font-medium">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {recentScans.length > 0 ? recentScans.map((scan) => (
                            <RecentItem
                                key={scan.id}
                                label={scan.document_label || "Unnamed Document"}
                                status={scan.fraud_likelihood === 'high' ? 'High Risk' : scan.fraud_likelihood === 'medium' ? 'Medium Risk' : 'Safe'}
                                date={new Date(scan.created_at).toLocaleDateString()}
                                color={scan.fraud_likelihood === 'high' ? "text-red-500" : scan.fraud_likelihood === 'medium' ? "text-yellow-500" : "text-green-500"}
                            />
                        )) : (
                            <p className="text-sm text-zinc-500">
                                {loading ? 'Loading...' : 'No scans yet. Start by scanning your first document!'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="glass p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold">Forensic Status</h3>
                    <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20 flex items-center gap-6">
                        <div className="p-3 bg-blue-600 rounded-xl text-white">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Engine v2.4 Active</p>
                            <p className="text-sm text-zinc-400 leading-relaxed">System is performing at peak efficiency with 99.8% detection accuracy.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-800/40 rounded-xl text-center">
                            <p className="text-2xl font-bold">12ms</p>
                            <p className="text-xs text-zinc-500 uppercase font-medium">Avg Latency</p>
                        </div>
                        <div className="p-4 bg-zinc-800/40 rounded-xl text-center">
                            <p className="text-2xl font-bold">2.4TB</p>
                            <p className="text-xs text-zinc-500 uppercase font-medium">Data Verified</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashCard = ({ label, value, icon }: any) => (
    <div className="glass p-6 rounded-2xl flex items-center gap-5">
        <div className="p-4 bg-zinc-800/50 rounded-xl text-2xl">{icon}</div>
        <div>
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

const RecentItem = ({ label, status, date, color = "text-green-500" }: any) => (
    <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
        <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-zinc-500" />
            <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-zinc-500">{date}</p>
            </div>
        </div>
        <span className={`text-xs font-bold uppercase ${color}`}>{status}</span>
    </div>
);

export default Dashboard;
