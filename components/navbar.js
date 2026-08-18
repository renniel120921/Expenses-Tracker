// components/navbar.js

window.Navbar = function Navbar({ user, onLogout, activeTab = "dashboard" }) {
    const userName = user?.displayName ? user.displayName.split(" ")[0] : user?.email?.split("@")[0] || "User";
    const initial = userName.charAt(0).toUpperCase();

    const tabs = [
        { id: "dashboard", href: "dashboard.html", label: "Dashboard", icon: DashboardIcon },
        { id: "bills", href: "bills.html", label: "Bills", icon: BillsIcon },
        { id: "allowance", href: "allowance.html", label: "Calculator", icon: CalcIcon },
        { id: "chart", href: "chart.html", label: "Chart", icon: ChartIcon },
        { id: "history", href: "history.html", label: "History", icon: HistoryIcon },
        { id: "profile", href: "profile.html", label: "Profile", icon: ProfileIcon },
    ];

    // --- Desktop: measure the active link so the pill can glide to it ---
    const linkRefs = React.useRef({});
    const [pillStyle, setPillStyle] = React.useState({ left: 0, width: 0, opacity: 0, isInitial: true });

    const measurePill = React.useCallback(() => {
        const el = linkRefs.current[activeTab];
        if (el) {
            setPillStyle(prev => ({
                left: el.offsetLeft,
                width: el.offsetWidth,
                opacity: 1,
                isInitial: false
            }));
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

    // --- Mobile: measure the active tab's X position to cut a real notch ---
    const mobileBarRef = React.useRef(null);
    const mobileIconRefs = React.useRef({});
    const [notchX, setNotchX] = React.useState(null);

    const measureNotch = React.useCallback(() => {
        const barEl = mobileBarRef.current;
        const iconEl = mobileIconRefs.current[activeTab];
        if (barEl && iconEl) {
            const barRect = barEl.getBoundingClientRect();
            const iconRect = iconEl.getBoundingClientRect();
            setNotchX(iconRect.left + iconRect.width / 2 - barRect.left);
        }
    }, [activeTab]);

    React.useLayoutEffect(() => {
        measureNotch();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(measureNotch);
        }
        window.addEventListener("resize", measureNotch);
        return () => window.removeEventListener("resize", measureNotch);
    }, [measureNotch]);

    // --- Mobile: retrigger the icon "sink" every time the active tab changes ---
    const [bounceKey, setBounceKey] = React.useState(0);
    React.useEffect(() => {
        setBounceKey((k) => k + 1);
    }, [activeTab]);

    return (
        <React.Fragment>
            <style>{`
                @keyframes navIconSink {
                    0%   { transform: translateY(-2rem) scale(0.6); opacity: 0; }
                    50%  { transform: translateY(-0.3rem) scale(1.1); opacity: 1; }
                    75%  { transform: translateY(-0.7rem) scale(0.95); }
                    100% { transform: translateY(-0.55rem) scale(1); }
                }
                .nav-icon-sink { animation: navIconSink 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

                .nav-bar-notched {
                    -webkit-mask-image: radial-gradient(circle 38px at var(--notch-x, -9999px) -2px, transparent 0 94%, black 100%);
                    mask-image: radial-gradient(circle 38px at var(--notch-x, -9999px) -2px, transparent 0 94%, black 100%);
                    -webkit-mask-repeat: no-repeat;
                    mask-repeat: no-repeat;
                }

                @keyframes navHaloPulse {
                    0%   { transform: translateY(-0.55rem) scale(0.85); opacity: 0.45; }
                    70%  { opacity: 0; }
                    100% { transform: translateY(-0.55rem) scale(1.45); opacity: 0; }
                }
                .nav-halo-pulse { animation: navHaloPulse 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite; }

                @media (prefers-reduced-motion: reduce) {
                    .nav-icon-sink, .nav-halo-pulse { animation: none !important; }
                }
            `}</style>

            {/* --- Desktop Navigation --- */}
            <nav className="hidden md:flex justify-center bg-white/75 dark:bg-ink2/75 backdrop-blur-2xl text-ink dark:text-paper w-full sticky top-0 z-50 border-b border-line/40 dark:border-white/10 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.06)]">
                <div className="w-full max-w-6xl px-6 py-4 flex justify-between items-center">

                    <div className="flex-1 flex justify-start">
                        <a href="dashboard.html" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 rounded-xl">
                            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-1">
                                <window.Logo size={28} />
                            </div>
                            <span className="font-display font-semibold text-xl tracking-tight">Tipid</span>
                        </a>
                    </div>

                    <div className="relative flex items-center gap-1.5 lg:gap-2.5 shrink-0 bg-paperDim/60 dark:bg-white/[0.04] p-1.5 rounded-full border border-line/50 dark:border-white/5 shadow-inner">
                        <div
                            className="absolute top-1/2 h-10 rounded-full bg-white dark:bg-ink2 ring-1 ring-black/[0.04] dark:ring-white/10 shadow-md pointer-events-none"
                            style={{
                                left: pillStyle.left,
                                width: pillStyle.width,
                                opacity: pillStyle.opacity,
                                transform: "translateY(-50%)",
                                transition: pillStyle.isInitial
                                    ? "none"
                                    : "left 0.5s cubic-bezier(0.34, 1.2, 0.4, 1), width 0.5s cubic-bezier(0.34, 1.2, 0.4, 1), opacity 0.3s ease",
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

                    <div className="flex-1 flex items-center justify-end gap-4 lg:gap-6">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-br from-peso/50 via-peso/15 to-transparent dark:from-pesoLight/40 dark:via-white/10 shrink-0">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-peso/15 to-pesoLight/5 dark:from-white/15 dark:to-white/5 flex items-center justify-center text-peso dark:text-paper font-bold text-sm">
                                    {initial}
                                </div>
                            </div>
                            <span className="hidden lg:block text-sm font-semibold text-ink2 dark:text-paper/80 truncate max-w-[120px]">
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

            {/* --- Mobile Bottom Navigation --- */}
            <nav
                className="md:hidden fixed left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-[400px]"
                style={{ bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
            >
                <div ref={mobileBarRef} className="relative h-[4.5rem]">
                    <div
                        className="nav-bar-notched absolute inset-0 bg-white/90 dark:bg-ink2/95 backdrop-blur-3xl border border-white/80 dark:border-white/10 shadow-[0_22px_45px_-14px_rgba(18,61,46,0.32)] dark:shadow-[0_20px_48px_-12px_rgba(0,0,0,0.6)] rounded-[2.25rem]"
                        style={notchX != null ? { "--notch-x": `${notchX}px` } : undefined}
                    />

                    <div className="relative z-10 flex justify-around items-end h-full px-1.5 pt-3 pb-2.5">
                        {tabs.map((tab) => (
                            <BottomNavBtn
                                key={tab.id}
                                innerRef={(el) => (mobileIconRefs.current[tab.id] = el)}
                                href={tab.href}
                                label={tab.label}
                                active={activeTab === tab.id}
                                bounce={activeTab === tab.id ? bounceKey : 0}
                                icon={<tab.icon active={activeTab === tab.id} size={23} />}
                            />
                        ))}
                    </div>
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
        className={`relative z-10 flex items-center gap-2 text-sm transition-all duration-300 px-4 py-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 ${active ? 'font-bold text-peso dark:text-pesoLight' : 'font-medium text-ink2/50 dark:text-paper/40 hover:text-ink dark:hover:text-paper'}`}
    >
        {icon}
        {label}
    </a>
);

const BottomNavBtn = ({ href, icon, label, active, bounce, innerRef }) => (
    <a
        ref={innerRef}
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className="relative z-10 flex flex-col items-center justify-end gap-1.5 h-[3.8rem] w-[3.8rem] rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-peso/40 active:scale-90 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
    >
        <span className="relative flex items-center justify-center">
            {active && (
                <span className="absolute w-[3.3rem] h-[3.3rem] -translate-y-[0.55rem] rounded-[1.4rem] bg-pesoLight/25 dark:bg-pesoLight/30 nav-halo-pulse pointer-events-none" />
            )}
            <span
                key={bounce}
                className={
                    active
                        ? "nav-icon-sink relative flex items-center justify-center w-[3.4rem] h-[3.4rem] -translate-y-[0.55rem] rounded-[1.35rem] bg-gradient-to-br from-pesoLight via-peso to-pesoDeep text-white ring-[3.5px] ring-white dark:ring-ink shadow-[0_10px_22px_-6px_rgba(31,111,84,0.55)] overflow-hidden"
                        : "relative flex items-center justify-center w-11 h-11 rounded-full text-ink2/40 dark:text-paper/35 transition-colors duration-300"
                }
            >
                {active && (
                    <span className="absolute inset-x-2 top-1 h-1/2 rounded-t-[1rem] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                )}
                <span className="relative flex items-center justify-center">{icon}</span>
            </span>
        </span>
        {!active && (
            <span className="text-[10px] font-semibold tracking-tight text-ink2/40 dark:text-paper/35">
                {label}
            </span>
        )}
    </a>
);

/* ========================================================================
   MODERN APP ICONS
   - Inactive: 1.75px smooth rounded outlines
   - Active: consistent duotone (solid + 30% opacity secondary shape)
======================================================================== */

const DashboardIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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

const CalcIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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

const ChartIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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

const ProfileIcon = ({ active, size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={active ? "none" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
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
