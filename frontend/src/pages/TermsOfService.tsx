import React from 'react';

const TermsOfService: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-12 space-y-12">
            <div className="space-y-4">
                <h1 className="text-5xl font-bold">Terms of Service</h1>
                <p className="text-zinc-400 text-lg">Agreement for using DocuGuard Forensics Platform.</p>
            </div>

            <div className="glass p-10 rounded-3xl space-y-8 leading-relaxed text-zinc-300">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">1. Agreement to Terms</h2>
                    <p>
                        By accessing or using the DocuGuard platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">2. Description of Service</h2>
                    <p>
                        DocuGuard provides advanced document forensics, fraud detection, and Know Your Document (KYD) analysis using artificial intelligence and machine learning. Our services are designed to assist in document verification but do not replace professional forensic examination.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">3. User Responsibilities</h2>
                    <p>
                        You are responsible for all documents uploaded to the platform. You warrant that you have the legal right, permission, or authority to analyze the provided documents and that your use of the service complies with all applicable laws and regulations.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">4. Acceptable Use</h2>
                    <p>
                        You agree not to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Upload documents containing illegal, harmful, or prohibited content.</li>
                        <li>Attempt to reverse engineer, decompile, or extract the source code of our forensics engine.</li>
                        <li>Use automated systems (bots, scrapers) to access the service without prior authorization.</li>
                        <li>Interfere with the security or integrity of the platform.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">5. Intellectual Property</h2>
                    <p>
                        DocuGuard retains all rights, title, and interest in the platform, its design, logos, and proprietary algorithms. Users retain ownership of the documents they upload, granting DocuGuard a limited license to process such documents for the purpose of providing analysis results.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">6. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, DocuGuard shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service, or decisions made based on AI-generated reports.
                    </p>
                </section>

                <section className="space-y-4 border-t border-zinc-800 pt-8">
                    <p className="text-sm text-zinc-500">
                        Last updated: April 27, 2026. DocuGuard is a product of Advanced Forensics Group.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
