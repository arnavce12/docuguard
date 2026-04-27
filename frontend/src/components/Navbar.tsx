import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Shield, LayoutDashboard, History as HistoryIcon, PieChart, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../lib/AuthContext.tsx';
import { useState, useEffect } from 'react';

export const Navbar = () => {
    const { user, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    // Close drawer on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when drawer open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const close = () => setMenuOpen(false);

    return (
        <>
            <nav className="sticky top-0 z-50 glass border-b border-zinc-800">
                <div className="container h-20 flex items-center justify-between">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center gap-3 group" onClick={close}>
                        <div className="p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-all">
                            <Shield className="w-8 h-8 text-blue-500" />
                        </div>
                        <span
                            className="text-2xl font-bold tracking-tighter"
                            style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                        >
                            DocuGuard
                        </span>
                    </NavLink>

                    {/* Desktop nav links */}
                    <div className="nav-desktop-links">
                        {user && (
                            <>
                                <NavItem to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                                <NavItem to="/kyd" icon={<Search className="w-4 h-4" />} label="KYD" />
                                <NavItem to="/scanner" icon={<Shield className="w-4 h-4" />} label="Scanner" />
                                <NavItem to="/history" icon={<HistoryIcon className="w-4 h-4" />} label="History" />
                            </>
                        )}
                        <NavItem to="/analytics" icon={<PieChart className="w-4 h-4" />} label="Analytics" />
                    </div>

                    {/* Desktop auth buttons */}
                    <div className="nav-desktop-auth">
                        {!user ? (
                            <>
                                <NavLink to="/auth" className="px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Login</NavLink>
                                <NavLink to="/auth" className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">Sign Up</NavLink>
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

                    {/* Hamburger button — mobile only */}
                    <button
                        className="nav-hamburger"
                        onClick={() => setMenuOpen(prev => !prev)}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    >
                        {menuOpen
                            ? <X className="w-6 h-6 text-white" />
                            : <Menu className="w-6 h-6 text-white" />
                        }
                    </button>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            {menuOpen && <div className="mob-overlay" onClick={close} />}

            {/* Mobile Drawer */}
            <div className={`mob-drawer ${menuOpen ? 'mob-drawer-open' : ''}`}>
                <div className="mob-drawer-inner">
                    {/* Nav links */}
                    <div className="mob-nav-section">
                        <p className="mob-nav-section-label">Navigation</p>
                        {user && (
                            <>
                                <MobNavItem to="/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" onClick={close} />
                                <MobNavItem to="/kyd" icon={<Search className="w-5 h-5" />} label="KYD" onClick={close} />
                                <MobNavItem to="/scanner" icon={<Shield className="w-5 h-5" />} label="Scanner" onClick={close} />
                                <MobNavItem to="/history" icon={<HistoryIcon className="w-5 h-5" />} label="History" onClick={close} />
                            </>
                        )}
                        <MobNavItem to="/analytics" icon={<PieChart className="w-5 h-5" />} label="Analytics" onClick={close} />
                    </div>

                    {/* Auth buttons */}
                    <div className="mob-nav-auth">
                        {!user ? (
                            <>
                                <NavLink
                                    to="/auth"
                                    onClick={close}
                                    className="mob-auth-btn mob-auth-btn-secondary"
                                >
                                    Login
                                </NavLink>
                                <NavLink
                                    to="/auth"
                                    onClick={close}
                                    className="mob-auth-btn mob-auth-btn-primary"
                                >
                                    Sign Up Free
                                </NavLink>
                            </>
                        ) : (
                            <button
                                onClick={() => { signOut(); close(); }}
                                className="mob-auth-btn mob-auth-btn-danger"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

/* ── Desktop NavItem ────────────────────────────────────────────── */
const NavItem = ({ to, icon, label }: { to: string; icon: ReactNode; label: string }) => (
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

/* ── Mobile NavItem ─────────────────────────────────────────────── */
const MobNavItem = ({ to, icon, label, onClick }: { to: string; icon: ReactNode; label: string; onClick: () => void }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `mob-nav-item ${isActive ? 'mob-nav-item-active' : ''}`
        }
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);

export default Navbar;
