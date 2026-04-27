import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Navbar } from './Navbar.tsx';

interface LayoutProps {
    children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow w-full max-w-[1920px] mx-auto px-4 md:px-8 py-8">
                {children}
            </main>
            <footer className="py-12 border-t border-zinc-800 mt-20">
                <div className="w-full max-w-[1920px] mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-zinc-500 text-sm">&copy; {new Date().getFullYear()} DocuGuard Forensics. Global Protection.</p>
                    <div className="flex items-center gap-8">
                        <Link to="/disclaimer" className="text-sm text-zinc-500 hover:text-white transition-colors">Legal Disclaimer</Link>
                        <Link to="/terms" className="text-sm text-zinc-500 hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/privacy" className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
