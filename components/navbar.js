// components/navbar.js
// Presentational shell only — no API calls or data-contract changes here.
// Props: user (Firebase user: displayName, email), onLogout (fn), activeTab (id matching `tabs` below)

const TIPID_NAV_KEY = "tipid:navFrom";
const TIPID_TRANSITION_MS = 220;

window.Navbar = function Navbar({ user, onLogout, activeTab = "home" }) {
    const userName = user?.displayName ? user.displayName.split(" ")[0] : user?.email?.split("@")[0] || "User";
    const initial = userName.charAt(0).toUpperCase();

    const [currentLang, setCurrentLang] = React.useState(() => {
        return window.TipidI18n ? window.TipidI18n.getLanguage(user?.uid) : "en";
    });

    React.useEffect(() => {
        const handler = (e) => {
            const nextLang = e.detail?.lang || (window.TipidI18n ? window.TipidI18n.getLanguage(user?.uid) : "en");
            setCurrentLang(nextLang);
        };
        window.addEventListener("tipid-language-change", handler);
        return () => window.removeEventListener("tipid-language-change", handler);
    }, [user?.uid]);

    const isTl = currentLang === "tl";

    const tabs = React.useMemo(() => [
        { id: "home", href: "dashboard.html", label: isTl ? "Tahanan" : "Home", icon: HomeIcon, group: "main" },
        { id: "bills", href: "bills.html", label: isTl ? "Mga Bayarin" : "Bills", icon: BillsIcon, group: "main" },
        { id: "utang", href: "utang.html", label: isTl ? "Utang" : "Debts", icon: UtangIcon, group: "main" },
        { id: "grocery", href: "grocery.html", label: isTl ? "Pamilihan" : "Groceries", icon: CartIcon, group: "main" },
        { id: "scanner", href: "scanner.html", label: isTl ? "Resibo" : "Receipts", icon: ScanIcon, group: "main" },
        { id: "budget", href: "allowance.html", label: isTl ? "Badyet" : "Budget", icon: BudgetIcon, group: "finance" },
        { id: "analytics", href: "chart.html", label: isTl ? "Pagsusuri" : "Analytics", icon: AnalyticsIcon, group: "finance" },
        { id: "history", href: "history.html", label: isTl ? "Kasaysayan" : "History", icon: HistoryIcon, group: "finance" },
        { id: "installments", href: "installments.html", label: isTl ? "Hulugan" : "Installments", icon: InstallmentIcon, group: "finance" },
        { id: "account", href: "profile.html", label: isTl ? "Account" : "Account", icon: AccountIcon, group: "account" },
    ], [isTl]);

    // Mobile Partition: 4 main tabs, 6 "more" tabs
    const mainMobileTabs = tabs.slice(0, 4);
    const moreMobileTabs = tabs.slice(4);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [reducedMotion, setReducedMotion] = React.useState(false);

    const [isDark, setIsDark] = React.useState(() => {
        try {
            return localStorage.getItem("tipid_theme") === "dark" ||
                (!localStorage.getItem("tipid_theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
        } catch (_) {
            return false;
        }
    });

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

    // Apply sidebar body class on desktop
    React.useEffect(() => {
        document.body.classList.add("has-tipid-sidebar");
        return () => {
            document.body.classList.remove("has-tipid-sidebar");
        };
    }, []);

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
    }, [activeTab, reducedMotion]);

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

    const toggleTheme = () => {
        const nextDark = !isDark;
        setIsDark(nextDark);
        try {
            if (nextDark) {
                document.documentElement.classList.add("dark");
                localStorage.setItem("tipid_theme", "dark");
            } else {
                document.documentElement.classList.remove("dark");
                localStorage.setItem("tipid_theme", "light");
            }
        } catch (_) { }
    };

    const isTabActive = (tab) => {
        if (displayActiveTab === tab.id) return true;
        if (tab.id === "budget" && displayActiveTab === "allowance") return true;
        if (tab.id === "scanner" && (displayActiveTab === "scanner" || displayActiveTab === "more")) return true;
        try {
            const currentFile = window.location.pathname.split("/").pop() || "dashboard.html";
            if (currentFile === tab.href) return true;
        } catch (_) { }
        return false;
    };

    React.useEffect(() => {
        if (isMobileMenuOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
        return () => { document.body.style.overflow = "auto"; };
    }, [isMobileMenuOpen]);

    React.useEffect(() => {
        if (!isMobileMenuOpen) return;
        const onKey = (e) => { if (e.key === "Escape") setIsMobileMenuOpen(false); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isMobileMenuOpen]);

    const mainGroupTabs = tabs.filter(t => t.group === "main");
    const financeGroupTabs = tabs.filter(t => t.group === "finance");
    const accountGroupTabs = tabs.filter(t => t.group === "account");

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
                @media (min-width: 768px) {
                    body.has-tipid-sidebar {
                        padding-left: 260px !important;
                        box-sizing: border-box !important;
                    }
                }
                .tipid-desktop-sidebar {
                    background-color: rgba(255, 255, 255, 0.9) !important;
                    backdrop-filter: blur(28px) saturate(180%) !important;
                    -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
                    border-right: 1px solid rgba(220, 228, 221, 0.7) !important;
                    box-shadow: 4px 0 24px -8px rgba(0, 0, 0, 0.04) !important;
                }
                html.dark .tipid-desktop-sidebar,
                .dark .tipid-desktop-sidebar {
                    background-color: rgba(14, 23, 18, 0.96) !important;
                    backdrop-filter: blur(28px) saturate(180%) !important;
                    -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
                    border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 4px 0 32px -8px rgba(0, 0, 0, 0.5) !important;
                }
                .tipid-mobile-header,
                .tipid-bottom-nav {
                    background-color: rgba(255, 255, 255, 0.92) !important;
                    backdrop-filter: blur(28px) saturate(180%) !important;
                    -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
                }
                html.dark .tipid-mobile-header,
                .dark .tipid-mobile-header,
                html.dark .tipid-bottom-nav,
                .dark .tipid-bottom-nav {
                    background-color: rgba(14, 23, 18, 0.96) !important;
                    backdrop-filter: blur(28px) saturate(180%) !important;
                    -webkit-backdrop-filter: blur(28px) saturate(180%) !important;
                }
            `}</style>

            <div
                aria-hidden="true"
                className={`fixed inset-0 z-[70] bg-paper dark:bg-ink2 transition-opacity ease-out ${reducedMotion ? "duration-0" : "duration-[220ms]"} ${overlayVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            />

            {/* ---------- Desktop Apple HIG Sidebar ---------- */}
            <aside
                className="hidden md:flex flex-col fixed inset-y-0 left-0 w-[260px] z-40 select-none tipid-desktop-sidebar"
                aria-label="Sidebar Navigation"
            >
                {/* Brand Header */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-line/40 dark:border-white/5 shrink-0">
                    <a
                        href="dashboard.html"
                        onClick={(e) => handleNavigate(e, "dashboard.html")}
                        className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-xl"
                    >
                        <div className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2">
                            <window.Logo size={30} />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="font-display font-bold text-lg tracking-tight text-ink dark:text-paper">Tipid</span>
                            <span className="text-[10px] font-semibold text-peso dark:text-pesoLight uppercase tracking-wider mt-0.5">Tracker</span>
                        </div>
                    </a>
                </div>

                {/* Scrollable Navigation Groups */}
                <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 hide-scroll-nav">
                    <div>
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink2/50 dark:text-paper/45 px-3 pb-2">
                            Menu
                        </div>
                        <div className="space-y-1">
                            {mainGroupTabs.map((tab) => (
                                <SidebarNavLink
                                    key={tab.id}
                                    href={tab.href}
                                    label={tab.label}
                                    active={isTabActive(tab)}
                                    onClick={(e) => handleNavigate(e, tab.href)}
                                    icon={<tab.icon size={18} />}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink2/50 dark:text-paper/45 px-3 pb-2">
                            {isTl ? "Pagpaplano" : "Planning"}
                        </div>
                        <div className="space-y-1">
                            {financeGroupTabs.map((tab) => (
                                <SidebarNavLink
                                    key={tab.id}
                                    href={tab.href}
                                    label={tab.label}
                                    active={isTabActive(tab)}
                                    onClick={(e) => handleNavigate(e, tab.href)}
                                    icon={<tab.icon size={18} />}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink2/50 dark:text-paper/45 px-3 pb-2">
                            {isTl ? "Mga Setting" : "Settings"}
                        </div>
                        <div className="space-y-1">
                            {accountGroupTabs.map((tab) => (
                                <SidebarNavLink
                                    key={tab.id}
                                    href={tab.href}
                                    label={tab.label}
                                    active={isTabActive(tab)}
                                    onClick={(e) => handleNavigate(e, tab.href)}
                                    icon={<tab.icon size={18} />}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer / User section */}
                <div className="p-3 border-t border-line/50 dark:border-white/10 shrink-0 space-y-2.5 bg-paper/30 dark:bg-black/30">
                    {/* Theme Quick Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-ink2/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper hover:bg-black/[0.04] dark:hover:bg-white/[0.07] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40"
                        aria-label="Toggle theme mode"
                    >
                        <span className="flex items-center gap-2.5">
                            {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
                            <span>{isDark ? (isTl ? "Maliwanag na Mode" : "Light Mode") : (isTl ? "Madilim na Mode" : "Dark Mode")}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 uppercase tracking-wider font-bold text-ink2/60 dark:text-paper/60">
                            {isDark ? (isTl ? "Madilim" : "Dark") : (isTl ? "Maliwanag" : "Light")}
                        </span>
                    </button>

                    {/* User Card & Logout */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-white/[0.05] border border-line/60 dark:border-white/10 shadow-sm">
                        <a
                            href="profile.html"
                            onClick={(e) => handleNavigate(e, "profile.html")}
                            className="flex items-center gap-2.5 min-w-0 flex-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-xl"
                            title="View Profile"
                        >
                            <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/20 to-pesoLight/10 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-xs shadow-inner overflow-hidden relative select-none">
                                    <span>{initial}</span>
                                    {user && user.photoURL && (
                                        <img
                                            src={user.photoURL}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            crossOrigin="anonymous"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-ink dark:text-paper truncate group-hover:text-peso dark:group-hover:text-pesoLight transition-colors">{userName}</span>
                                <span className="text-[10px] text-ink2/50 dark:text-paper/50 truncate">{isTl ? "Profile at Setting" : "Account"}</span>
                            </div>
                        </a>

                        <button
                            onClick={onLogout}
                            aria-label="Log out"
                            title="Log out"
                            className="p-1.5 text-ink2/40 dark:text-paper/50 hover:text-expense hover:bg-expense/10 active:scale-95 transition-all rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 shrink-0"
                        >
                            <LogOutIcon size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ---------- Mobile header ---------- */}
            <header
                className={`md:hidden tipid-mobile-header px-5 flex justify-between items-center fixed top-0 w-full z-50 border-b transition-[padding,box-shadow,border-color] duration-500 ${isScrolled ? "pb-2.5 border-line/50 dark:border-white/15 shadow-[0_6px_28px_-14px_rgba(0,0,0,0.14)]" : "pb-3.5 border-line/30 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]"}`}
                style={{ paddingTop: isScrolled ? 'max(0.75rem, calc(env(safe-area-inset-top) + 0.5rem))' : 'max(1rem, calc(env(safe-area-inset-top) + 0.65rem))' }}
            >
                <a href="profile.html" onClick={(e) => handleNavigate(e, "profile.html")} className="flex items-center gap-3.5 min-w-0 active:scale-95 transition-transform rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40">
                    <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/20 to-pesoLight/10 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-base shadow-inner overflow-hidden relative select-none">
                            <span>{initial}</span>
                            {user && user.photoURL && (
                                <img
                                    src={user.photoURL}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-ink dark:text-paper text-[15px] truncate tracking-tight">{isTl ? `Kumusta, ${userName}!` : `Hello, ${userName}!`}</span>
                        <span className="text-[10px] font-medium text-peso dark:text-pesoLight uppercase tracking-wider">{isTl ? "Tingnan ang Profile" : "View Profile"}</span>
                    </div>
                </a>
                <button onClick={onLogout} aria-label="Log out" className="text-ink2/40 dark:text-paper/40 hover:text-expense hover:bg-expense/10 rounded-full p-2 active:scale-90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 shrink-0">
                    <LogOutIcon size={20} />
                </button>
            </header>

            {/* ---------- MINIMAL, REALISTIC BOTTOM TAB BAR (reference-matched) ---------- */}
            <nav
                className="md:hidden fixed left-0 right-0 bottom-0 z-40 tipid-bottom-nav border-t border-line/70 dark:border-white/10"
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
                        label={isTl ? "Iba pa" : "More"}
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
                    aria-label="More Menu"
                    className={`absolute bottom-0 left-0 right-0 bg-paper dark:bg-ink2 rounded-t-[2rem] px-6 pt-4 shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.34,1.1,0.64,1)] ${isMobileMenuOpen ? "translate-y-0" : "translate-y-full"}`}
                    style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 2rem))' }}
                >
                    <div className="w-12 h-1.5 bg-line dark:bg-white/20 rounded-full mx-auto mb-6" />
                    <h3 className="font-display text-[1.35rem] font-semibold mb-5 text-ink dark:text-paper px-1 tracking-tight">{isTl ? "Iba pang Pahina" : "More Features"}</h3>
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

const SidebarNavLink = ({ href, label, active, icon, onClick }) => (
    <a
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        title={label}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 ${
            active
                ? "bg-peso text-white font-semibold shadow-[0_4px_14px_-2px_rgba(31,111,84,0.35)] dark:bg-pesoLight dark:text-white"
                : "text-ink2/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper hover:bg-black/[0.04] dark:hover:bg-white/[0.07] active:scale-[0.98]"
        }`}
    >
        <span className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? "text-white" : "text-ink2/60 dark:text-paper/60"}`}>
            {icon}
        </span>
        <span className="truncate flex-1 tracking-tight">{label}</span>
        {active && (
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 shrink-0" />
        )}
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

/* --- CLEAN, UNIFORM LINE ICONS --- */
const HomeIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5l9-7 9 7v10.5a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>
);
const BillsIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 14h-8"/><path d="M16 10h-8"/></svg>
);
const UtangIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const CartIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const MenuIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
);
const ScanIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>);
const BudgetIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>);
const AnalyticsIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>);
const HistoryIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const InstallmentIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const AccountIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const LogOutIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>);
const SunIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);
const MoonIcon = ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);
