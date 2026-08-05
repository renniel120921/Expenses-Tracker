// components/Navbar.js

function Navbar({ user, onLogout, activeTab = "dashboard" }) {
    const userName = user?.displayName ? user.displayName.split(" ")[0] : user?.email?.split("@")[0] || "User";
    const initial = userName.charAt(0).toUpperCase();

    const tabs = [
        { id: "dashboard", href: "dashboard.html", label: "Dashboard", icon: DashboardIcon },
        { id: "bills", href: "bills.html", label: "Bills", icon: BillsIcon },
        { id: "chart", href: "chart.html", label: "Chart", icon: ChartIcon },
        { id: "history", href: "history.html", label: "History", icon: HistoryIcon },
        { id: "profile", href: "profile.html", label: "Profile", icon: ProfileIcon },
    ];

    // --- Desktop: measure the active link so the pill can glide to it ---
    const linkRefs = React.useRef({});
    // Nag-add tayo ng isInitial para i-disable ang slide animation sa first page load
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
        // Initial measurement
        measurePill();

        // FIX: Hintaying mag-load ang custom fonts (Inter/Fraunces) bago sukatin ulit
        // Ito ang mag-aayos sa isyu kung saan nagiging maliit ang pill
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(measurePill);
        }

        window.addEventListener("resize", measurePill);
        return () => window.removeEventListener("resize", measurePill);
    }, [measurePill]);

    // --- Mobile: retrigger the icon "pop" every time the active tab changes ---
    const [bounceKey, setBounceKey] = React.useState(0);
    React.useEffect(() => {
        setBounceKey((k) => k + 1);
    }, [activeTab]);

    return (
        <React.Fragment>
            <style>{`
                @keyframes navIconPop {
                    0%   { transform: translateY(-1rem) scale(1); }
                    40%  { transform: translateY(-1rem) scale(1.24); }
                    65%  { transform: translateY(-1rem) scale(0.95); }
                    100% { transform: translateY(-1rem) scale(1); }
                }
                .nav-icon-pop { animation: navIconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }

                @keyframes navHaloPulse {
                    0%   { transform: scale(0.85); opacity: 0.45; }
                    70%  { opacity: 0; }
                    100% { transform: scale(1.55); opacity: 0; }
                }
                .nav-halo-pulse { animation: navHaloPulse 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite; }

                @media (prefers-reduced-motion: reduce) {
                    .nav-icon-pop, .nav-halo-pulse { animation: none !important; }
                }
            `}</style>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex justify-center bg-white/80 dark:bg-ink2/70 backdrop-blur-md text-ink dark:text-paper w-full sticky top-0 z-50 border-b border-line/40 dark:border-white/10">
                <div className="w-full max-w-6xl px-6 py-4 flex justify-between items-center">

                    <div className="flex-1 flex justify-start">
                        <a href="dashboard.html" className="flex items-center gap-3">
                            <window.Logo size={28} />
                            <span className="font-display font-semibold text-xl tracking-tight">Tipid</span>
                        </a>
                    </div>

                    <div className="relative flex items-center gap-1 lg:gap-2 shrink-0">
                        {/* Sliding pill indicator */}
                        <div
                            className="absolute top-1/2 h-9 rounded-full bg-peso/10 dark:bg-pesoLight/15 shadow-inner pointer-events-none"
                            style={{
                                left: pillStyle.left,
                                width: pillStyle.width,
                                opacity: pillStyle.opacity,
                                transform: "translateY(-50%)",
                                // FIX: Naka-disable ang transition sa initial load para hindi mag-slide-in from left
                                transition: pillStyle.isInitial
                                    ? "none"
                                    : "left 0.45s cubic-bezier(0.34, 1.2, 0.4, 1), width 0.45s cubic-bezier(0.34, 1.2, 0.4, 1), opacity 0.3s ease",
                            }}
                        />
                        {tabs.map((tab) => (
                            <DesktopNavLink
                                key={tab.id}
                                innerRef={(el) => (linkRefs.current[tab.id] = el)}
                                href={tab.href}
                                label={tab.label}
                                active={activeTab === tab.id}
                            />
                        ))}
                    </div>

                    <div className="flex-1 flex items-center justify-end gap-4 lg:gap-6">
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className="w-8 h-8 rounded-full bg-paperDim dark:bg-white/10 border border-line dark:border-white/10 flex items-center justify-center text-ink dark:text-paper font-semibold text-sm">
                                {initial}
                            </div>
                            <span className="hidden lg:block text-sm font-medium text-ink2 dark:text-paper/70 truncate max-w-[120px]">
                                {userName}
                            </span>
                        </div>
                        <button onClick={onLogout} className="text-sm font-semibold text-ink2 dark:text-paper/60 hover:text-expense transition-colors duration-300 shrink-0">
                            Log out
                        </button>
                    </div>

                </div>
            </nav>

            {/* Mobile Top Header */}
            <header className="md:hidden bg-white/70 dark:bg-ink2/70 backdrop-blur-xl px-6 py-4 flex justify-between items-center fixed top-0 w-full z-50 border-b border-line/30 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-paperDim dark:bg-white/10 border border-white dark:border-white/10 flex items-center justify-center text-ink dark:text-paper font-semibold text-base shadow-sm">
                        {initial}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-ink dark:text-paper text-sm">Hello, {userName}!</span>
                        <span className="text-[10px] text-ink2/60 dark:text-paper/45">Ready to save today?</span>
                    </div>
                </div>

                <button onClick={onLogout} className="text-ink2/60 dark:text-paper/45 hover:text-expense active:scale-90 transition-all duration-300 focus:outline-none">
                    <LogOutIcon />
                </button>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[94%] max-w-md">
                <div className="relative flex justify-around items-end px-1 pt-3 pb-2.5 bg-white/85 dark:bg-ink2/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] rounded-[2rem]">
                    {tabs.map((tab) => (
                        <BottomNavBtn
                            key={tab.id}
                            href={tab.href}
                            label={tab.label}
                            active={activeTab === tab.id}
                            bounce={activeTab === tab.id ? bounceKey : 0}
                            icon={<tab.icon active={activeTab === tab.id} />}
                        />
                    ))}
                </div>
            </nav>
        </React.Fragment>
    );
}

const DesktopNavLink = ({ href, label, active, innerRef }) => (
    <a
        ref={innerRef}
        href={href}
        className={`relative z-10 text-sm transition-colors duration-300 px-3.5 py-2 rounded-full ${active ? 'font-semibold text-peso dark:text-pesoLight' : 'font-medium text-ink2/60 dark:text-paper/45 hover:text-ink dark:hover:text-paper'}`}
    >
        {label}
    </a>
);

const BottomNavBtn = ({ href, icon, label, active, bounce }) => (
    <a
        href={href}
        className="relative z-10 flex flex-col items-center justify-end gap-1.5 h-14 w-[3.8rem] focus:outline-none active:scale-95 transition-transform duration-200 ease-out"
    >
        <span className="relative flex items-center justify-center">
            {active && (
                <span className="absolute w-12 h-12 -translate-y-4 rounded-full bg-peso/25 dark:bg-pesoLight/25 nav-halo-pulse pointer-events-none" />
            )}
            <span
                key={bounce}
                className={
                    active
                        ? "relative flex items-center justify-center w-[3.15rem] h-[3.15rem] -translate-y-4 rounded-full bg-gradient-to-br from-pesoLight to-pesoDeep text-white ring-4 ring-white/90 dark:ring-ink2/90 shadow-[0_10px_22px_-6px_rgba(18,61,46,0.6)] nav-icon-pop"
                        : "relative flex items-center justify-center w-11 h-11 rounded-full text-ink2/40 dark:text-paper/35 transition-colors duration-300"
                }
            >
                {icon}
            </span>
        </span>
        {!active && (
            <span className="text-[10px] font-medium tracking-tight text-ink2/40 dark:text-paper/35">
                {label}
            </span>
        )}
    </a>
);

// --- Icons ---
const DashboardIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
);
const BillsIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" strokeWidth={active ? "0" : "1.5"} stroke={active ? "white" : "currentColor"} />
        <line x1="16" y1="17" x2="8" y2="17" strokeWidth={active ? "0" : "1.5"} stroke={active ? "white" : "currentColor"} />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);
const ChartIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
);
const HistoryIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" strokeWidth={active ? "0" : "1.5"} />
        <line x1="8" y1="2" x2="8" y2="6" strokeWidth={active ? "0" : "1.5"} />
        <line x1="3" y1="10" x2="21" y2="10" strokeWidth={active ? "0" : "1.5"} stroke={active ? "white" : "currentColor"} />
    </svg>
);
const ProfileIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);
const LogOutIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);
