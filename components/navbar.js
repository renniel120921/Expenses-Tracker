// components/Navbar.js

function Navbar({ user, onLogout, activeTab = "dashboard" }) {
    const userName = user?.displayName ? user.displayName.split(" ")[0] : user?.email?.split("@")[0] || "User";
    const initial = userName.charAt(0).toUpperCase();

    const tabs = [
        { id: "dashboard", href: "dashboard.html", label: "Dashboard", icon: DashboardIcon },
        { id: "chart", href: "chart.html", label: "Chart", icon: ChartIcon },
        { id: "history", href: "history.html", label: "History", icon: HistoryIcon },
        { id: "profile", href: "profile.html", label: "Profile", icon: ProfileIcon },
    ];
    const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));

    // --- Desktop: measure the active link so the pill can glide to it ---
    const linkRefs = React.useRef({});
    const [pillStyle, setPillStyle] = React.useState({ left: 0, width: 0, opacity: 0 });

    const measurePill = React.useCallback(() => {
        const el = linkRefs.current[activeTab];
        if (el) {
            setPillStyle({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
        }
    }, [activeTab]);

    React.useLayoutEffect(() => {
        measurePill();
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
            {/* Local keyframes for the iOS-style icon pop. Scoped by class name, safe to inline. */}
            <style>{`
                @keyframes navIconPop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.26); }
                    65%  { transform: scale(0.94); }
                    100% { transform: scale(1); }
                }
                .nav-icon-pop { animation: navIconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
            `}</style>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex bg-white/80 backdrop-blur-md text-ink px-8 py-5 justify-between items-center w-full sticky top-0 z-50 border-b border-line/40">
                <a href="dashboard.html" className="flex items-center gap-3 w-48">
                    <window.Logo size={28} />
                    <span className="font-display font-semibold text-xl tracking-tight">Tipid</span>
                </a>

                <div className="relative flex items-center gap-2">
                    {/* Sliding pill indicator, glides under whichever tab is active */}
                    <div
                        className="absolute top-1/2 h-9 rounded-full bg-peso/10 pointer-events-none"
                        style={{
                            left: pillStyle.left,
                            width: pillStyle.width,
                            opacity: pillStyle.opacity,
                            transform: "translateY(-50%)",
                            transition:
                                "left 0.45s cubic-bezier(0.34, 1.2, 0.4, 1), width 0.45s cubic-bezier(0.34, 1.2, 0.4, 1), opacity 0.3s ease",
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

                <div className="flex items-center justify-end gap-6 w-48">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-paperDim border border-line flex items-center justify-center text-ink font-semibold text-sm">
                            {initial}
                        </div>
                        <span className="text-sm font-medium text-ink2">{userName}</span>
                    </div>
                    <button onClick={onLogout} className="text-sm font-semibold text-ink2 hover:text-expense transition-colors duration-300">
                        Log out
                    </button>
                </div>
            </nav>

            {/* Mobile Top Header */}
            <header className="md:hidden bg-white/70 backdrop-blur-xl px-6 py-4 flex justify-between items-center fixed top-0 w-full z-50 border-b border-line/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-paperDim border border-white flex items-center justify-center text-ink font-semibold text-base shadow-sm">
                        {initial}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-ink text-sm">Hello, {userName}!</span>
                        <span className="text-[10px] text-ink2/60">Ready to save today?</span>
                    </div>
                </div>

                <button onClick={onLogout} className="text-ink2/60 hover:text-expense active:scale-90 transition-all duration-300 focus:outline-none">
                    <LogOutIcon />
                </button>
            </header>

            {/* Mobile Bottom Navigation (Floating iOS Pill) */}
            <nav className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[92%] max-w-sm">
                <div className="relative flex justify-around items-center px-2 py-3 bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_12px_40px_rgb(0,0,0,0.12)] rounded-[2rem]">
                    {/* Sliding active blob, sits exactly behind whichever tab is active */}
                    <div
                        className="absolute top-1/2 h-12 rounded-full bg-peso/10 pointer-events-none"
                        style={{
                            left: `${activeIndex * 25}%`,
                            width: "25%",
                            transform: "translateY(-50%)",
                            transition: "left 0.5s cubic-bezier(0.34, 1.2, 0.4, 1)",
                        }}
                    />
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
        className={`relative z-10 text-sm transition-colors duration-300 px-4 py-2 rounded-full ${active ? 'font-semibold text-peso' : 'font-medium text-ink2/60 hover:text-ink'}`}
    >
        {label}
    </a>
);

const BottomNavBtn = ({ href, icon, label, active, bounce }) => (
    <a href={href} className="relative z-10 flex flex-col items-center gap-1 focus:outline-none w-[4.5rem] active:scale-90 transition-transform duration-200 ease-out">
        <div key={bounce} className={`transition-colors duration-300 ${active ? 'text-peso drop-shadow-sm nav-icon-pop' : 'text-ink2/40'}`}>
            {icon}
        </div>
        <span className={`text-[10px] tracking-tight transition-all duration-300 ${active ? 'font-semibold text-peso scale-105' : 'font-medium text-ink2/40'}`}>
            {label}
        </span>
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
