import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, ShieldAlert, Activity, Shield, Zap, BarChart3 } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Link } from 'react-router-dom';

const Analytics: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        setLoading(true);
        apiClient.fetch('/stats')
            .then(data => {
                setStats(data);
                setError(null);
                // Trigger animations after data loads
                setTimeout(() => setAnimated(true), 100);
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
                <div className="analytics-loader" />
                <p className="text-zinc-400 font-medium tracking-tight">Accessing Platform Forensics...</p>
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

    const totalScans = stats.total_scans || 0;

    return (
        <div className="analytics-page space-y-12">
            {/* Hero Header */}
            <div className="analytics-hero">
                <div className="analytics-hero-glow" />
                <div className="relative z-10 text-center space-y-6 py-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full analytics-badge">
                        <Zap className="w-4 h-4" style={{ color: '#60a5fa' }} />
                        <span style={{ color: '#93c5fd', fontSize: '0.875rem', fontWeight: 600 }}>Live Platform Intelligence</span>
                    </div>
                    <h1 className="font-bold tracking-tighter" style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)' }}>
                        Global <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forensic Analytics</span>
                    </h1>
                    <p className="text-zinc-400 max-w-2xl mx-auto" style={{ fontSize: 'clamp(0.875rem, 2vw, 1.125rem)' }}>
                        Real-time threat intelligence and detection performance across the entire DocuGuard network.
                    </p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <GlowStatCard
                    icon={<Activity />}
                    label="Total Scans"
                    value={totalScans}
                    gradient="linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))"
                    borderColor="rgba(59,130,246,0.3)"
                    iconBg="rgba(59,130,246,0.2)"
                    iconColor="#60a5fa"
                    animated={animated}
                />
                <GlowStatCard
                    icon={<ShieldAlert />}
                    label="High Risk Detected"
                    value={stats.high_risk_count}
                    gradient="linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))"
                    borderColor="rgba(239,68,68,0.3)"
                    iconBg="rgba(239,68,68,0.2)"
                    iconColor="#f87171"
                    animated={animated}
                />
                <GlowStatCard
                    icon={<TrendingUp />}
                    label="Avg Confidence"
                    value={`${stats.avg_confidence}%`}
                    gradient="linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))"
                    borderColor="rgba(34,197,94,0.3)"
                    iconBg="rgba(34,197,94,0.2)"
                    iconColor="#4ade80"
                    animated={animated}
                />
                <GlowStatCard
                    icon={<PieChart />}
                    label="Red Flags Found"
                    value={stats.top_red_flags.length}
                    gradient="linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))"
                    borderColor="rgba(234,179,8,0.3)"
                    iconBg="rgba(234,179,8,0.2)"
                    iconColor="#facc15"
                    animated={animated}
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Distribution */}
                <div className="analytics-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'rgba(139,92,246,0.15)' }}>
                            <BarChart3 className="w-5 h-5" style={{ color: '#a78bfa' }} />
                        </div>
                        <h3 className="text-xl font-bold">Risk Distribution</h3>
                    </div>
                    <div className="space-y-5 pt-2">
                        <AnimatedRiskBar label="High Risk" count={stats.risk_distribution.high} total={totalScans} color="#ef4444" bgColor="rgba(239,68,68,0.15)" animated={animated} />
                        <AnimatedRiskBar label="Medium Risk" count={stats.risk_distribution.medium} total={totalScans} color="#eab308" bgColor="rgba(234,179,8,0.15)" animated={animated} />
                        <AnimatedRiskBar label="Low Risk" count={stats.risk_distribution.low} total={totalScans} color="#22c55e" bgColor="rgba(34,197,94,0.15)" animated={animated} />
                    </div>

                    {/* Combined donut chart */}
                    {(() => {
                        const high = stats.risk_distribution.high || 0;
                        const medium = stats.risk_distribution.medium || 0;
                        const low = stats.risk_distribution.low || 0;
                        const total = high + medium + low;
                        const circumference = 2 * Math.PI * 54; // r=54
                        const highPct = total > 0 ? high / total : 0;
                        const medPct = total > 0 ? medium / total : 0;
                        const lowPct = total > 0 ? low / total : 0;
                        const highLen = highPct * circumference;
                        const medLen = medPct * circumference;
                        const lowLen = lowPct * circumference;
                        const highOffset = 0;
                        const medOffset = highLen;
                        const lowOffset = highLen + medLen;

                        return (
                            <div className="flex flex-col items-center gap-6" style={{ borderTop: '1px solid rgba(63,63,70,0.4)', marginTop: '1.5rem', paddingTop: '2rem' }}>
                                <div className="relative" style={{ width: '100%', maxWidth: '220px', aspectRatio: '1 / 1' }}>
                                    <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                        {/* Background ring */}
                                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(63,63,70,0.3)" strokeWidth="12" />
                                        {/* High Risk arc (red) */}
                                        {highLen > 0 && (
                                            <circle
                                                cx="60" cy="60" r="54" fill="none"
                                                stroke="#ef4444"
                                                strokeWidth="12"
                                                strokeDasharray={`${animated ? highLen : 0} ${circumference}`}
                                                strokeDashoffset={-highOffset}
                                                strokeLinecap="butt"
                                                style={{ transition: 'stroke-dasharray 1.2s ease-out', filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.4))' }}
                                            />
                                        )}
                                        {/* Medium Risk arc (yellow) */}
                                        {medLen > 0 && (
                                            <circle
                                                cx="60" cy="60" r="54" fill="none"
                                                stroke="#eab308"
                                                strokeWidth="12"
                                                strokeDasharray={`${animated ? medLen : 0} ${circumference}`}
                                                strokeDashoffset={-medOffset}
                                                strokeLinecap="butt"
                                                style={{ transition: 'stroke-dasharray 1.4s ease-out', filter: 'drop-shadow(0 0 6px rgba(234,179,8,0.4))' }}
                                            />
                                        )}
                                        {/* Low Risk arc (green) */}
                                        {lowLen > 0 && (
                                            <circle
                                                cx="60" cy="60" r="54" fill="none"
                                                stroke="#22c55e"
                                                strokeWidth="12"
                                                strokeDasharray={`${animated ? lowLen : 0} ${circumference}`}
                                                strokeDashoffset={-lowOffset}
                                                strokeLinecap="butt"
                                                style={{ transition: 'stroke-dasharray 1.6s ease-out', filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.4))' }}
                                            />
                                        )}
                                    </svg>
                                    {/* Center label — perfectly centered via flexbox and inset:0 */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        pointerEvents: 'none',
                                        marginTop: '130px'
                                    }}>
                                        <span className="text-3xl font-bold" style={{ lineHeight: 1 }}>{total}</span>
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider" style={{ marginTop: '10px', lineHeight: 1 }}>Total</span>
                                    </div>
                                </div>
                                {/* Legend — wraps on narrow screens */}
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    {[
                                        { label: 'High', count: high, color: '#ef4444' },
                                        { label: 'Medium', count: medium, color: '#eab308' },
                                        { label: 'Low', count: low, color: '#22c55e' },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-2">
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, boxShadow: `0 0 8px ${item.color}60` }} />
                                            <span className="text-sm text-zinc-300 font-medium">{item.label}</span>
                                            <span className="text-sm font-bold" style={{ color: item.color }}>{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Top Red Flags */}
                <div className="analytics-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'rgba(234,179,8,0.15)' }}>
                            <ShieldAlert className="w-5 h-5" style={{ color: '#facc15' }} />
                        </div>
                        <h3 className="text-xl font-bold">Top Red Flags</h3>
                    </div>
                    <div className="space-y-3 pt-2">
                        {stats.top_red_flags.map((item: any, i: number) => (
                            <div key={i} className="analytics-flag-item" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex items-center gap-3">
                                    <span className="analytics-flag-rank">{i + 1}</span>
                                    <span className="text-sm font-medium text-zinc-200">{item.flag}</span>
                                </div>
                                <span className="analytics-flag-count">{item.count} hits</span>
                            </div>
                        ))}
                        {stats.top_red_flags.length === 0 && (
                            <p className="text-sm text-zinc-500 text-center py-6">No red flags detected yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* CTA Banner */}
            <div className="analytics-cta">
                <div className="analytics-cta-glow" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-8">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                            <Shield className="w-8 h-8" style={{ color: '#60a5fa' }} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">Ready to Protect Your Documents?</h3>
                            <p className="text-zinc-400 text-sm">Join the DocuGuard network and start scanning with AI-powered forensics.</p>
                        </div>
                    </div>
                    <Link
                        to="/auth"
                        className="analytics-cta-btn"
                    >
                        Get Started Free
                    </Link>
                </div>
            </div>
        </div>
    );
};

/* ── Glow Stat Card ────────────────────────────────────────────── */
const GlowStatCard = ({ icon, label, value, gradient, borderColor, iconBg, iconColor, animated }: any) => (
    <div
        className="analytics-stat-card"
        style={{
            background: gradient,
            borderColor: borderColor,
            transform: animated ? 'translateY(0)' : 'translateY(20px)',
            opacity: animated ? 1 : 0,
            transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
        }}
    >
        <div className="p-2.5 w-fit rounded-xl" style={{ background: iconBg, color: iconColor }}>{icon}</div>
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
    </div>
);

/* ── Animated Risk Bar ─────────────────────────────────────────── */
const AnimatedRiskBar = ({ label, count, total, color, animated }: any) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-zinc-300 font-medium">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color }}>{count}</span>
                    <span className="text-zinc-500">({Math.round(percent)}%)</span>
                </div>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'rgba(39,39,42,0.6)' }}>
                <div
                    className="h-full rounded-full"
                    style={{
                        width: animated ? `${percent}%` : '0%',
                        background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                        transition: 'width 1.2s ease-out',
                        boxShadow: `0 0 12px ${color}40`,
                    }}
                />
            </div>
        </div>
    );
};

export default Analytics;
