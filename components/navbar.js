// components/navbar.js

window.Navbar = function Navbar({ user, onLogout, activeTab = "home" }) {
    const userName = user?.displayName ? user.displayName.split(" ")[0] : user?.email?.split("@")[0] || "User";
    const initial = userName.charAt(0).toUpperCase();

    // Idinagdag ang "Resibo" (Scanner) tab
    const tabs = [
        { id: "home", href: "dashboard.html", label: "Home", icon: HomeIcon },
        { id: "bills", href: "bills.html", label: "Bills", icon: BillsIcon },
        { id: "utang", href: "utang.html", label: "Utang", icon: UtangIcon },
        { id: "grocery", href: "grocery.html", label: "Palengke", icon: CartIcon },
        { id: "scanner", href: "scanner.html", label: "Resibo", icon: ScanIcon }, // <-- BAGONG TAB
        { id: "budget", href: "allowance.html", label: "Budget", icon: BudgetIcon },
        { id: "analytics", href: "chart.html", label: "Analytics", icon: AnalyticsIcon },
        { id: "history", href: "history.html", label: "History", icon: HistoryIcon },
        { id: "installments", href: "installments.html", label: "Hulugan", icon: InstallmentIcon },
        { id: "account", href: "profile.html", label: "Account", icon: AccountIcon },
    ];

    // Mobile Partition: 4 main tabs, 6 "more" tabs
    const mainMobileTabs = tabs.slice(0, 4);
    const moreMobileTabs = tabs.slice(4);

    const isMoreActive = moreMobileTabs.some(t => t.id === activeTab);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const linkRefs = React.useRef({});
    const navContainerRef = React.useRef(null);
    const [pillStyle, setPillStyle] = React.useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0, isInitial: true });

    const measurePill = React.useCallback(() => {
        const el = linkRefs.current[activeTab];
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
    }, [activeTab]);

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

    const [mobileMounted, setMobileMounted] = React.useState(false);
    React.useEffect(() => {
        const id = requestAnimationFrame(() => setMobileMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    React.useEffect(() => {
        if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isMobileMenuOpen]);

    return (
        <React.Fragment>
            <style>{`
                .hide-scroll-nav { -ms-overflow-style: none; scrollbar-width: none; }
                .hide-scroll-nav::-webkit-scrollbar { display: none; }
            `}</style>

            <nav className="hidden md:flex justify-center bg-white/75 dark:bg-ink2/75 backdrop-blur-2xl text-ink dark:text-paper w-full sticky top-0 z-50 border-b border-line/40 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.06)]">
                <div className="w-full max-w-[1200px] px-4 md:px-5 lg:px-6 py-3 lg:py-4 flex justify-between items-center gap-3">
                    <div className="flex-none flex justify-start shrink-0">
                        <a href="dashboard.html" className="flex items-center gap-2.5 lg:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-xl">
                            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1">
                                <window.Logo size={28} />
                            </div>
                            <span className="hidden lg:inline font-display font-semibold text-xl tracking-tight">Tipid</span>
                        </a>
                    </div>

                    <div className="flex-1 min-w-0 block text-center px-1">
                        <div ref={navContainerRef} className="inline-flex relative flex-nowrap items-center gap-0.5 lg:gap-1 max-w-full overflow-x-auto hide-scroll-nav bg-paperDim/60 dark:bg-white/[0.04] p-1.5 rounded-full border border-line/50 dark:border-white/5 shadow-inner text-left">
                            <div className="absolute rounded-full bg-white dark:bg-ink2 ring-1 ring-black/[0.04] dark:ring-white/10 shadow-md pointer-events-none" style={{ left: pillStyle.left, top: pillStyle.top, width: pillStyle.width, height: pillStyle.height, opacity: pillStyle.opacity, transition: pillStyle.isInitial ? "none" : "all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
                            {tabs.map((tab) => (
                                <DesktopNavLink key={tab.id} innerRef={(el) => (linkRefs.current[tab.id] = el)} href={tab.href} label={tab.label} active={activeTab === tab.id} icon={<tab.icon active={activeTab === tab.id} size={16} />} />
                            ))}
                        </div>
                    </div>

                    <div className="flex-none flex items-center justify-end gap-3 lg:gap-6 shrink-0">
                        <a href="profile.html" className="flex items-center gap-2.5 lg:gap-3 min-w-0 active:scale-95 transition-transform rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40">
                            <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/15 to-pesoLight/5 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-sm shadow-inner">
                                    {initial}
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

            <header className="md:hidden bg-white/85 dark:bg-ink2/85 backdrop-blur-2xl px-5 pb-3.5 flex justify-between items-center fixed top-0 w-full z-50 border-b border-line/30 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]" style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top) + 0.65rem))' }}>
                <a href="profile.html" className="flex items-center gap-3.5 min-w-0 active:scale-95 transition-transform rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40">
                    <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/20 to-pesoLight/5 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-base shadow-inner">
                            {initial}
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

            <nav className="md:hidden fixed left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-[400px]" style={{ bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}>
                <div className="relative h-[4.25rem] bg-white/90 dark:bg-ink2/90 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[1.75rem] flex items-center justify-between px-1.5">
                    {mainMobileTabs.map((tab) => (
                        <BottomNavBtn key={tab.id} href={tab.href} label={tab.label} active={activeTab === tab.id} allowTransition={mobileMounted} icon={<tab.icon active={activeTab === tab.id} size={activeTab === tab.id ? 22 : 24} />} />
                    ))}
                    <BottomNavBtn as="button" onClick={() => setIsMobileMenuOpen(true)} label="Menu" active={isMoreActive} allowTransition={mobileMounted} icon={<MenuIcon active={isMoreActive} size={isMoreActive ? 22 : 24} />} />
                </div>
            </nav>

            <div className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                <div className={`absolute bottom-0 left-0 right-0 bg-paper dark:bg-ink2 rounded-t-[2rem] px-6 pt-4 shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.34,1.1,0.64,1)] ${isMobileMenuOpen ? "translate-y-0" : "translate-y-full"}`} style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 2rem))' }}>
                    <div className="w-12 h-1.5 bg-line dark:bg-white/20 rounded-full mx-auto mb-6" />
                    <h3 className="font-display text-[1.35rem] font-semibold mb-5 text-ink dark:text-paper px-1 tracking-tight">Iba pang Menu</h3>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {moreMobileTabs.map(tab => (
                            <a key={tab.id} href={tab.href} className="group flex flex-col items-center justify-center gap-2.5 p-4 rounded-[1.25rem] bg-white dark:bg-white/[0.05] hover:bg-paperDim dark:hover:bg-white/10 active:scale-95 transition-all duration-200 border border-line/30 dark:border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                                <div className={`w-[3.25rem] h-[3.25rem] rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? "bg-[#A0D44A] text-[#111A15] shadow-md scale-110" : "bg-paperDim/50 dark:bg-white/10 text-ink dark:text-paper group-hover:scale-105"}`}>
                                    <tab.icon active={activeTab === tab.id} size={24} />
                                </div>
                                <span className={`text-[11px] font-semibold tracking-tight transition-colors ${activeTab === tab.id ? "text-peso dark:text-[#A0D44A]" : "text-ink2/80 dark:text-paper/80"}`}>{tab.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const DesktopNavLink = ({ href, label, active, icon, innerRef }) => (
    <a ref={innerRef} href={href} aria-current={active ? "page" : undefined} className={`relative z-10 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap shrink-0 transition-all duration-300 px-3 lg:px-4 py-2 lg:py-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 ${active ? 'font-bold text-peso dark:text-pesoLight' : 'font-medium text-ink2/50 dark:text-paper/40 hover:text-ink dark:hover:text-paper hover:bg-black/5 dark:hover:bg-white/5'}`}>
        {icon} <span className="text-[13px] lg:text-sm">{label}</span>
    </a>
);

const BottomNavBtn = ({ href, icon, label, active, allowTransition, onClick, as = "a" }) => {
    const Tag = as;
    return (
        <Tag href={href} onClick={onClick} aria-current={active ? "page" : undefined} aria-label={label} className="relative flex-1 flex flex-col items-center justify-center h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-2xl active:scale-[0.85] transition-transform duration-300 cursor-pointer">
            <div className={`absolute flex items-center justify-center ${allowTransition ? "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" : ""} ${active ? "-top-[1.1rem] w-[3.15rem] h-[3.15rem] bg-[#A0D44A] rounded-full shadow-[0_8px_16px_-4px_rgba(160,212,74,0.6)] text-[#111A15]" : "top-[14px] w-7 h-7 bg-transparent text-ink2/40 dark:text-paper/40"}`}>
                {icon}
            </div>
            <span className={`absolute bottom-1.5 text-[9.5px] font-semibold tracking-tight ${allowTransition ? "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" : ""} ${active ? "opacity-0 translate-y-3 pointer-events-none scale-90" : "opacity-100 translate-y-0 text-ink2/50 dark:text-paper/50 scale-100"}`}>
                {label}
            </span>
        </Tag>
    );
};

/* --- ICONS --- */
const MenuIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><rect x="4" y="4" width="6" height="6" rx="2" fill="currentColor" opacity="0.4"/><rect x="14" y="4" width="6" height="6" rx="2" fill="currentColor" /><rect x="4" y="14" width="6" height="6" rx="2" fill="currentColor" /><rect x="14" y="14" width="6" height="6" rx="2" fill="currentColor" opacity="0.4"/></> : <><rect x="4" y="4" width="6" height="6" rx="2" /><rect x="14" y="4" width="6" height="6" rx="2" /><rect x="4" y="14" width="6" height="6" rx="2" /><rect x="14" y="14" width="6" height="6" rx="2" /></>}</svg>);
const HomeIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><rect x="3" y="3" width="7.5" height="7.5" rx="2.75" fill="currentColor" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2.75" fill="currentColor" opacity="0.3" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.75" fill="currentColor" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2.75" fill="currentColor" opacity="0.3" /></> : <><rect x="3" y="3" width="7.5" height="7.5" rx="2.25" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2.25" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.25" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2.25" /></>}</svg>);
const BillsIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><path d="M4 2v20l3-3 3 3 3-3 3 3 3-3V2a2 2 0 0 0-2-2h12a2 2 0 0 0 2 2z" fill="currentColor" opacity="0.3" /><rect x="8" y="7.25" width="8" height="2.5" rx="1.25" fill="currentColor" /><rect x="8" y="12.75" width="5" height="2.5" rx="1.25" fill="currentColor" /></> : <><path d="M4 2v20l3-3 3 3 3-3 3 3 3-3V2a2 2 0 0 0-2-2h12a2 2 0 0 0 2 2z" /><line x1="8" y1="8.5" x2="16" y2="8.5" /><line x1="8" y1="14" x2="13" y2="14" /></>}</svg>);
const UtangIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><circle cx="6" cy="7" r="3" fill="currentColor" opacity="0.3" /><circle cx="18" cy="7" r="3" fill="currentColor" opacity="0.3" /><path d="M2 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" fill="currentColor" opacity="0.3" /><path d="M14 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" fill="currentColor" opacity="0.3" /><circle cx="12" cy="13" r="4" fill="currentColor" /><path d="M12 11.2v3.6M10.7 12.3h2.6M10.7 13.8h2.6" stroke="#fff" strokeWidth="1" /></> : <><circle cx="6" cy="7" r="3" /><circle cx="18" cy="7" r="3" /><path d="M2 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" /><path d="M14 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" /><circle cx="12" cy="13" r="3.2" /></>}</svg>);
const BudgetIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><rect x="4" y="2" width="16" height="20" rx="4" fill="currentColor" opacity="0.3" /><rect x="7" y="5" width="10" height="4.5" rx="1.25" fill="currentColor" /><rect x="7" y="12" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" /><rect x="10.4" y="12" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" /><rect x="13.8" y="12" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" /><rect x="7" y="15.6" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" /><rect x="10.4" y="15.6" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" /><rect x="13.8" y="15.6" width="3.2" height="3.2" rx="1" fill="currentColor" /></> : <><rect x="4" y="2" width="16" height="20" rx="4" /><rect x="7" y="5.25" width="10" height="4" rx="1" /><rect x="7.4" y="12" width="2.6" height="2.6" rx="0.7" /><rect x="10.7" y="12" width="2.6" height="2.6" rx="0.7" /><rect x="14" y="12" width="2.6" height="2.6" rx="0.7" /><rect x="7.4" y="15.4" width="2.6" height="2.6" rx="0.7" /><rect x="10.7" y="15.4" width="2.6" height="2.6" rx="0.7" /><rect x="14" y="15.4" width="2.6" height="2.6" rx="0.7" /></>}</svg>);
const AnalyticsIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><path d="M21.21 15.89A10 10 0 1 1 8 2.83V12h13.21z" fill="currentColor" opacity="0.3" /><path d="M22 12A10 10 0 0 0 12 2v10h10z" fill="currentColor" /></> : <><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>}</svg>);
const HistoryIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><circle cx="12" cy="13" r="8.5" fill="currentColor" opacity="0.3" /><path d="M4.2 8.5A8.5 8.5 0 1 1 3.5 13" stroke="currentColor" strokeWidth="1.9" fill="none" /><path d="M4.2 4.5v4h4" stroke="currentColor" strokeWidth="1.9" fill="none" /><path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.9" fill="none" /></> : <><path d="M4.2 8.5A8.5 8.5 0 1 1 3.5 13" /><path d="M4.2 4.5v4h4" /><path d="M12 9v4l3 2" /></>}</svg>);
const AccountIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><circle cx="12" cy="7.5" r="4.5" fill="currentColor" /><path d="M20 21v-1.5a5.5 5.5 0 0 0-5.5-5.5h-5A5.5 5.5 0 0 0 4 19.5V21" fill="currentColor" opacity="0.3" /></> : <><path d="M20 21v-1.5a5.5 5.5 0 0 0-5.5-5.5h-5A5.5 5.5 0 0 0 4 19.5V21" /><circle cx="12" cy="7.5" r="4.5" /></>}</svg>);
const CartIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="currentColor" opacity="0.3" /><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="1.75" /><path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="1.75" /></> : <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>}</svg>);
const InstallmentIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><rect x="2" y="5" width="20" height="14" rx="2" fill="currentColor" opacity="0.3" /><line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2" /><circle cx="16" cy="15" r="4" fill="currentColor" /><path d="M16 13.5v1.5l1 1" stroke="#fff" strokeWidth="1.2" /></> : <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /><circle cx="16" cy="15" r="4" fill="currentColor" opacity="0.1" /><path d="M16 13.5v1.5l1 1" /><circle cx="16" cy="15" r="4" /></>}</svg>);
const ScanIcon = ({ active, size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">{active ? <><path d="M3 7V5a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="2" /><rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" opacity="0.3" /><line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" /></> : <><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></>}</svg>);
const LogOutIcon = ({ size = 24 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
