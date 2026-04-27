import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 space-y-12">
            <div className="space-y-4">
                <h1 className="text-5xl font-bold">Privacy Policy</h1>
                <p className="text-zinc-400 text-lg">How we protect and manage your document data.</p>
            </div>

            <div className="glass p-10 rounded-3xl space-y-8 leading-relaxed text-zinc-300">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">1. Information We Collect</h2>
                    <p>
                        We collect information necessary to provide our forensics services:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Account Data:</strong> Email addresses and authentication details managed through Supabase.</li>
                        <li><strong>Document Data:</strong> Files uploaded for analysis, including text content, metadata, and visual patterns.</li>
                        <li><strong>Usage Data:</strong> Technical information about how you interact with our platform to improve performance.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">2. How We Use Your Data</h2>
                    <p>
                        Your data is used specifically for:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Performing document forensics and fraud analysis.</li>
                        <li>Generating health scores and KYD (Know Your Document) reports.</li>
                        <li>Maintaining your personal scan history for your future reference.</li>
                        <li>Improving our AI detection models (anonymized data only).</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">3. Data Sharing & Third Parties</h2>
                    <p>
                        We do not sell your personal or document data. We share data only with trusted service providers essential to our operations:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Supabase:</strong> For secure authentication and database management.</li>
                        <li><strong>Google Gemini AI:</strong> For processing and analyzing document contents using state-of-the-art LLMs.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">4. Data Security</h2>
                    <p>
                        Security is our priority. We implement:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>End-to-end encryption for all document transmissions.</li>
                        <li>Secure storage with strict access controls.</li>
                        <li>Regular security audits of our forensic processing pipeline.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">5. Your Rights</h2>
                    <p>
                        You have full control over your data. You can:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access and export your complete scan history.</li>
                        <li>Delete individual scan records or your entire account data at any time.</li>
                        <li>Request information about how your data is being processed.</li>
                    </ul>
                </section>

                <section className="space-y-4 border-t border-zinc-800 pt-8">
                    <p className="text-sm text-zinc-500">
                        Last updated: April 27, 2026. Your privacy is paramount at DocuGuard.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
