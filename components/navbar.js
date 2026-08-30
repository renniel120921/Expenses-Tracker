// components/navbar.js

window.Navbar = function Navbar({ user, onLogout, activeTab = "home" }) {
    const userName = user?.displayName ? user.displayName.split(" ")[0] : user?.email?.split("@")[0] || "User";
    const initial = userName.charAt(0).toUpperCase();

    // Renamed tabs and updated href links
    const tabs = [
        { id: "home", href: "dashboard.html", label: "Home", icon: HomeIcon },
        { id: "bills", href: "bills.html", label: "Bills", icon: BillsIcon },
        { id: "utang", href: "utang.html", label: "Utang", icon: UtangIcon },
        { id: "budget", href: "allowance.html", label: "Budget", icon: BudgetIcon },
        { id: "analytics", href: "chart.html", label: "Analytics", icon: AnalyticsIcon },
        { id: "history", href: "history.html", label: "History", icon: HistoryIcon },
        { id: "account", href: "profile.html", label: "Account", icon: AccountIcon },
    ];

    // --- Desktop: Exact bounding box calculation for flawless gliding ---
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

                // Prevent unnecessary state updates if dimensions haven't changed
                if (prev.left === newLeft && prev.top === newTop && prev.width === elRect.width && prev.height === elRect.height && !prev.isInitial) {
                    return prev;
                }
                return {
                    left: newLeft,
                    top: newTop,
                    width: elRect.width,
                    height: elRect.height,
                    opacity: 1,
                    isInitial: false
                };
            });
        }
    }, [activeTab]);

    React.useLayoutEffect(() => {
        measurePill();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(measurePill);
        }
        window.addEventListener("resize", measurePill);
        return () => window.removeEventListener("resize", measurePill);
    }, [measurePill]);

    // FIX (desktop "crash"): window resize only fires when the *viewport* changes.
    // It does NOT fire when the tab row itself reflows (font swap, label wrap,
    // content pushing the row wider/narrower). That stale measurement is what
    // threw the pill out of alignment / made the nav look broken. A
    // ResizeObserver on the actual pill container catches every one of those
    // cases, not just viewport resizes.
    React.useEffect(() => {
        const container = navContainerRef.current;
        if (!container || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => measurePill());
        ro.observe(container);
        return () => ro.disconnect();
    }, [measurePill]);

    // FIX (mobile pop-in only on Bills): the floating bubble used to carry
    // `transition-all` from the very first paint. If a page's `active` prop
    // resolves a frame after mount, that transition animates the bubble
    // popping in — purely a timing accident, not something tied to "Bills"
    // specifically. Every tab is equally exposed to it. Suppressing
    // transitions until after first mount (same guard the desktop pill
    // already uses) makes every tab behave identically: instant on load,
    // smooth only on an actual in-app tab change.
    const [mobileMounted, setMobileMounted] = React.useState(false);
    React.useEffect(() => {
        const id = requestAnimationFrame(() => setMobileMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    return (
        <React.Fragment>
            {/* --- Desktop Navigation --- */}
            <nav className="hidden md:flex justify-center bg-white/75 dark:bg-ink2/75 backdrop-blur-2xl text-ink dark:text-paper w-full sticky top-0 z-50 border-b border-line/40 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.06)]">
                <div className="w-full max-w-6xl px-4 md:px-5 lg:px-6 py-3.5 lg:py-4 flex items-center gap-3 lg:gap-6">

                    <div className="flex-none flex justify-start">
                        <a href="dashboard.html" className="flex items-center gap-2.5 lg:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-xl">
                            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1">
                                <window.Logo size={28} />
                            </div>
                            <span className="hidden lg:inline font-display font-semibold text-xl tracking-tight">Tipid</span>
                        </a>
                    </div>

                    {/* FIX: min-w-0 + overflow-x-auto is the safety net — if the row
                        ever runs out of room again (extra-narrow window, longer
                        translated labels, etc.) it scrolls instead of wrapping and
                        breaking the pill's absolute positioning. */}
                    <div
                        ref={navContainerRef}
                        className="relative flex flex-nowrap items-center gap-1 lg:gap-2 min-w-0 flex-1 justify-center overflow-x-auto no-scrollbar bg-paperDim/60 dark:bg-white/[0.04] p-1.5 rounded-full border border-line/50 dark:border-white/5 shadow-inner"
                    >
                        <div
                            className="absolute rounded-full bg-white dark:bg-ink2 ring-1 ring-black/[0.04] dark:ring-white/10 shadow-md pointer-events-none"
                            style={{
                                left: pillStyle.left,
                                top: pillStyle.top,
                                width: pillStyle.width,
                                height: pillStyle.height,
                                opacity: pillStyle.opacity,
                                transition: pillStyle.isInitial
                                    ? "none"
                                    : "all 0.5s cubic-bezier(0.34, 1.2, 0.4, 1)",
                            }}
                        />
                        {tabs.map((tab) => (
                            <DesktopNavLink
                                key={tab.id}
                                innerRef={(el) => (linkRefs.current[tab.id] = el)}
                                href={tab.href}
                                label={tab.label}
                                active={activeTab === tab.id}
                                icon={<tab.icon active={activeTab === tab.id} size={16} />}
                            />
                        ))}
                    </div>

                    <div className="flex-none flex items-center justify-end gap-3 lg:gap-6 min-w-0">
                        <div className="flex items-center gap-2.5 lg:gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/15 to-pesoLight/5 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-sm">
                                    {initial}
                                </div>
                            </div>
                            <span className="hidden xl:block text-sm font-semibold text-ink2 dark:text-paper/80 truncate max-w-[120px]">
                                {userName}
                            </span>
                        </div>
                        <button
                            onClick={onLogout}
                            aria-label="Log out"
                            className="flex items-center gap-1.5 text-sm font-semibold text-ink2/50 dark:text-paper/45 hover:text-expense hover:bg-expense/10 active:scale-95 transition-all duration-300 shrink-0 pl-3 pr-3.5 py-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40"
                        >
                            <LogOutIcon size={15} />
                            <span className="hidden lg:inline">Logout</span>
                        </button>
                    </div>

                </div>
            </nav>

            {/* --- Mobile Top Header --- */}
            <header
                className="md:hidden bg-white/85 dark:bg-ink2/85 backdrop-blur-2xl px-5 pb-3.5 flex justify-between items-center fixed top-0 w-full z-50 border-b border-line/30 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)]"
                style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top) + 0.65rem))' }}
            >
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/20 to-pesoLight/5 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-base">
                            {initial}
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-ink dark:text-paper text-[15px] truncate tracking-tight">Hello, {userName}!</span>
                        <span className="text-[10px] font-medium text-peso dark:text-pesoLight uppercase tracking-wider">Ready to save?</span>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    aria-label="Log out"
                    className="text-ink2/40 dark:text-paper/40 hover:text-expense hover:bg-expense/10 rounded-full p-2 active:scale-90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 shrink-0"
                >
                    <LogOutIcon size={20} />
                </button>
            </header>

            {/* --- Mobile Bottom Navigation (Modern Floating Style) --- */}
            <nav
                className="md:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-[400px]"
                style={{ bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
            >
                <div className="relative h-[4.25rem] bg-white/90 dark:bg-ink2/90 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[1.75rem] flex items-center justify-between px-1.5 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <BottomNavBtn
                            key={tab.id}
                            href={tab.href}
                            label={tab.label}
                            active={activeTab === tab.id}
                            allowTransition={mobileMounted}
                            icon={<tab.icon active={activeTab === tab.id} size={activeTab === tab.id ? 22 : 24} />}
                        />
                    ))}
                </div>
            </nav>
        </React.Fragment>
    );
};

const DesktopNavLink = ({ href, label, active, icon, innerRef }) => (
    <a
        ref={innerRef}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`relative z-10 flex items-center gap-2 text-sm whitespace-nowrap shrink-0 transition-all duration-300 px-3 lg:px-4 py-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 ${active ? 'font-bold text-peso dark:text-pesoLight' : 'font-medium text-ink2/50 dark:text-paper/40 hover:text-ink dark:hover:text-paper'}`}
    >
        {icon}
        <span className="hidden lg:inline">{label}</span>
    </a>
);

const BottomNavBtn = ({ href, icon, label, active, allowTransition }) => (
    <a
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className="relative flex-1 flex flex-col items-center justify-center h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-2xl active:scale-90 transition-transform duration-200 min-w-[3.2rem]"
    >
        <div
            className={`absolute flex items-center justify-center ${allowTransition ? "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]" : ""} ${
                active
                    ? "-top-[1.1rem] w-[3.15rem] h-[3.15rem] bg-[#A0D44A] rounded-full shadow-[0_8px_16px_-4px_rgba(160,212,74,0.6)] text-[#111A15]"
                    : "top-[14px] w-7 h-7 bg-transparent text-ink2/40 dark:text-paper/40"
            }`}
        >
            {icon}
        </div>
        <span
            className={`absolute bottom-1.5 text-[9.5px] font-semibold tracking-tight ${allowTransition ? "transition-all duration-300" : ""} ${
                active
                    ? "opacity-0 translate-y-3 pointer-events-none"
                    : "opacity-100 translate-y-0 text-ink2/50 dark:text-paper/50"
            }`}
        >
            {label}
        </span>
    </a>
);

/* ========================================================================
   MODERN APP ICONS
======================================================================== */

const HomeIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {active ? (
            <>
                <rect x="3" y="3" width="7.5" height="7.5" rx="2.75" fill="currentColor" />
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.75" fill="currentColor" opacity="0.3" />
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.75" fill="currentColor" />
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.75" fill="currentColor" opacity="0.3" />
            </>
        ) : (
            <>
                <rect x="3" y="3" width="7.5" height="7.5" rx="2.25" />
                <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.25" />
                <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.25" />
                <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.25" />
            </>
        )}
    </svg>
);

const BillsIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {active ? (
            <>
                <path d="M4 2v20l3-3 3 3 3-3 3 3 3-3V2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" fill="currentColor" opacity="0.3" />
                <rect x="8" y="7.25" width="8" height="2.5" rx="1.25" fill="currentColor" />
                <rect x="8" y="12.75" width="5" height="2.5" rx="1.25" fill="currentColor" />
            </>
        ) : (
            <>
                <path d="M4 2v20l3-3 3 3 3-3 3 3 3-3V2a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
                <line x1="8" y1="8.5" x2="16" y2="8.5" />
                <line x1="8" y1="14" x2="13" y2="14" />
            </>
        )}
    </svg>
);

// Utang tab: two people + a coin passing between them — reads clearly at nav size
// and doesn't reuse any existing tab's silhouette.
const UtangIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {active ? (
            <>
                <circle cx="6" cy="7" r="3" fill="currentColor" opacity="0.3" />
                <circle cx="18" cy="7" r="3" fill="currentColor" opacity="0.3" />
                <path d="M2 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" fill="currentColor" opacity="0.3" />
                <path d="M14 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" fill="currentColor" opacity="0.3" />
                <circle cx="12" cy="13" r="4" fill="currentColor" />
                <path d="M12 11.2v3.6M10.7 12.3h2.6M10.7 13.8h2.6" stroke="#fff" strokeWidth="1" />
            </>
        ) : (
            <>
                <circle cx="6" cy="7" r="3" />
                <circle cx="18" cy="7" r="3" />
                <path d="M2 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" />
                <path d="M14 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1" />
                <circle cx="12" cy="13" r="3.2" />
            </>
        )}
    </svg>
);

const BudgetIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {active ? (
            <>
                <rect x="4" y="2" width="16" height="20" rx="4" fill="currentColor" opacity="0.3" />
                <rect x="7" y="5" width="10" height="4.5" rx="1.25" fill="currentColor" />
                <rect x="7" y="12" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" />
                <rect x="10.4" y="12" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" />
                <rect x="13.8" y="12" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" />
                <rect x="7" y="15.6" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" />
                <rect x="10.4" y="15.6" width="3.2" height="3.2" rx="1" fill="currentColor" opacity="0.55" />
                <rect x="13.8" y="15.6" width="3.2" height="3.2" rx="1" fill="currentColor" />
            </>
        ) : (
            <>
                <rect x="4" y="2" width="16" height="20" rx="4" />
                <rect x="7" y="5.25" width="10" height="4" rx="1" />
                <rect x="7.4" y="12" width="2.6" height="2.6" rx="0.7" />
                <rect x="10.7" y="12" width="2.6" height="2.6" rx="0.7" />
                <rect x="14" y="12" width="2.6" height="2.6" rx="0.7" />
                <rect x="7.4" y="15.4" width="2.6" height="2.6" rx="0.7" />
                <rect x="10.7" y="15.4" width="2.6" height="2.6" rx="0.7" />
                <rect x="14" y="15.4" width="2.6" height="2.6" rx="0.7" />
            </>
        )}
    </svg>
);

const AnalyticsIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {active ? (
            <>
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83V12h13.21z" fill="currentColor" opacity="0.3" />
                <path d="M22 12A10 10 0 0 0 12 2v10h10z" fill="currentColor" />
            </>
        ) : (
            <>
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </>
        )}
    </svg>
);

const HistoryIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {active ? (
            <>
                <circle cx="12" cy="13" r="8.5" fill="currentColor" opacity="0.3" />
                <path d="M4.2 8.5A8.5 8.5 0 1 1 3.5 13" stroke="currentColor" strokeWidth="1.9" fill="none" />
                <path d="M4.2 4.5v4h4" stroke="currentColor" strokeWidth="1.9" fill="none" />
                <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="1.9" fill="none" />
            </>
        ) : (
            <>
                <path d="M4.2 8.5A8.5 8.5 0 1 1 3.5 13" />
                <path d="M4.2 4.5v4h4" />
                <path d="M12 9v4l3 2" />
            </>
        )}
    </svg>
);

const AccountIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {active ? (
            <>
                <circle cx="12" cy="7.5" r="4.5" fill="currentColor" />
                <path d="M20 21v-1.5a5.5 5.5 0 0 0-5.5-5.5h-5A5.5 5.5 0 0 0 4 19.5V21" fill="currentColor" opacity="0.3" />
            </>
        ) : (
            <>
                <path d="M20 21v-1.5a5.5 5.5 0 0 0-5.5-5.5h-5A5.5 5.5 0 0 0 4 19.5V21" />
                <circle cx="12" cy="7.5" r="4.5" />
            </>
        )}
    </svg>
);

const LogOutIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
