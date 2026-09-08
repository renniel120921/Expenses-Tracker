// components/navbar.js
// Presentational shell only — no API calls or data-contract changes here.
// Props: user (Firebase user: displayName, email), onLogout (fn), activeTab (id matching `tabs` below)

const TIPID_NAV_KEY = "tipid:navFrom";
const TIPID_TRANSITION_MS = 220;

window.Navbar = function Navbar({ user, onLogout, activeTab = "home" }) {
    const userName = user?.displayName ? user.displayName.split(" ")[0] : user?.email?.split("@")[0] || "User";
    const initial = userName.charAt(0).toUpperCase();

    const tabs = [
        { id: "home", href: "dashboard.html", label: "Home", icon: HomeIcon },
        { id: "bills", href: "bills.html", label: "Bills", icon: BillsIcon },
        { id: "utang", href: "utang.html", label: "Utang", icon: UtangIcon },
        { id: "grocery", href: "grocery.html", label: "Palengke", icon: CartIcon },
        { id: "scanner", href: "scanner.html", label: "Resibo", icon: ScanIcon },
        { id: "budget", href: "allowance.html", label: "Budget", icon: BudgetIcon },
        { id: "analytics", href: "chart.html", label: "Analytics", icon: AnalyticsIcon },
        { id: "history", href: "history.html", label: "History", icon: HistoryIcon },
        { id: "installments", href: "installments.html", label: "Hulugan", icon: InstallmentIcon },
        { id: "account", href: "profile.html", label: "Account", icon: AccountIcon },
    ];

    // Mobile Partition: 4 main tabs, 6 "more" tabs
    const mainMobileTabs = tabs.slice(0, 4);
    const moreMobileTabs = tabs.slice(4);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [reducedMotion, setReducedMotion] = React.useState(false);

    const [displayActiveTab, setDisplayActiveTab] = React.useState(() => {
        try {
            const from = sessionStorage.getItem(TIPID_NAV_KEY);
            if (from && from !== activeTab) return from;
        } catch (e) { }
        return activeTab;
    });

    const [overlayVisible, setOverlayVisible] = React.useState(() => {
        try { return !!sessionStorage.getItem(TIPID_NAV_KEY); } catch (e) { return false; }
    });

    const isMoreActive = moreMobileTabs.some(t => t.id === displayActiveTab);

    const linkRefs = React.useRef({});
    const navContainerRef = React.useRef(null);
    const [pillStyle, setPillStyle] = React.useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0, isInitial: true });

    React.useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mq.matches);
        const handler = (e) => setReducedMotion(e.matches);
        mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
        return () => (mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler));
    }, []);

    React.useEffect(() => {
        let from = null;
        try {
            from = sessionStorage.getItem(TIPID_NAV_KEY);
            sessionStorage.removeItem(TIPID_NAV_KEY);
        } catch (e) { }

        if (!from) { setOverlayVisible(false); return; }

        const settle = window.setTimeout(() => {
            setDisplayActiveTab(activeTab);
            setOverlayVisible(false);
        }, reducedMotion ? 0 : 70);
        return () => window.clearTimeout(settle);
    }, []);

    React.useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                setIsScrolled(window.scrollY > 8);
                ticking = false;
            });
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleNavigate = React.useCallback((e, href) => {
        if (!href || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        let currentFile = "";
        try { currentFile = window.location.pathname.split("/").pop() || "dashboard.html"; } catch (err) { }
        if (href === currentFile) { e.preventDefault(); return; }

        e.preventDefault();
        try { sessionStorage.setItem(TIPID_NAV_KEY, activeTab); } catch (err) { }

        if (reducedMotion) {
            window.location.href = href;
            return;
        }
        setOverlayVisible(true);
        window.setTimeout(() => { window.location.href = href; }, TIPID_TRANSITION_MS);
    }, [activeTab, reducedMotion]);

    const measurePill = React.useCallback(() => {
        const el = linkRefs.current[displayActiveTab];
        const container = el?.parentElement;
        if (el && container) {
            const elRect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const style = window.getComputedStyle(container);

            const borderLeft = parseFloat(style.borderLeftWidth) || 0;
            const borderTop = parseFloat(style.borderTopWidth) || 0;

            setPillStyle(prev => {
                const newLeft = elRect.left - containerRect.left - borderLeft;
                const newTop = elRect.top - containerRect.top - borderTop;

                if (prev.left === newLeft && prev.top === newTop && prev.width === elRect.width && prev.height === elRect.height && !prev.isInitial) {
                    return prev;
                }
                return { left: newLeft, top: newTop, width: elRect.width, height: elRect.height, opacity: 1, isInitial: false };
            });
        }
    }, [displayActiveTab]);

    React.useLayoutEffect(() => {
        measurePill();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measurePill);
        window.addEventListener("resize", measurePill);
        return () => window.removeEventListener("resize", measurePill);
    }, [measurePill]);

    React.useEffect(() => {
        const container = navContainerRef.current;
        if (!container || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => measurePill());
        ro.observe(container);
        return () => ro.disconnect();
    }, [measurePill]);

    React.useEffect(() => {
        if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMobileMenuOpen]);

    React.useEffect(() => {
        if (!isMobileMenuOpen) return;
        const onKey = (e) => { if (e.key === "Escape") setIsMobileMenuOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isMobileMenuOpen]);

    return (
        <React.Fragment>
            <style>{`
                .hide-scroll-nav { -ms-overflow-style: none; scrollbar-width: none; }
                .hide-scroll-nav::-webkit-scrollbar { display: none; }
                @keyframes tipid-sheet-item-in {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .tipid-sheet-item { animation: none !important; }
                }
            `}</style>

            <div
                aria-hidden="true"
                className={`fixed inset-0 z-[70] bg-paper dark:bg-ink2 transition-opacity ease-out ${reducedMotion ? "duration-0" : "duration-[220ms]"} ${overlayVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            />

            {/* ---------- Desktop nav ---------- */}
            <nav className={`hidden md:flex justify-center bg-white/80 dark:bg-ink2/80 backdrop-blur-2xl text-ink dark:text-paper w-full sticky top-0 z-50 border-b transition-[box-shadow,border-color] duration-500 ${isScrolled ? "border-line/60 dark:border-white/15 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.18)]" : "border-line/40 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.06)]"}`}>
                <div className={`w-full max-w-[1200px] px-4 md:px-5 lg:px-6 flex justify-between items-center gap-3 transition-[padding] duration-500 ${isScrolled ? "py-2.5 lg:py-3" : "py-3 lg:py-4"}`}>
                    <div className="flex-none flex justify-start shrink-0">
                        <a href="dashboard.html" onClick={(e) => handleNavigate(e, "dashboard.html")} className="flex items-center gap-2.5 lg:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-xl">
                            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1">
                                <window.Logo size={28} />
                            </div>
                            <span className="hidden lg:inline font-display font-semibold text-xl tracking-tight">Tipid</span>
                        </a>
                    </div>

                    <div className="flex-1 min-w-0 flex justify-center px-1">
                        <div ref={navContainerRef} className="flex relative flex-nowrap items-center gap-0.5 lg:gap-1 max-w-full overflow-x-auto hide-scroll-nav py-1">
                            <div
                                className="absolute bottom-0 h-[2.5px] rounded-full bg-gradient-to-r from-peso to-pesoLight dark:from-pesoLight dark:to-gold pointer-events-none"
                                style={{
                                    left: pillStyle.left,
                                    width: pillStyle.width,
                                    opacity: pillStyle.opacity,
                                    transition: pillStyle.isInitial || reducedMotion ? "none" : "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                }}
                            />
                            {tabs.map((tab) => (
                                <DesktopNavLink key={tab.id} innerRef={(el) => (linkRefs.current[tab.id] = el)} href={tab.href} label={tab.label} active={displayActiveTab === tab.id} onClick={(e) => handleNavigate(e, tab.href)} icon={<tab.icon active={displayActiveTab === tab.id} size={16} />} />
                            ))}
                        </div>
                    </div>

                    <div className="flex-none flex items-center justify-end gap-3 lg:gap-6 shrink-0">
                        <a href="profile.html" onClick={(e) => handleNavigate(e, "profile.html")} className="flex items-center gap-2.5 lg:gap-3 min-w-0 active:scale-95 transition-transform rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 group">
                            <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0 transition-shadow duration-300 group-hover:shadow-[0_0_0_3px_rgba(31,111,84,0.15)]">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/15 to-pesoLight/5 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-sm shadow-inner overflow-hidden">
                                    {user && user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : initial}
                                </div>
                            </div>
                            <span className="hidden xl:block text-sm font-semibold text-ink2 dark:text-paper/80 truncate max-w-[120px]">{userName}</span>
                        </a>
                        <button onClick={onLogout} aria-label="Log out" className="flex items-center gap-1.5 text-sm font-semibold text-ink2/50 dark:text-paper/45 hover:text-expense hover:bg-expense/10 active:scale-95 transition-all duration-300 shrink-0 pl-2 lg:pl-3 pr-2 lg:pr-3.5 py-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40">
                            <LogOutIcon size={15} />
                            <span className="hidden lg:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ---------- Mobile header ---------- */}
            <header
                className={`md:hidden bg-white/85 dark:bg-ink2/85 backdrop-blur-2xl px-5 flex justify-between items-center fixed top-0 w-full z-50 border-b transition-[padding,box-shadow,border-color] duration-500 ${isScrolled ? "pb-2.5 border-line/50 dark:border-white/15 shadow-[0_6px_28px_-14px_rgba(0,0,0,0.14)]" : "pb-3.5 border-line/30 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]"}`}
                style={{ paddingTop: isScrolled ? 'max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))' : 'max(1rem, calc(env(safe-area-inset-top) + 0.65rem))' }}
            >
                <a href="profile.html" onClick={(e) => handleNavigate(e, "profile.html")} className="flex items-center gap-3.5 min-w-0 active:scale-95 transition-transform rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40">
                    <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/20 to-pesoLight/5 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-base shadow-inner overflow-hidden">
                            {user && user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : initial}
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-ink dark:text-paper text-[15px] truncate tracking-tight">Hello, {userName}!</span>
                        <span className="text-[10px] font-medium text-peso dark:text-pesoLight uppercase tracking-wider">Tingnan ang Profile</span>
                    </div>
                </a>
                <button onClick={onLogout} aria-label="Log out" className="text-ink2/40 dark:text-paper/40 hover:text-expense hover:bg-expense/10 rounded-full p-2 active:scale-90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 shrink-0">
                    <LogOutIcon size={20} />
                </button>
            </header>

            {/* ---------- MINIMAL, REALISTIC BOTTOM TAB BAR (reference-matched) ---------- */}
            <nav
                className="md:hidden fixed left-0 right-0 bottom-0 z-40 bg-white/95 dark:bg-ink2/95 backdrop-blur-2xl border-t border-line/70 dark:border-white/10"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-stretch justify-between max-w-[480px] mx-auto px-1">
                    {mainMobileTabs.map((tab) => (
                        <BottomNavBtn
                            key={tab.id}
                            href={tab.href}
                            label={tab.label}
                            active={displayActiveTab === tab.id}
                            onClick={(e) => handleNavigate(e, tab.href)}
                            icon={<tab.icon active={displayActiveTab === tab.id} size={22} />}
                        />
                    ))}
                    <BottomNavBtn
                        as="button"
                        onClick={() => setIsMobileMenuOpen(true)}
                        label="More"
                        active={isMoreActive}
                        icon={<MenuIcon active={isMoreActive} size={22} />}
                    />
                </div>
            </nav>

            {/* ---------- "More" sheet ---------- */}
            <div className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Iba pang menu"
                    className={`absolute bottom-0 left-0 right-0 bg-paper dark:bg-ink2 rounded-t-[2rem] px-6 pt-4 shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.34,1.1,0.64,1)] ${isMobileMenuOpen ? "translate-y-0" : "translate-y-full"}`}
                    style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 2rem))' }}
                >
                    <div className="w-12 h-1.5 bg-line dark:bg-white/20 rounded-full mx-auto mb-6" />
                    <h3 className="font-display text-[1.35rem] font-semibold mb-5 text-ink dark:text-paper px-1 tracking-tight">Iba pang Menu</h3>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {moreMobileTabs.map((tab, i) => (
                            <a
                                key={tab.id}
                                href={tab.href}
                                onClick={(e) => handleNavigate(e, tab.href)}
                                className="tipid-sheet-item group flex flex-col items-center justify-center gap-2.5 p-4 rounded-[1.25rem] bg-white dark:bg-white/[0.05] hover:bg-paperDim dark:hover:bg-white/10 active:scale-95 transition-all duration-200 border border-line/30 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                                style={isMobileMenuOpen ? { animation: `tipid-sheet-item-in 0.35s cubic-bezier(0.34,1.4,0.64,1) both`, animationDelay: `${i * 35}ms` } : undefined}
                            >
                                <div className={`w-[3.25rem] h-[3.25rem] rounded-full flex items-center justify-center transition-all duration-300 ${displayActiveTab === tab.id ? "bg-[#E6F3EF] dark:bg-[#1F6F54]/20 text-[#1F6F54] dark:text-[#52C8A1]" : "bg-paperDim/50 dark:bg-white/10 text-ink2/70 dark:text-paper/70 group-hover:scale-105"}`}>
                                    <tab.icon active={displayActiveTab === tab.id} size={22} />
                                </div>
                                <span className={`text-[11px] font-semibold tracking-tight transition-colors ${displayActiveTab === tab.id ? "text-peso dark:text-[#52C8A1]" : "text-ink2/80 dark:text-paper/80"}`}>{tab.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const DesktopNavLink = ({ href, label, active, icon, innerRef, onClick }) => (
    <a ref={innerRef} href={href} onClick={onClick} aria-current={active ? "page" : undefined} title={label} className={`relative flex items-center gap-1.5 lg:gap-2 whitespace-nowrap shrink-0 transition-all duration-300 px-2.5 lg:px-3.5 py-2 lg:py-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 ${active ? 'font-semibold text-peso dark:text-pesoLight' : 'font-medium text-ink2/55 dark:text-paper/45 hover:text-ink dark:hover:text-paper'}`}>
        {icon} <span className="hidden lg:inline text-[13px] lg:text-sm">{label}</span>
    </a>
);

// MINIMAL BOTTOM NAV BUTTON — icon + label, color communicates state (no background pill),
// matching the reference tab bar's understated realism.
const BottomNavBtn = ({ href, icon, label, active, onClick, as = "a" }) => {
    const Tag = as;
    return (
        <Tag
            href={href}
            onClick={onClick}
            aria-current={active ? "page" : undefined}
            aria-label={label}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 focus:outline-none rounded-xl active:scale-95 transition-transform duration-200 cursor-pointer group"
        >
            <span className={`transition-colors duration-200 ${active ? "text-peso dark:text-pesoLight" : "text-ink2/45 dark:text-paper/40 group-hover:text-ink2/70 dark:group-hover:text-paper/60"}`}>
                {icon}
            </span>
            <span className={`text-[10.5px] leading-none tracking-tight transition-colors duration-200 ${active ? "font-semibold text-peso dark:text-pesoLight" : "font-medium text-ink2/45 dark:text-paper/40 group-hover:text-ink2/70 dark:group-hover:text-paper/60"}`}>
                {label}
            </span>
        </Tag>
    );
};

/* --- CLEAN, UNIFORM LINE ICONS (outline-only, color communicates active state — like the reference) --- */
const HomeIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5l9-7 9 7v10.5a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>
);
const BillsIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 14h-8"/><path d="M16 10h-8"/></svg>
);
const UtangIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const CartIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const MenuIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
);
const ScanIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>);
const BudgetIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);
const AnalyticsIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>);
const HistoryIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const InstallmentIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const AccountIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LogOutIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
