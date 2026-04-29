import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Zap, Lock as LockIcon } from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';

const Landing: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-32 py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium">
                    <Zap className="w-4 h-4 fill-blue-400" />
                    <span>v1.0 is now live</span>
                </div>
                <h1 className="font-bold max-w-5xl leading-tight tracking-tighter" style={{ fontSize: 'clamp(2rem, 8vw, 6rem)' }}>
                    The Future of <span className="text-blue-500">Document Trust</span> is Here
                </h1>
                <p className="text-zinc-400 max-w-2xl leading-relaxed" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)' }}>
                    Instantly detect tampering, forgery, and digital fabrication in financial documents with the world's most advanced AI forensics engine.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Link
                        to={user ? "/dashboard" : "/auth"}
                        state={!user ? { mode: 'signup' } : undefined}
                        className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-all shadow-2xl shadow-blue-600/30"
                    >
                        {user ? "Go to Dashboard" : "Start Free Scan"}
                    </Link>
                    <Link
                        to="/analytics"
                        className="px-10 py-5 glass text-white font-bold rounded-2xl text-lg hover:bg-zinc-800 transition-all"
                    >
                        Platform Stats
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={<Search className="w-6 h-6" />}
                    title="Digital Forensics"
                    desc="Analyze pixel-level inconsistencies and compression artifacts that human eyes miss."
                />
                <FeatureCard
                    icon={<Shield className="w-6 h-6" />}
                    title="ML Authentication"
                    desc="Trained on millions of forged documents to identify suspicious patterns with 99% accuracy."
                />
                <FeatureCard
                    icon={<LockIcon className="w-6 h-6" />}
                    title="Privacy First"
                    desc="Enterprise-grade encryption for your documents with auto-deletion options."
                />
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: any) => (
    <div className="glass p-10 rounded-3xl space-y-4 hover:border-blue-500/30 transition-all">
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            {icon}
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">{desc}</p>
    </div>
);

export default Landing;
