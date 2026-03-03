import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Shield, LayoutDashboard, History as HistoryIcon, PieChart } from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';

export const Navbar = () => {
    const { user, signOut } = useAuth();

    return (
        <nav className="sticky top-0 z-50 glass border-b border-zinc-800">
            <div className="container h-20 flex items-center justify-between">
                <NavLink to="/" className="flex items-center gap-3 group">
                    <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-all">
                        <Shield className="w-8 h-8 text-blue-500" />
                    </div>
                    <span className="text-2xl font-bold tracking-tighter" style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DocuGuard</span>
                </NavLink>

                <div className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
                    {user && (
                        <>
                            <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                            <NavItem to="/scanner" icon={<Shield className="w-4 h-4" />} label="Scanner" />
                            <NavItem to="/history" icon={<HistoryIcon className="w-4 h-4" />} label="History" />
                        </>
                    )}
                    <NavItem to="/analytics" icon={<PieChart className="w-4 h-4" />} label="Analytics" />
                </div>

                <div className="flex items-center gap-4">
                    {!user ? (
                        <>
                            <NavLink to="/auth" className="px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors">
                                Login
                            </NavLink>
                            <NavLink to="/auth" className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                Sign Up
                            </NavLink>
                        </>
                    ) : (
                        <button
                            onClick={() => signOut()}
                            className="px-6 py-2.5 text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all active:scale-95 border border-zinc-700"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

const NavItem = ({ to, icon, label }: { to: string, icon: ReactNode, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                ? 'bg-zinc-800 text-blue-500 shadow-sm'
                : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
            }`
        }
    >
        {icon}
        {label}
    </NavLink>
);


