import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, Zap, Lock as LockIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';

const Landing: React.FC = () => {
    const { user } = useAuth();
    const [openFaq, setOpenFaq] = React.useState<number | null>(null);

    const faqs = [
        {
            q: 'What is DocuGuard?',
            a: 'DocuGuard is an AI-powered document forensics platform that instantly detects forgery, tampering, and digital fabrication in financial documents. It uses advanced machine learning models trained on millions of forged documents to identify suspicious patterns with high accuracy.',
        },
        {
            q: 'How does DocuGuard detect document forgery?',
            a: 'DocuGuard performs pixel-level tampering analysis, compression artifact inspection, and metadata verification. Our AI engine flags inconsistencies that are invisible to the human eye, then generates a detailed forensic report with a confidence score.',
        },
        {
            q: 'Is DocuGuard free to use?',
            a: 'Yes — DocuGuard is free to use. Simply create an account to access unlimited document scans, your forensic history, and the analytics dashboard.',
        },
        {
            q: 'What types of documents can DocuGuard scan?',
            a: 'DocuGuard supports financial documents including bank statements, invoices, pay slips, identity cards, passports, and other PDF or image-format documents.',
        },
        {
            q: 'Is my document data kept private?',
            a: 'Absolutely. DocuGuard uses enterprise-grade encryption for all uploaded documents. Documents are processed in-memory and can be auto-deleted after scanning — your data is never shared or used for training.',
        },
    ];

    return (
        <div className="space-y-32 py-12">
            {/* Hero */}
            <div className="flex flex-col items-center justify-center text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium">
                    <Zap className="w-4 h-4 fill-blue-400" />
                    <span>v1.0 is now live</span>
                </div>
                <h1 className="font-bold max-w-5xl leading-tight tracking-tighter" style={{ fontSize: 'clamp(2rem, 8vw, 6rem)' }}>
                    <span className="text-blue-500">DocuGuard</span> — AI Document<br />Forgery Detection &amp; Forensics
                </h1>
                <p className="text-zinc-400 max-w-2xl leading-relaxed" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)' }}>
                    Instantly detect tampering, forgery, and digital fabrication in financial documents with the world's most advanced AI forensics engine. Free document authentication — no technical expertise required.
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
                        className="px-10 py-5 glass text-primary font-bold rounded-2xl text-lg hover:bg-zinc-800 transition-all"
                    >
                        Platform Stats
                    </Link>
                </div>
            </div>

            {/* Features */}
            <div>
                <h2 className="text-center text-2xl font-bold mb-10 text-primary">
                    Why security teams trust DocuGuard
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Search className="w-6 h-6" />}
                        title="Digital Forensics"
                        desc="Analyze pixel-level inconsistencies and compression artifacts that human eyes miss. Get a full forensic report in seconds."
                    />
                    <FeatureCard
                        icon={<Shield className="w-6 h-6" />}
                        title="ML Authentication"
                        desc="Trained on millions of forged documents to identify suspicious patterns with 99% accuracy. Trusted by security professionals."
                    />
                    <FeatureCard
                        icon={<LockIcon className="w-6 h-6" />}
                        title="Privacy First"
                        desc="Enterprise-grade encryption for your documents with auto-deletion options. Your documents are never shared or used for training."
                    />
                </div>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto w-full">
                <h2 className="text-center text-2xl font-bold mb-10 text-primary">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className="glass rounded-2xl overflow-hidden transition-all"
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-primary bg-transparent border-none cursor-pointer"
                                aria-expanded={openFaq === i}
                            >
                                <span>{faq.q}</span>
                                <ChevronDown
                                    className="w-5 h-5 text-blue-400 flex-shrink-0 transition-transform duration-300"
                                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                />
                            </button>
                            {openFaq === i && (
                                <div className="px-6 pb-5 text-zinc-400 leading-relaxed text-sm">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
    <div className="glass p-10 rounded-3xl space-y-4 hover:border-blue-500/30 transition-all">
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            {icon}
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-zinc-400 leading-relaxed">{desc}</p>
    </div>
);

export default Landing;

