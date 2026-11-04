// components/AllowanceCalculator.js

// --- REAL SVG ICONS SUITE ---
const ALLOWANCE_ICONS = {
    Income: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="6" width="20" height="12" rx="2.5" fill="currentColor" fillOpacity="0.12" />
            <circle cx="12" cy="12" r="3" />
            <path d="M6 12h.01M18 12h.01" />
        </svg>
    ),
    Bills: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="currentColor" fillOpacity="0.12" />
            <path d="M14 2v6h6" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
    ),
    Savings: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 9V6a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1v3.4a1 1 0 0 0 .6.92l1.9.82" />
            <path d="M3 9h14a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-1" fill="currentColor" fillOpacity="0.12" />
            <path d="M3 9v10a1 1 0 0 0 1 1h3v-4" />
            <path d="M13 9v12" />
            <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
        </svg>
    ),
    Payday: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.12" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <polyline points="9 16 11 18 15 14" strokeWidth="2.5" />
        </svg>
    ),
    Calendar: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.12" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Edit: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    ),
    Bell: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    ),
    BellOff: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.4" />
        </svg>
    ),
    Check: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Sparkles: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    Clock: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
        </svg>
    ),
    Trash: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Close: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Shield: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.15" />
        </svg>
    ),
    Plus: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Coins: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.15" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="M16.7 13.3a4.5 4.5 0 0 0-3-3.3" />
        </svg>
    ),
    Zap: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    )
};

// Form Field Wrapper
const FieldWrap = ({ icon, children, className = "" }) => (
    <div className={`flex items-center gap-3 bg-white/80 dark:bg-ink2/30 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/50 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 shadow-xs ${className}`}>
        {icon}
        {children}
    </div>
);

// Stat Squircle Chip
const StatChip = ({ label, value, sub, icon, accent, badgeColor }) => (
    <div className="flex-1 min-w-[8.5rem] bg-white/80 dark:bg-ink2/40 backdrop-blur-md rounded-[1.25rem] p-4 border border-black/5 dark:border-white/10 shadow-xs flex items-center gap-3.5 transition-all">
        <div className={`w-11 h-11 rounded-[14px] border flex items-center justify-center shrink-0 ${badgeColor || 'bg-black/5 text-ink2 border-black/10 dark:bg-white/5 dark:text-paper dark:border-white/10'}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase font-semibold tracking-wider text-ink2/50 dark:text-paper/40 mb-0.5">
                {label}
            </p>
            <p className={`font-mono text-[16px] sm:text-[17px] font-bold tracking-tight truncate ${accent || 'text-ink dark:text-paper'}`}>
                {value}
            </p>
            {sub && (
                <p className="text-[10px] text-ink2/50 dark:text-paper/40 truncate">
                    {sub}
                </p>
            )}
        </div>
    </div>
);

// Receipt Table Row
const ReceiptRow = ({ label, value, valueClass = "" }) => (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-dashed border-ink/15 dark:border-paper/15 last:border-b-0">
        <span className="text-[12px] text-ink2/70 dark:text-paper/60 leading-snug">{label}</span>
        <span className={`font-mono text-[13px] font-bold text-right shrink-0 ${valueClass || "text-ink dark:text-paper"}`}>{value}</span>
    </div>
);

// Supported wallets catalog
const WALLET_META = window.SUPPORTED_WALLETS || [
    { id: "Cash", name: "Cash", type: "cash", color: "from-[#1F6F54] to-[#123D2E]", text: "CASH", font: "font-display tracking-[0.15em]", textStyle: "text-white" },
    { id: "GCash", name: "GCash", type: "ewallet", color: "from-[#0052FE] to-[#004ADB]", text: "GCash", font: "font-sans italic font-extrabold tracking-tighter", textStyle: "text-white" },
    { id: "Maya", name: "Maya", type: "ewallet", color: "from-[#0A0A0A] via-[#171717] to-[#242424]", text: "maya", font: "font-sans font-black tracking-widest lowercase", textStyle: "text-white" },
    { id: "ShopeePay", name: "ShopeePay", type: "ewallet", color: "from-[#EE4D2D] to-[#D8390F]", text: "ShopeePay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "GrabPay", name: "GrabPay", type: "ewallet", color: "from-[#00B14F] to-[#009344]", text: "GrabPay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "BDO", name: "BDO Unibank", type: "bank", color: "from-[#002A86] to-[#00133D]", text: "BDO", font: "font-sans font-black tracking-[0.15em]", textStyle: "text-white" },
    { id: "BPI", name: "BPI", type: "bank", color: "from-[#B30000] to-[#5C0000]", text: "BPI", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "UnionBank", name: "UnionBank", type: "bank", color: "from-[#EA5B0C] to-[#8A2E00]", text: "UnionBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" }
];

function walletMeta(id) {
    return WALLET_META.find(w => w.id === id) || { id, name: id, type: "bank", text: id, font: "font-sans font-bold tracking-tight", textStyle: "text-white", color: "from-ink2 to-ink" };
}

// Mini Wallet Selector Card
const MiniWalletChip = ({ id, meta, active, onClick }) => {
    const showChip = meta.type === "bank" || meta.type === "credit";
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`tap-scale relative shrink-0 w-[6.8rem] h-[3.8rem] rounded-[13px] bg-gradient-to-br ${meta.color} p-2.5 flex flex-col justify-between overflow-hidden text-left transition-all duration-200 ${
                active ? 'ring-2 ring-peso ring-offset-2 ring-offset-white dark:ring-offset-ink shadow-md scale-[1.02]' : 'ring-1 ring-black/5 dark:ring-white/10 opacity-75 hover:opacity-100 shadow-xs'
            }`}
        >
            <span className="absolute -right-4 -top-5 w-14 h-14 bg-white/15 rounded-full blur-md pointer-events-none" />
            {showChip ? (
                <span className="w-4 h-3 rounded-[3px] bg-gradient-to-br from-[#E6D070] to-[#947A26] shadow-inner shrink-0" />
            ) : (
                <span className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
            )}
            <span className={`relative z-10 ${meta.font} text-[12px] leading-none ${meta.textStyle} truncate drop-shadow-sm`}>
                {meta.text}
            </span>
            {active && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center z-10 shadow">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1F6F54" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
            )}
        </button>
    );
};

// --- MAIN ALLOWANCE CALCULATOR COMPONENT ---
window.AllowanceCalculator = function AllowanceCalculator({ user, entries: entriesProp, loading: entriesLoading, onStatsChange }) {
    const { useState, useEffect, useRef, useMemo } = React;

    const uid = user?.uid || window.TipidAuth?.currentUser?.uid || null;
    const entries = entriesProp || [];

    const CATEGORIES = window.CATEGORIES || ["Pagkain", "Pamasahe", "Bills", "Load", "Ipon", "Project Components", "Iba pa"];

    const CATEGORY_META = {
        "Pagkain": { color: "#1F6F54", bg: "#E6F3EF", icon: <path d="M7 2v6a2 2 0 0 0 2 2v10M7 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2m0-8v8m10-8c-2.2 0-4 2.1-4 5.5S14.8 15 17 15v7" /> },
        "Pamasahe": { color: "#0284C7", bg: "#E0F2FE", icon: <><path d="M4 16V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" /><circle cx="8" cy="19" r="1.5" /><circle cx="16" cy="19" r="1.5" /></> },
        "Bills": { color: "#E11D48", bg: "#FFE4E6", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></> },
        "Load": { color: "#7C3AED", bg: "#EDE9FE", icon: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></> },
        "Ipon": { color: "#059669", bg: "#D1FAE5", icon: <><path d="M19 9V6a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1v3.4a1 1 0 0 0 .6.92l1.9.82" /><path d="M3 9h14a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-1" /></> },
        "Project Components": { color: "#D97706", bg: "#FEF3C7", icon: <><path d="m21 16-9 5-9-5V8l9-5 9 5Z" /></> }
    };
    const DEFAULT_META = { color: "#64748B", bg: "#F1F5F9", icon: <circle cx="12" cy="12" r="6" /> };
    const getCategoryMeta = (cat) => CATEGORY_META[cat] || DEFAULT_META;

    const moneyOrZero = (value) => {
        try { return window.TipidCore.money(value || 0, { allowZero: true }); }
        catch (_) { return 0; }
    };

    const [salary, setSalary] = useState("");
    // Listen for Net Pay Estimator apply events
    useEffect(() => {
        const handleApplyNetPay = (e) => {
            if (e.detail?.amount != null) {
                setSalary(String(e.detail.amount));
                setEditOpen(false);
                pushToast(`Naitakda ang ₱${window.peso(e.detail.amount)} (${e.detail.mode === "semi" ? "Bawat Sahod" : "Buwanan"}) sa Badyet!`);
                if (window.TipidCelebration) {
                    window.TipidCelebration.playChime();
                }
            }
        };
        window.addEventListener("tipid-apply-netpay", handleApplyNetPay);
        return () => window.removeEventListener("tipid-apply-netpay", handleApplyNetPay);
    }, []);

    const [bills, setBills] = useState("");
    const [savings, setSavings] = useState("");
    const [paydayDate, setPaydayDate] = useState("");

    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const saveTimer = useRef(null);

    const [editOpen, setEditOpen] = useState(false);
    const autoOpenedRef = useRef(false);

    const [expAmount, setExpAmount] = useState("");
    const [expNote, setExpNote] = useState("");
    const [expCategory, setExpCategory] = useState(CATEGORIES[0] || "Pagkain");
    const [loggingExpense, setLoggingExpense] = useState(false);

    const [baseBalances, setBaseBalances] = useState({ Cash: 0 });
    const [expMethod, setExpMethod] = useState("Cash");

    // Fetch user wallets for payment chips
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (uid && window.FirestoreAPI && window.db) {
                    const { doc, getDoc } = window.FirestoreAPI;
                    const snap = await getDoc(doc(window.db, "users", uid));
                    if (!cancelled && snap.exists() && snap.data().wallets) {
                        const wallets = snap.data().wallets;
                        setBaseBalances(wallets.Cash !== undefined ? wallets : { Cash: 0, ...wallets });
                    }
                }
            } catch (err) {}
        })();
        return () => { cancelled = true; };
    }, [uid]);

    const walletIds = useMemo(() => Object.keys(baseBalances), [baseBalances]);
    const walletBalances = useMemo(() => {
        return window.TipidCore.walletBalances(entries, baseBalances);
    }, [entries, baseBalances]);

    useEffect(() => {
        let preferred = null;
        try { preferred = localStorage.getItem(window.TipidCore.storageKey(uid, "default_wallet")); } catch (_) {}
        if (!walletIds.includes(expMethod)) setExpMethod(walletIds.includes(preferred) ? preferred : (walletIds[0] || "Cash"));
    }, [walletIds, uid]);

    const [dismissedBanner, setDismissedBanner] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [notifEnabled, setNotifEnabled] = useState(false);
    const notifiedFlags = useRef({ danger: false, warning: false, payday: false });

    const todayKey = (d = new Date()) => window.TipidCore.manilaDateKey(d);
    const entryToDate = (entry) => window.TipidCore.entryDate(entry);

    const pushToast = (message, tone = "success") => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, tone }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const toggleNotifications = async () => {
        if (typeof Notification === "undefined") {
            pushToast("Notifications not supported in your browser.", "warning");
            return;
        }
        if (notifEnabled) {
            setNotifEnabled(false);
            if (uid) localStorage.setItem(`tipid_notif_${uid}`, "off");
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            setNotifEnabled(true);
            if (uid) localStorage.setItem(`tipid_notif_${uid}`, "on");
            pushToast("Pacing alerts enabled.", "success");
        } else {
            pushToast("Notifications were denied in browser permissions.", "warning");
        }
    };

    useEffect(() => {
        if (!uid) return;
        const pref = localStorage.getItem(`tipid_notif_${uid}`);
        if (pref === "on" && typeof Notification !== "undefined" && Notification.permission === "granted") {
            setNotifEnabled(true);
        }
    }, [uid]);

    // Load saved settings from Firestore
    useEffect(() => {
        if (!uid || !window.db || !window.FirestoreAPI) return;
        const { doc, getDoc } = window.FirestoreAPI;

        (async () => {
            try {
                const snap = await getDoc(doc(window.db, "users", uid));
                if (snap.exists()) {
                    const data = snap.data();
                    const a = data.allowance || {};
                    if (a.salary != null) setSalary(String(a.salary));
                    if (a.bills != null) setBills(String(a.bills));
                    if (a.savings != null) setSavings(String(a.savings));
                    if (a.paydayDate) setPaydayDate(a.paydayDate);
                }
            } catch (err) {
                console.error("Failed to load allowance settings:", err);
            } finally {
                setLoaded(true);
            }
        })();
    }, [uid]);

    // Autosave settings
    useEffect(() => {
        if (!loaded || !uid || !window.db || !window.FirestoreAPI) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            const { doc, setDoc, serverTimestamp } = window.FirestoreAPI;
            try {
                setSaving(true);
                await setDoc(doc(window.db, "users", uid), {
                    allowance: {
                        salary: moneyOrZero(salary),
                        bills: moneyOrZero(bills),
                        savings: moneyOrZero(savings),
                        paydayDate: paydayDate || null,
                        updatedAt: serverTimestamp()
                    }
                }, { merge: true });
            } catch (err) {
                console.error("Failed to save allowance settings:", err);
            } finally {
                setSaving(false);
            }
        }, 600);

        return () => clearTimeout(saveTimer.current);
    }, [salary, bills, savings, paydayDate, loaded, uid]);

    // Financial Computations
    const todaysExpenses = useMemo(() => {
        const key = todayKey();
        return entries.filter(e => e.type !== "income" && todayKey(entryToDate(e)) === key);
    }, [entries]);

    const spentToday = useMemo(
        () => window.TipidCore.sumMoney(todaysExpenses.map(e => e.amount)),
        [todaysExpenses]
    );

    const numSalary = moneyOrZero(salary);
    const numBills = moneyOrZero(bills);
    const numSavings = moneyOrZero(savings);

    const daysLeft = (() => {
        if (!paydayDate) return 0;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const payday = new Date(paydayDate + "T00:00:00");
        const diffMs = payday - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    })();

    const remaining = numSalary - numBills - numSavings;
    const dailySafe = daysLeft > 0 ? remaining / daysLeft : 0;
    const remainingToday = dailySafe - spentToday;

    const isOverBudget = loaded && dailySafe > 0 && remainingToday < 0;
    const isNearLimit = loaded && dailySafe > 0 && !isOverBudget && spentToday >= dailySafe * 0.8;
    const isPaydaySoon = loaded && daysLeft > 0 && daysLeft <= 2;
    const isConfigured = numSalary > 0 && !!paydayDate;

    // Notify parent page stats
    useEffect(() => {
        if (typeof onStatsChange === "function") {
            onStatsChange({
                dailySafe,
                daysLeft,
                remaining,
                isOverBudget,
                isNearLimit,
                isPaydaySoon
            });
        }
    }, [dailySafe, daysLeft, remaining, isOverBudget, isNearLimit, isPaydaySoon, onStatsChange]);

    // Quick Payday Presets Helper
    const setPresetPayday = (type) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);

        if (type === "plus15") {
            d.setDate(d.getDate() + 15);
        } else if (type === "plus30") {
            d.setDate(d.getDate() + 30);
        } else if (type === "next15or30") {
            const day = d.getDate();
            if (day < 15) {
                d.setDate(15);
            } else {
                // Last day of month or 30th
                const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                d.setDate(Math.min(30, lastDay));
            }
        }

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setPaydayDate(`${yyyy}-${mm}-${dd}`);
        pushToast("Updated next payday target date.", "success");
    };

    // ---------- Smart Weekly Insights & Resibo ----------
    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const dailyHistory = useMemo(() => {
        const out = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            const key = todayKey(d);
            const total = entries
                .filter(e => e.type !== "income" && todayKey(entryToDate(e)) === key)
                .reduce((sum, e) => window.TipidCore.sumMoney([sum, e.amount]), 0);
            out.push({ key, dow: d.getDay(), total, isToday: i === 0 });
        }
        return out;
    }, [entries]);

    const totalExpenseCount = useMemo(() => entries.filter(e => e.type !== "income").length, [entries]);
    const hasEnoughHistory = totalExpenseCount >= 3;

    const priorDays = dailyHistory.slice(0, -1);
    const avgDailySpend = priorDays.length > 0
        ? priorDays.reduce((s, d) => s + d.total, 0) / priorDays.length
        : 0;

    const categoryTotals7d = useMemo(() => {
        const map = {};
        const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); cutoff.setDate(cutoff.getDate() - 6);
        entries.forEach(e => {
            if (e.type === "income") return;
            const d = entryToDate(e);
            if (d < cutoff) return;
            const cat = e.category || "Iba pa";
            map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
        });
        return map;
    }, [entries]);

    const topCategoryEntry = useMemo(() => {
        const list = Object.entries(categoryTotals7d).sort((a, b) => b[1] - a[1]);
        return list.length > 0 ? { name: list[0][0], amount: list[0][1] } : null;
    }, [categoryTotals7d]);

    const budgetStreak = useMemo(() => {
        if (!(dailySafe > 0)) return 0;
        let streak = 0;
        for (let i = priorDays.length - 1; i >= 0; i--) {
            if (priorDays[i].total <= dailySafe) streak++;
            else break;
        }
        return streak;
    }, [priorDays, dailySafe]);

    const pace = avgDailySpend > 0 ? avgDailySpend : dailySafe;
    const projectedDaysCovered = pace > 0 ? remaining / pace : Infinity;
    const willRunOutEarly = loaded && isConfigured && hasEnoughHistory && daysLeft > 0 && avgDailySpend > 0 && projectedDaysCovered < daysLeft;
    const shortfallDays = willRunOutEarly ? Math.ceil(daysLeft - projectedDaysCovered) : 0;
    const paceVsSafePct = dailySafe > 0 ? Math.round(((avgDailySpend - dailySafe) / dailySafe) * 100) : 0;

    // Log new expense
    const handleLogExpense = async (e) => {
        e.preventDefault();
        const amt = parseFloat(expAmount);
        if (!amt || amt <= 0 || !uid || !window.TipidData) return;

        const currentBalance = walletBalances[expMethod] || 0;
        if (amt > currentBalance) {
            return Swal.fire({
                icon: 'error',
                title: 'Insufficient Balance',
                text: `Cannot use ${walletMeta(expMethod).name} because its available balance is only ₱${window.peso(currentBalance)}.`,
                confirmButtonColor: '#B5483B',
                customClass: { popup: 'tipid-swal' }
            });
        }

        try {
            setLoggingExpense(true);
            await window.TipidData.addExpense(uid, {
                desc: expNote.trim() || expCategory,
                amount: amt,
                category: expCategory,
                method: expMethod
            });
            setExpAmount("");
            setExpNote("");
            pushToast(`Logged ₱${window.peso(amt)} to ${expMethod}.`, "success");
        } catch (err) {
            console.error(err);
            pushToast("Failed to save expense. Please try again.", "warning");
        } finally {
            setLoggingExpense(false);
        }
    };

    const handleDeleteExpense = async (entryId) => {
        if (!uid || !window.TipidData) return;
        try {
            await window.TipidData.deleteEntry(uid, entryId);
            pushToast("Expense removed.", "success");
        } catch (err) { console.error(err); }
    };

    // Circular Progress Ring Math
    const spendRatio = dailySafe > 0 ? Math.min(spentToday / dailySafe, 1) : 0;
    const spendPct = Math.round(spendRatio * 100);
    const ringTone = isOverBudget ? "#E11D48" : isNearLimit ? "#D97706" : "#1F6F54";
    const RING_R = 52;
    const RING_C = 2 * Math.PI * RING_R;
    const ringOffset = RING_C * (1 - spendRatio);

    const QUICK_AMOUNTS = [20, 50, 100, 200, 500];

    // Percentage of Income Breakdown
    const billsPct = numSalary > 0 ? Math.min(Math.round((numBills / numSalary) * 100), 100) : 0;
    const savingsPct = numSalary > 0 ? Math.min(Math.round((numSavings / numSalary) * 100), 100) : 0;
    const allowancePct = Math.max(0, 100 - billsPct - savingsPct);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Top Floating Toast Notification Feed */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`fade-up pointer-events-auto rounded-[1.25rem] px-5 py-3.5 text-[13px] font-bold shadow-iosLg border backdrop-blur-2xl flex items-center gap-3 ${
                            t.tone === "warning"
                                ? "bg-rose-600/95 text-white border-rose-500/50"
                                : "bg-ink/95 dark:bg-paper/95 text-paper dark:text-ink border-white/10"
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${t.tone === "warning" ? "bg-white" : "bg-emerald-400"}`} />
                        {t.message}
                    </div>
                ))}
            </div>

            {/* ============================================================== */}
            {/* 1. CONFIGURATION & BUDGET ALLOCATION CARD                      */}
            {/* ============================================================== */}
            <div className="bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pesoLight via-emerald-400 to-peso" />

                {/* Top Action Row */}
                <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-3.5">
                        <span className="w-11 h-11 rounded-2xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 border border-peso/20 dark:border-pesoLight/20 shadow-xs">
                            <ALLOWANCE_ICONS.Shield size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-[1.18rem] sm:text-[1.25rem] font-bold text-ink dark:text-paper leading-tight">
                                Budget & Pacing Settings
                            </h3>
                            <p className="text-[11.5px] text-ink2/60 dark:text-paper/50 flex items-center gap-1.5 mt-0.5">
                                {saving && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                <span>{saving ? "Syncing..." : loaded ? "Saved & encrypted on Firebase" : "Loading..."}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setEditOpen(o => !o)}
                            className="tap-scale px-3.5 py-2 rounded-xl border bg-white dark:bg-ink2/60 border-black/10 dark:border-white/10 text-xs font-bold text-ink dark:text-paper hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                            <ALLOWANCE_ICONS.Edit size={14} />
                            <span>{editOpen ? "Done" : "Edit"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={toggleNotifications}
                            aria-label="Toggle notifications"
                            className={`tap-scale w-9 h-9 rounded-xl border flex items-center justify-center transition-colors shadow-xs ${
                                notifEnabled
                                    ? "bg-peso text-white border-peso"
                                    : "bg-white dark:bg-ink2/60 text-ink2/60 dark:text-paper/60 border-black/10 dark:border-white/10 hover:bg-black/5"
                            }`}
                        >
                            {notifEnabled ? <ALLOWANCE_ICONS.Bell size={16} /> : <ALLOWANCE_ICONS.BellOff size={16} />}
                        </button>
                    </div>
                </div>

                {/* Editable Input Panel or Read-Only Stat Chips */}
                {editOpen ? (
                    <div className="space-y-5 mb-8 animate-[fadeIn_0.3s_ease-out]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Salary Input */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50 pl-1">
                                        Income / Total Allowance
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById("netpay-estimator-section");
                                            if (el) el.scrollIntoView({ behavior: "smooth" });
                                        }}
                                        className="text-[11px] font-bold text-peso dark:text-pesoLight hover:underline flex items-center gap-1 active:scale-95 transition-transform focus:outline-none"
                                    >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg><span>Kaltas-Sahod Estimator</span>
                                    </button>
                                </div>
                                <FieldWrap icon={<ALLOWANCE_ICONS.Income size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}>
                                    <input
                                        type="number"
                                        placeholder="e.g. 15000"
                                        value={salary}
                                        onChange={e => setSalary(e.target.value)}
                                        className="w-full bg-transparent py-3.5 text-base font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                    />
                                </FieldWrap>
                            </div>

                            {/* Bills Input */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50 pl-1">
                                    Fixed Bills & Obligations
                                </label>
                                <FieldWrap icon={<ALLOWANCE_ICONS.Bills size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />}>
                                    <input
                                        type="number"
                                        placeholder="e.g. 5000"
                                        value={bills}
                                        onChange={e => setBills(e.target.value)}
                                        className="w-full bg-transparent py-3.5 text-base font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                    />
                                </FieldWrap>
                            </div>

                            {/* Savings Target */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50 pl-1">
                                    Target Savings (Set Aside)
                                </label>
                                <FieldWrap icon={<ALLOWANCE_ICONS.Savings size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />}>
                                    <input
                                        type="number"
                                        placeholder="e.g. 1000"
                                        value={savings}
                                        onChange={e => setSavings(e.target.value)}
                                        className="w-full bg-transparent py-3.5 text-base font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                    />
                                </FieldWrap>
                            </div>

                            {/* Payday Date */}
                            <div className="space-y-1">
                                <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50 pl-1">
                                    Next Payday Date
                                </label>
                                <FieldWrap icon={<ALLOWANCE_ICONS.Calendar size={18} className="text-sky-600 dark:text-sky-400 shrink-0" />}>
                                    <input
                                        type="date"
                                        value={paydayDate}
                                        onChange={e => setPaydayDate(e.target.value)}
                                        className="w-full bg-transparent py-3.5 text-base font-mono font-bold text-ink dark:text-paper focus:outline-none cursor-pointer"
                                    />
                                </FieldWrap>
                            </div>
                        </div>

                        {/* Quick Payday Presets Bar */}
                        <div className="flex items-center gap-2 flex-wrap pt-1 pl-1">
                            <span className="text-[11px] text-ink2/50 dark:text-paper/40 mr-1 font-medium">
                                Quick Payday Presets:
                            </span>
                            <button
                                type="button"
                                onClick={() => setPresetPayday("next15or30")}
                                className="tap-scale px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold"
                            >
                                Next 15th / 30th
                            </button>
                            <button
                                type="button"
                                onClick={() => setPresetPayday("plus15")}
                                className="tap-scale px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-ink2 dark:text-paper text-xs font-semibold"
                            >
                                +15 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => setPresetPayday("plus30")}
                                className="tap-scale px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 text-ink2 dark:text-paper text-xs font-semibold"
                            >
                                +30 Days
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 mb-8">
                        {/* 4 Stat Squircles */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                            <StatChip
                                label="Income"
                                value={`₱${window.peso(numSalary)}`}
                                sub="Total received"
                                icon={<ALLOWANCE_ICONS.Income size={20} />}
                                badgeColor="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            />
                            <StatChip
                                label="Fixed Bills"
                                value={`₱${window.peso(numBills)}`}
                                sub={`${billsPct}% of income`}
                                icon={<ALLOWANCE_ICONS.Bills size={20} />}
                                badgeColor="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                            />
                            <StatChip
                                label="Savings"
                                value={`₱${window.peso(numSavings)}`}
                                sub={`${savingsPct}% of income`}
                                icon={<ALLOWANCE_ICONS.Savings size={20} />}
                                badgeColor="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            />
                            <StatChip
                                label="Payday"
                                value={paydayDate ? `${daysLeft} ${daysLeft === 1 ? "day" : "days"}` : "Not set"}
                                sub={paydayDate || "Tap edit to set"}
                                icon={<ALLOWANCE_ICONS.Payday size={20} />}
                                badgeColor="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                            />
                        </div>

                        {/* Proportional Budget Allocation Segmented Bar */}
                        {numSalary > 0 && (
                            <div className="bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5 space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-medium text-ink2/70 dark:text-paper/60">
                                    <span>Income Distribution</span>
                                    <span className="font-mono text-ink dark:text-paper font-bold">100% Allocated</span>
                                </div>

                                <div className="h-3 w-full rounded-full overflow-hidden bg-black/10 dark:bg-white/10 flex">
                                    <div style={{ width: `${billsPct}%` }} className="bg-rose-500 transition-all duration-500" title={`Bills: ${billsPct}%`} />
                                    <div style={{ width: `${savingsPct}%` }} className="bg-amber-400 transition-all duration-500" title={`Savings: ${savingsPct}%`} />
                                    <div style={{ width: `${allowancePct}%` }} className="bg-emerald-500 transition-all duration-500" title={`Allowance: ${allowancePct}%`} />
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-mono text-ink2/60 dark:text-paper/50 flex-wrap gap-2 pt-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                                        Bills: {billsPct}% (₱{window.peso(numBills)})
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                                        Savings: {savingsPct}% (₱{window.peso(numSavings)})
                                    </span>
                                    <span className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        Free Allowance: {allowancePct}% (₱{window.peso(remaining)})
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Bottom Pacing Row: Remaining Budget & Safe Daily Allowance with Circular Gauge */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 sm:gap-8 items-center pt-6 border-t border-black/5 dark:border-white/10">
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
                        {/* Remaining Discretionary Budget */}
                        <div className="bg-white/60 dark:bg-black/20 p-5 rounded-2xl border border-black/5 dark:border-white/5 shadow-xs">
                            <p className="text-[11px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/40 mb-1.5">
                                Free Discretionary Budget
                            </p>
                            <p className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight truncate ${remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink dark:text-paper'}`}>
                                ₱{window.peso(remaining)}
                            </p>
                            <p className="text-[11px] text-ink2/50 dark:text-paper/40 mt-1">
                                Available after bills & savings
                            </p>
                        </div>

                        {/* Safe Daily Limit */}
                        <div className="bg-emerald-500/10 dark:bg-emerald-400/15 p-5 rounded-2xl border border-emerald-500/20 shadow-xs relative overflow-hidden">
                            <p className="text-[11px] font-mono uppercase font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">
                                Safe Daily Limit
                            </p>
                            <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-300 truncate">
                                ₱{window.peso(dailySafe)}
                            </p>
                            {daysLeft === 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setPresetPayday("next15or30")}
                                    className="tap-scale mt-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 underline flex items-center gap-1"
                                >
                                    <span>Payday is today! Bump to next period →</span>
                                </button>
                            ) : (
                                <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70 mt-1">
                                    Paced across {daysLeft} remaining {daysLeft === 1 ? "day" : "days"}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Circular SVG Gauge for Today's Pacing */}
                    {dailySafe > 0 && (
                        <div className="flex items-center justify-center sm:justify-self-end relative">
                            <div className="relative w-[130px] h-[130px] shrink-0">
                                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                    <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="9" className="stroke-black/5 dark:stroke-white/10" />
                                    <circle
                                        cx="60" cy="60" r={RING_R} fill="none" strokeWidth="9" strokeLinecap="round"
                                        stroke={ringTone}
                                        strokeDasharray={RING_C}
                                        strokeDashoffset={ringOffset}
                                        className="transition-all duration-700 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono text-2xl font-bold tracking-tight text-ink dark:text-paper">{spendPct}%</span>
                                    <span className="text-[10px] font-medium text-ink2/50 dark:text-paper/40">used today</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================== */}
            {/* 2. WEEKLY THERMAL RECEIPT PACING SECTION                       */}
            {/* ============================================================== */}
            {loaded && isConfigured && (
                <div className="fade-up relative" aria-labelledby="resibo-heading">
                    {/* Top Serrated Edge */}
                    <div
                        className="h-3 -mb-px text-paperDim dark:text-ink2/50"
                        style={{
                            backgroundImage: "linear-gradient(135deg, currentColor 25%, transparent 25%), linear-gradient(225deg, currentColor 25%, transparent 25%)",
                            backgroundSize: "14px 14px",
                            backgroundPosition: "bottom",
                            backgroundRepeat: "repeat-x"
                        }}
                        aria-hidden="true"
                    />

                    <div className="bg-white/85 dark:bg-ink2/40 backdrop-blur-xl px-6 sm:px-8 py-6 border-x border-black/5 dark:border-white/10">
                        <div className="flex items-center justify-between mb-5">
                            <h3 id="resibo-heading" className="font-mono text-[13px] font-bold tracking-widest text-ink dark:text-paper uppercase flex items-center gap-2">
                                <ALLOWANCE_ICONS.Coins size={16} className="text-peso" />
                                <span>Weekly Allowance Receipt</span>
                            </h3>
                            <span className="font-mono text-[11px] text-ink2/50 dark:text-paper/40">
                                {DAY_LABELS[dailyHistory[0]?.dow ?? 0]}–{DAY_LABELS[new Date().getDay()]}
                            </span>
                        </div>

                        {!hasEnoughHistory ? (
                            <p className="text-[13px] text-ink2/60 dark:text-paper/50 leading-relaxed py-4 text-center">
                                Log a few more daily expenses to build your weekly pattern and receive pacing insights.
                            </p>
                        ) : (
                            <>
                                {/* 7-Day Mini Bar Chart */}
                                <div className="flex items-end justify-between gap-2 mb-6 px-1">
                                    {dailyHistory.map((d) => {
                                        const maxBar = Math.max(dailySafe, ...dailyHistory.map(dh => dh.total), 1);
                                        const h = Math.max((d.total / maxBar) * 64, d.total > 0 ? 5 : 2);
                                        const over = dailySafe > 0 && d.total > dailySafe;
                                        const near = dailySafe > 0 && !over && d.total >= dailySafe * 0.8;
                                        const barColor = over ? "#E11D48" : near ? "#D97706" : "#1F6F54";
                                        return (
                                            <div key={d.key} className="flex flex-col items-center gap-2 flex-1">
                                                <div className="w-full h-16 flex items-end justify-center">
                                                    <div
                                                        className="w-[60%] rounded-t-md transition-all duration-500"
                                                        style={{
                                                            height: `${h}px`,
                                                            backgroundColor: barColor,
                                                            opacity: d.isToday ? 1 : 0.6
                                                        }}
                                                    />
                                                </div>
                                                <span className={`text-[9px] font-mono font-bold ${d.isToday ? "text-peso dark:text-pesoLight" : "text-ink2/40 dark:text-paper/30"}`}>
                                                    {d.isToday ? "TODAY" : DAY_LABELS[d.dow]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-dashed border-ink/15 dark:border-paper/15 pt-2">
                                    <ReceiptRow label="Average daily spend" value={`₱${window.peso(avgDailySpend)}`} />
                                    {dailySafe > 0 && (
                                        <ReceiptRow
                                            label="Vs. safe daily limit"
                                            value={paceVsSafePct <= 0 ? `${Math.abs(paceVsSafePct)}% under limit` : `${paceVsSafePct}% over limit`}
                                            valueClass={paceVsSafePct <= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}
                                        />
                                    )}
                                    {topCategoryEntry && (
                                        <ReceiptRow
                                            label="Top expense category"
                                            value={`${window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[topCategoryEntry.name] || topCategoryEntry.name) : topCategoryEntry.name} · ₱${window.peso(topCategoryEntry.amount)}`}
                                        />
                                    )}
                                    <ReceiptRow
                                        label="Consecutive days on budget"
                                        value={`${budgetStreak} ${budgetStreak === 1 ? "day" : "days"}`}
                                        valueClass={budgetStreak >= 3 ? "text-emerald-700 dark:text-emerald-400 font-bold" : ""}
                                    />
                                </div>

                                {/* Burn Rate Forecasting Callout */}
                                <div className={`mt-4 rounded-xl px-4 py-3 text-[12.5px] leading-relaxed font-medium ${
                                    willRunOutEarly
                                        ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                                        : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                                }`}>
                                    {willRunOutEarly
                                        ? `Petsa de Peligro Alert: At your current burn rate, your allowance may run out ${shortfallDays} ${shortfallDays === 1 ? "day" : "days"} before payday. Cut non-urgent spending!`
                                        : "Safe Burn Rate: Your allowance will safely last until your scheduled payday. Keep it up!"}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Bottom Serrated Edge */}
                    <div
                        className="h-3 -mt-px text-paperDim dark:text-ink2/50 rotate-180"
                        style={{
                            backgroundImage: "linear-gradient(135deg, currentColor 25%, transparent 25%), linear-gradient(225deg, currentColor 25%, transparent 25%)",
                            backgroundSize: "14px 14px",
                            backgroundPosition: "bottom",
                            backgroundRepeat: "repeat-x"
                        }}
                        aria-hidden="true"
                    />
                </div>
            )}

            {/* ============================================================== */}
            {/* 3. TODAY'S EXPENSES QUICK LOGGER & FEED                        */}
            {/* ============================================================== */}
            <div className="bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios p-6 sm:p-8">
                <div className="flex items-center gap-3.5 mb-2">
                    <span className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
                        <ALLOWANCE_ICONS.Clock size={20} />
                    </span>
                    <div>
                        <h3 className="font-display text-[1.18rem] sm:text-[1.25rem] font-bold text-ink dark:text-paper leading-tight">
                            Today's Daily Spend
                        </h3>
                        <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                            Log micro-expenses directly against your safe daily limit
                        </p>
                    </div>
                </div>

                {/* Today's Spend Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[11px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/40 mb-1">
                            Spent Today
                        </p>
                        <p className="font-mono text-2xl font-bold text-ink dark:text-paper">
                            ₱{window.peso(spentToday)}
                        </p>
                    </div>

                    <div className={`p-4 rounded-2xl border transition-colors ${
                        remainingToday < 0
                            ? 'bg-rose-500/10 border-rose-500/25 dark:bg-rose-500/15'
                            : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5'
                    }`}>
                        <p className={`text-[11px] font-mono uppercase font-semibold mb-1 ${remainingToday < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink2/50 dark:text-paper/40'}`}>
                            {remainingToday < 0 ? 'Over Daily Limit' : 'Safe Spend Remaining'}
                        </p>
                        <p className={`font-mono text-2xl font-bold ${remainingToday < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                            ₱{window.peso(Math.abs(remainingToday))}
                        </p>
                    </div>
                </div>

                {/* Quick Add Expense Form */}
                <form onSubmit={handleLogExpense} className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <FieldWrap icon={<span className="text-peso font-mono font-bold text-lg">₱</span>}>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Amount"
                                    value={expAmount}
                                    onChange={e => setExpAmount(e.target.value)}
                                    className="w-full bg-transparent py-3.5 text-lg font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                />
                            </FieldWrap>

                            {/* Quick Amount Chips */}
                            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                                {QUICK_AMOUNTS.map(a => (
                                    <button
                                        key={a}
                                        type="button"
                                        onClick={() => setExpAmount(String(window.TipidCore.sumMoney([moneyOrZero(expAmount), a])))}
                                        className="tap-scale text-[11px] font-mono font-bold text-ink2/70 dark:text-paper/70 bg-black/5 dark:bg-white/10 hover:bg-black/10 px-2.5 py-1 rounded-lg"
                                    >
                                        +₱{a}
                                    </button>
                                ))}
                                {expAmount !== "" && (
                                    <button
                                        type="button"
                                        onClick={() => setExpAmount("")}
                                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 ml-auto px-2 py-1"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <FieldWrap icon={<ALLOWANCE_ICONS.Edit size={16} className="text-ink2/40 dark:text-paper/40" />}>
                            <input
                                type="text"
                                placeholder="Note (e.g. Lunch, Jeep, Coffee)"
                                value={expNote}
                                onChange={e => setExpNote(e.target.value)}
                                className="w-full bg-transparent py-3.5 text-sm font-medium text-ink dark:text-paper focus:outline-none"
                            />
                        </FieldWrap>
                    </div>

                    {/* Payment Wallet Picker */}
                    <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] font-mono font-bold text-ink2/50 dark:text-paper/40 uppercase tracking-widest pl-1">
                            Pay With Wallet
                        </p>
                        <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                            {walletIds.map(id => {
                                const meta = walletMeta(id);
                                return (
                                    <MiniWalletChip
                                        key={id}
                                        id={id}
                                        meta={meta}
                                        active={expMethod === id}
                                        onClick={() => setExpMethod(id)}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Badges */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        {CATEGORIES.filter(c => c !== "Kita").map(c => {
                            const meta = getCategoryMeta(c);
                            const active = expCategory === c;
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setExpCategory(c)}
                                    style={active ? { backgroundColor: meta.bg, borderColor: `${meta.color}55`, color: meta.color } : undefined}
                                    className={`tap-scale flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${
                                        active
                                            ? "shadow-xs"
                                            : "bg-black/[0.03] dark:bg-white/[0.04] border-black/5 dark:border-white/5 text-ink2/60 dark:text-paper/50"
                                    }`}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 shrink-0" strokeWidth="2.5" stroke={active ? meta.color : "currentColor"} strokeLinecap="round" strokeLinejoin="round">
                                        {meta.icon}
                                    </svg>
                                    <span>{window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[c] || c) : c}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Submit Log Expense Button */}
                    <button
                        type="submit"
                        disabled={loggingExpense || !expAmount || parseFloat(expAmount) <= 0}
                        className="tap-scale w-full bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/25 text-white py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-60 transition-all border border-white/20 mt-2"
                    >
                        {loggingExpense ? (
                            <span>Logging to {expMethod}...</span>
                        ) : (
                            <>
                                <ALLOWANCE_ICONS.Plus size={16} />
                                <span>Log ₱{expAmount ? window.peso(expAmount) : "0.00"} to {expMethod}</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Today's Logged Items List */}
                {entriesLoading ? (
                    <div className="space-y-3 animate-pulse">
                        {[0, 1].map(i => <div key={i} className="h-16 rounded-xl bg-black/5 dark:bg-white/5" />)}
                    </div>
                ) : todaysExpenses.length > 0 ? (
                    <div className="space-y-2.5">
                        <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/50 dark:text-paper/40 pl-1">
                            Logged Today ({todaysExpenses.length})
                        </p>
                        <div className="divide-y divide-black/5 dark:divide-white/5">
                            {todaysExpenses.map(exp => {
                                const meta = getCategoryMeta(exp.category);
                                const expWallet = walletMeta(exp.method || "Cash");
                                return (
                                    <div key={exp.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10"
                                                style={{ backgroundColor: meta.bg, color: meta.color }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                                    {meta.icon}
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-ink dark:text-paper truncate">
                                                    {exp.desc || exp.category}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-[11px] text-ink2/55 dark:text-paper/50">
                                                    <span>{exp.category}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{expWallet.name}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="font-mono font-bold text-base text-ink dark:text-paper">
                                                ₱{window.peso(exp.amount)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteExpense(exp.id)}
                                                aria-label="Delete expense"
                                                className="tap-scale p-2 rounded-xl text-ink2/30 hover:text-rose-600 hover:bg-rose-500/10 dark:text-paper/30 dark:hover:text-rose-400 transition-colors"
                                            >
                                                <ALLOWANCE_ICONS.Trash size={15} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10">
                        <ALLOWANCE_ICONS.Clock size={28} className="mx-auto text-ink2/30 dark:text-paper/30 mb-2" />
                        <p className="text-sm font-semibold text-ink2/70 dark:text-paper/60">No expenses logged yet today</p>
                        <p className="text-xs text-ink2/50 dark:text-paper/40 mt-0.5">Use the quick form above to log micro-spending.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// =========================================================================
// TIPID KALTAS-SAHOD & NET PAY ESTIMATOR (2024-2026 TRAIN LAW & STATUTORY)
// Includes Support for Regular Employees and Government Job Order (JO) / COS
// =========================================================================
window.TipidNetPay = {
    calculate(grossSalary, nonTaxableAllowance = 0, options = {}) {
        if (options && options.employmentType === 'jo') {
            return this.calculateJO(options);
        }

        const gross = Math.max(0, Math.round(Number(grossSalary) * 100) / 100) || 0;
        const nonTax = Math.max(0, Math.round(Number(nonTaxableAllowance) * 100) / 100) || 0;

        if (gross <= 0) {
            return {
                employmentType: 'regular',
                gross: 0, nonTax: 0,
                sssEmployee: 0, sssEmployer: 0, sssTotal: 0,
                philhealthEmployee: 0, philhealthEmployer: 0, philhealthTotal: 0,
                pagibigEmployee: 0, pagibigEmployer: 0, pagibigTotal: 0,
                totalGovEmployee: 0, totalGovEmployer: 0,
                taxableIncome: 0,
                tax: 0,
                totalDeductions: 0,
                netMonthly: 0,
                netSemiMonthly: 0,
                isTaxExempt: true,
                taxBracketLabel: "Walang Sahod",
                deductionPercent: 0
            };
        }

        // 1. SSS (2024-2026 Schedule, RA 11199: 14% total = 4.5% Employee, 9.5% Employer)
        let sssEE = 0, sssER = 0;
        if (gross < 4250) {
            sssEE = 180;
            sssER = 380;
        } else if (gross >= 29750) {
            sssEE = 1350; // 900 regular SSS + 450 WISP
            sssER = 2850; // 1900 regular SSS + 950 WISP
        } else {
            const msc = Math.min(30000, Math.max(4000, Math.round(gross / 500) * 500));
            sssEE = Math.round(msc * 0.045);
            sssER = Math.round(msc * 0.095);
        }
        const sssTotal = sssEE + sssER;

        // 2. PhilHealth (5% total = 2.5% Employee, 2.5% Employer)
        const phCapped = Math.min(100000, Math.max(10000, gross));
        const phEE = Math.round(phCapped * 0.025 * 100) / 100;
        const phER = phEE;
        const phTotal = phEE + phER;

        // 3. Pag-IBIG (Circular 460 - 2% capped at 10,000 max salary)
        let piEE = 0, piER = 0;
        if (gross <= 1500) {
            piEE = Math.round(gross * 0.01 * 100) / 100;
            piER = Math.round(gross * 0.02 * 100) / 100;
        } else {
            const piCapped = Math.min(10000, gross);
            piEE = Math.round(piCapped * 0.02 * 100) / 100; // max 200
            piER = Math.round(piCapped * 0.02 * 100) / 100; // max 200
        }
        const piTotal = piEE + piER;

        // Total Mandatory Gov Deductions
        const totalGovEE = Math.round((sssEE + phEE + piEE) * 100) / 100;
        const totalGovER = Math.round((sssER + phER + piER) * 100) / 100;

        // 4. Taxable Income & Withholding Tax (TRAIN Law 2023 onwards)
        const taxableIncome = Math.max(0, Math.round((gross - totalGovEE - nonTax) * 100) / 100);
        let tax = 0;
        let taxBracketLabel = "";
        let isTaxExempt = false;

        if (taxableIncome <= 20833.33) {
            tax = 0;
            isTaxExempt = true;
            taxBracketLabel = "Tax Exempt (Walang tax under TRAIN Law)";
        } else if (taxableIncome <= 33333.33) {
            tax = (taxableIncome - 20833.33) * 0.15;
            taxBracketLabel = "15% sa lagpas ng ₱20,833.33";
        } else if (taxableIncome <= 66666.67) {
            tax = 1875 + (taxableIncome - 33333.33) * 0.20;
            taxBracketLabel = "₱1,875 + 20% sa lagpas ng ₱33,333.33";
        } else if (taxableIncome <= 166666.67) {
            tax = 8541.67 + (taxableIncome - 66666.67) * 0.25;
            taxBracketLabel = "₱8,541.67 + 25% sa lagpas ng ₱66,666.67";
        } else if (taxableIncome <= 666666.67) {
            tax = 33541.67 + (taxableIncome - 166666.67) * 0.30;
            taxBracketLabel = "₱33,541.67 + 30% sa lagpas ng ₱166,666.67";
        } else {
            tax = 183541.67 + (taxableIncome - 666666.67) * 0.35;
            taxBracketLabel = "₱183,541.67 + 35% sa lagpas ng ₱666,666.67";
        }
        tax = Math.round(tax * 100) / 100;

        const totalDeductions = Math.round((totalGovEE + tax) * 100) / 100;
        const netMonthly = Math.max(0, Math.round((gross - totalDeductions + nonTax) * 100) / 100);
        const netSemiMonthly = Math.round((netMonthly / 2) * 100) / 100;

        return {
            employmentType: 'regular',
            gross, nonTax,
            sssEmployee: sssEE, sssEmployer: sssER, sssTotal,
            philhealthEmployee: phEE, philhealthEmployer: phER, philhealthTotal: phTotal,
            pagibigEmployee: piEE, pagibigEmployer: piER, pagibigTotal: piTotal,
            totalGovEmployee: totalGovEE,
            totalGovEmployer: totalGovER,
            taxableIncome,
            tax,
            totalDeductions,
            netMonthly,
            netSemiMonthly,
            isTaxExempt,
            taxBracketLabel,
            deductionPercent: gross > 0 ? Math.round((totalDeductions / gross) * 1000) / 10 : 0
        };
    },

    calculateJO({
        rateType = 'daily',
        dailyRate = 0,
        daysWorked = 22,
        monthlyRate = 0,
        hasPremium20 = false,
        taxType = 'exempt', // 'exempt' | 'ewt2' | 'ewt3' | 'graduated'
        voluntarySSS = 0,
        voluntaryPhilHealth = 0,
        voluntaryPagIBIG = 0
    } = {}) {
        let baseGross = 0;
        if (rateType === 'daily') {
            const dr = Math.max(0, Number(dailyRate)) || 0;
            const dw = Math.max(0, Number(daysWorked)) || 0;
            baseGross = Math.round(dr * dw * 100) / 100;
        } else {
            baseGross = Math.max(0, Math.round(Number(monthlyRate) * 100) / 100) || 0;
        }

        const premium = hasPremium20 ? Math.round(baseGross * 0.20 * 100) / 100 : 0;
        const gross = Math.round((baseGross + premium) * 100) / 100;

        if (gross <= 0) {
            return {
                employmentType: 'jo',
                rateType,
                dailyRate: Number(dailyRate) || 0,
                daysWorked: Number(daysWorked) || 0,
                monthlyRate: Number(monthlyRate) || 0,
                baseGross: 0,
                premium: 0,
                gross: 0,
                tax: 0,
                taxType,
                taxBracketLabel: 'Walang Sahod',
                isTaxExempt: true,
                voluntarySSS: 0,
                voluntaryPhilHealth: 0,
                voluntaryPagIBIG: 0,
                voluntaryTotal: 0,
                totalGovEmployee: 0,
                totalDeductions: 0,
                netMonthly: 0,
                netSemiMonthly: 0,
                deductionPercent: 0
            };
        }

        const vSSS = Math.max(0, Math.round(Number(voluntarySSS) * 100) / 100) || 0;
        const vPH = Math.max(0, Math.round(Number(voluntaryPhilHealth) * 100) / 100) || 0;
        const vPI = Math.max(0, Math.round(Number(voluntaryPagIBIG) * 100) / 100) || 0;
        const voluntaryTotal = Math.round((vSSS + vPH + vPI) * 100) / 100;

        let tax = 0;
        let taxBracketLabel = '';
        let isTaxExempt = false;

        if (taxType === 'exempt') {
            tax = 0;
            isTaxExempt = true;
            taxBracketLabel = 'Tax Exempt (0% - Annual <= ₱250k na may Sworn Declaration)';
        } else if (taxType === 'ewt2') {
            tax = Math.round(gross * 0.02 * 100) / 100;
            taxBracketLabel = '2% Creditable Withholding Tax (BIR Form 2307)';
        } else if (taxType === 'ewt3') {
            tax = Math.round(gross * 0.03 * 100) / 100;
            taxBracketLabel = '3% Percentage Tax (Creditable)';
        } else if (taxType === 'graduated') {
            const taxable = Math.max(0, gross - voluntaryTotal);
            if (taxable <= 20833.33) {
                tax = 0;
                isTaxExempt = true;
                taxBracketLabel = 'Tax Exempt (TRAIN Law <= ₱20,833.33/buwan)';
            } else if (taxable <= 33333.33) {
                tax = (taxable - 20833.33) * 0.15;
                taxBracketLabel = '15% sa lagpas ng ₱20,833.33';
            } else if (taxable <= 66666.67) {
                tax = 1875 + (taxable - 33333.33) * 0.20;
                taxBracketLabel = '₱1,875 + 20% sa lagpas ng ₱33,333.33';
            } else {
                tax = 8541.67 + (taxable - 66666.67) * 0.25;
                taxBracketLabel = '₱8,541.67 + 25% sa lagpas ng ₱66,666.67';
            }
            tax = Math.round(tax * 100) / 100;
        }

        const totalDeductions = Math.round((tax + voluntaryTotal) * 100) / 100;
        const netMonthly = Math.max(0, Math.round((gross - totalDeductions) * 100) / 100);
        const netSemiMonthly = Math.round((netMonthly / 2) * 100) / 100;

        return {
            employmentType: 'jo',
            rateType,
            dailyRate: Number(dailyRate) || 0,
            daysWorked: Number(daysWorked) || 0,
            monthlyRate: Number(monthlyRate) || 0,
            baseGross,
            premium,
            gross,
            tax,
            taxType,
            taxBracketLabel,
            isTaxExempt,
            voluntarySSS: vSSS,
            voluntaryPhilHealth: vPH,
            voluntaryPagIBIG: vPI,
            voluntaryTotal,
            totalGovEmployee: voluntaryTotal,
            totalDeductions,
            netMonthly,
            netSemiMonthly,
            deductionPercent: gross > 0 ? Math.round((totalDeductions / gross) * 1000) / 10 : 0
        };
    }
};

window.NetPayEstimatorCard = function NetPayEstimatorCard({ onApply, defaultSalary = "" }) {
    // Employment Type: 'regular' | 'jo'
    const [empType, setEmpType] = React.useState('regular');

    // Regular Mode States
    const [grossInput, setGrossInput] = React.useState(defaultSalary ? String(defaultSalary) : "25000");
    const [nonTaxInput, setNonTaxInput] = React.useState("");

    // Job Order (JO) Mode States
    const [joRateType, setJoRateType] = React.useState('daily'); // 'daily' | 'monthly'
    const [joDailyRate, setJoDailyRate] = React.useState("650");
    const [joDaysWorked, setJoDaysWorked] = React.useState("22");
    const [joMonthlyRate, setJoMonthlyRate] = React.useState("18000");
    const [joHasPremium20, setJoHasPremium20] = React.useState(false);
    const [joTaxType, setJoTaxType] = React.useState('exempt'); // 'exempt' | 'ewt2' | 'ewt3' | 'graduated'
    const [joVolSSS, setJoVolSSS] = React.useState("");
    const [joVolPH, setJoVolPH] = React.useState("");
    const [joVolPI, setJoVolPI] = React.useState("");

    // UI View Toggles
    const [showBreakdown, setShowBreakdown] = React.useState(false);
    const [showDeMinimis, setShowDeMinimis] = React.useState(false);
    const [showVoluntary, setShowVoluntary] = React.useState(false);
    const [appliedMessage, setAppliedMessage] = React.useState(null);

    const REGULAR_PRESETS = [
        { label: "₱18k Min", value: 18000 },
        { label: "₱25k Junior", value: 25000 },
        { label: "₱35k Mid", value: 35000 },
        { label: "₱50k Senior", value: 50000 },
        { label: "₱75k Lead", value: 75000 }
    ];

    const JO_DAILY_PRESETS = [
        { label: "₱550 / day", value: 550 },
        { label: "₱650 / day", value: 650 },
        { label: "₱750 / day", value: 750 },
        { label: "₱850 / day", value: 850 },
        { label: "₱1,000 / day", value: 1000 }
    ];

    const JO_MONTHLY_PRESETS = [
        { label: "₱15k SG-1", value: 15000 },
        { label: "₱18k SG-3", value: 18000 },
        { label: "₱22k SG-6", value: 22000 },
        { label: "₱27k SG-11", value: 27000 },
        { label: "₱35k Tech", value: 35000 }
    ];

    const result = React.useMemo(() => {
        if (empType === 'jo') {
            return window.TipidNetPay.calculateJO({
                rateType: joRateType,
                dailyRate: joDailyRate,
                daysWorked: joDaysWorked,
                monthlyRate: joMonthlyRate,
                hasPremium20: joHasPremium20,
                taxType: joTaxType,
                voluntarySSS: joVolSSS,
                voluntaryPhilHealth: joVolPH,
                voluntaryPagIBIG: joVolPI
            });
        }
        return window.TipidNetPay.calculate(grossInput, nonTaxInput);
    }, [
        empType, grossInput, nonTaxInput,
        joRateType, joDailyRate, joDaysWorked, joMonthlyRate, joHasPremium20,
        joTaxType, joVolSSS, joVolPH, joVolPI
    ]);

    const handleApplyPay = (amount, mode) => {
        if (!amount || amount <= 0) return;
        if (typeof onApply === "function") {
            onApply(amount, mode);
        } else {
            window.dispatchEvent(new CustomEvent("tipid-apply-netpay", { detail: { amount, mode } }));
        }
        setAppliedMessage(mode === 'semi' ? 'Nai-apply ang Sahod bawat Cutoff!' : 'Nai-apply ang Buong Buwan sa Badyet!');
        if (window.TipidCelebration) {
            window.TipidCelebration.playChime();
        }
        setTimeout(() => setAppliedMessage(null), 3500);
    };

    return (
        <div className="bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios p-5 sm:p-7 relative overflow-hidden transition-all">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-pesoLight to-teal-500" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="16" height="20" x="4" y="2" rx="2"/>
                            <line x1="8" x2="16" y1="6" y2="6"/>
                            <line x1="16" x2="16" y1="14" y2="18"/>
                            <path d="M16 10h.01"/>
                            <path d="M12 10h.01"/>
                            <path d="M8 10h.01"/>
                            <path d="M12 14h.01"/>
                            <path d="M8 14h.01"/>
                            <path d="M12 18h.01"/>
                            <path d="M8 18h.01"/>
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-display text-[1.15rem] sm:text-[1.25rem] font-bold text-ink dark:text-paper leading-tight">
                                Kaltas-Sahod & Net Pay Estimator
                            </h3>
                        </div>
                        <p className="text-[11.5px] sm:text-[12px] text-ink2/60 dark:text-paper/50 mt-0.5">
                            {empType === 'jo'
                                ? "Kalkulahin ang take-home pay ng Job Order (JO) / COS sa gobyerno."
                                : "Kalkulahin ang SSS, PhilHealth, Pag-IBIG at BIR Tax (TRAIN Law) bago mag-badyet."}
                        </p>
                    </div>
                </div>

                <div className="self-start sm:self-auto shrink-0 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {empType === 'jo' ? "CSC-DBM & BIR 2307" : "2024–2026 Tables"}
                    </span>
                </div>
            </div>

            {/* Employment Type Selector (Pill Switch) */}
            <div className="mb-5">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink2/70 dark:text-paper/60 pl-1 mb-2">
                    Uri ng Empleo (Employment Type)
                </label>
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/10 w-full sm:w-fit border border-black/5 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => setEmpType('regular')}
                        className={"flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all " + (
                            empType === 'regular'
                                ? "bg-white dark:bg-ink text-peso dark:text-pesoLight shadow-sm"
                                : "text-ink2/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper"
                        )}
                    >
                        <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg><span>Regular / Private Employee</span></span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setEmpType('jo')}
                        className={"flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all " + (
                            empType === 'jo'
                                ? "bg-white dark:bg-ink text-peso dark:text-pesoLight shadow-sm"
                                : "text-ink2/70 dark:text-paper/70 hover:text-ink dark:hover:text-paper"
                        )}
                    >
                        <span className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="2" x2="22" y1="2" y2="2"/><line x1="12" x2="12" y1="6" y2="18"/><line x1="6" x2="6" y1="6" y2="18"/><line x1="18" x2="18" y1="6" y2="18"/><polygon points="12 2 20 7 4 7"/><line x1="2" x2="22" y1="18" y2="18"/><line x1="2" x2="22" y1="22" y2="22"/></svg><span>Job Order (JO) / COS (Government)</span></span>
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* 1. REGULAR EMPLOYEE FORM                                  */}
            {/* ========================================================= */}
            {empType === 'regular' && (
                <div className="space-y-3.5 mb-6 animate-[fadeIn_0.2s_ease-out]">
                    <div>
                        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink2/70 dark:text-paper/60 pl-1 mb-1.5">
                            Gross Monthly Basic Salary (₱)
                        </label>
                        <div className="flex items-center gap-2 bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all shadow-inner">
                            <span className="text-xl font-mono font-bold text-peso dark:text-pesoLight select-none">₱</span>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                value={grossInput}
                                onChange={(e) => setGrossInput(e.target.value)}
                                placeholder="e.g. 25000"
                                className="w-full bg-transparent py-2.5 text-lg sm:text-xl font-mono font-bold text-ink dark:text-paper focus:outline-none placeholder:text-ink2/30"
                            />
                            {grossInput && (
                                <button
                                    type="button"
                                    onClick={() => setGrossInput("")}
                                    className="text-ink2/40 hover:text-ink dark:text-paper/40 dark:hover:text-paper p-1"
                                    title="Clear"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-ink2/50 dark:text-paper/40 mr-1">Presets:</span>
                        {REGULAR_PRESETS.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setGrossInput(String(p.value))}
                                className={"text-[11.5px] font-bold px-2.5 py-1 rounded-xl transition-all active:scale-95 border " + (
                                    Number(grossInput) === p.value
                                        ? "bg-peso text-white border-peso shadow-xs"
                                        : "bg-black/[0.03] dark:bg-white/[0.05] text-ink2 dark:text-paper/70 border-black/5 dark:border-white/10 hover:bg-black/[0.06]"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Optional De Minimis / Non-taxable Toggle */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowDeMinimis(!showDeMinimis)}
                            className="text-[11.5px] font-bold text-peso dark:text-pesoLight hover:underline flex items-center gap-1 focus:outline-none"
                        >
                            <span>{showDeMinimis ? "− Itago ang Non-taxable Allowances" : "+ Magdagdag ng De Minimis / Non-taxable Allowance (Optional)"}</span>
                        </button>
                        {showDeMinimis && (
                            <div className="mt-2 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-line/60 dark:border-white/10 flex items-center gap-2">
                                <span className="text-xs text-ink2/70 dark:text-paper/60 shrink-0">De Minimis (Rice, Transpo): ₱</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={nonTaxInput}
                                    onChange={(e) => setNonTaxInput(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-transparent text-sm font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* 2. JOB ORDER (JO) / COS FORM                              */}
            {/* ========================================================= */}
            {empType === 'jo' && (
                <div className="space-y-4 mb-6 animate-[fadeIn_0.2s_ease-out]">
                    {/* JO Info Notice */}
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        <div>
                            <span className="font-bold">Para sa Job Order / Contract of Service:</span> Walang GSIS o mandatory SSS/PhilHealth kaltas ang ahensya ng gobyerno. Karaniwang buo ang sahod mo o may 2%–3% BIR Form 2307 Withholding Tax.
                        </div>
                    </div>

                    {/* Rate Mode: Daily (Arawan) vs Monthly Contract */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink2/70 dark:text-paper/60">
                                Paraan ng Sahod:
                            </span>
                            <div className="inline-flex rounded-xl bg-black/5 dark:bg-white/10 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setJoRateType('daily')}
                                    className={"px-3 py-1 rounded-lg text-xs font-bold transition-all " + (
                                        joRateType === 'daily'
                                            ? "bg-white dark:bg-ink text-peso dark:text-pesoLight shadow-xs"
                                            : "text-ink2/60 dark:text-paper/60"
                                    )}
                                >
                                    <span className="inline-flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><circle cx="12" cy="15" r="2"/></svg><span>Arawan (Daily Rate)</span></span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setJoRateType('monthly')}
                                    className={"px-3 py-1 rounded-lg text-xs font-bold transition-all " + (
                                        joRateType === 'monthly'
                                            ? "bg-white dark:bg-ink text-peso dark:text-pesoLight shadow-xs"
                                            : "text-ink2/60 dark:text-paper/60"
                                    )}
                                >
                                    <span className="inline-flex items-center gap-1.5"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg><span>Buwanang Kontrata</span></span>
                                </button>
                            </div>
                        </div>

                        {/* Daily Inputs */}
                        {joRateType === 'daily' ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink2/70 dark:text-paper/60 pl-1 mb-1">
                                            Daily Rate (₱ / araw)
                                        </label>
                                        <div className="flex items-center gap-2 bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-2xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all shadow-inner">
                                            <span className="text-lg font-mono font-bold text-peso dark:text-pesoLight select-none">₱</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={joDailyRate}
                                                onChange={(e) => setJoDailyRate(e.target.value)}
                                                placeholder="e.g. 650"
                                                className="w-full bg-transparent py-2 text-base sm:text-lg font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink2/70 dark:text-paper/60 pl-1 mb-1">
                                            Araw na Pinasukan (Days Worked)
                                        </label>
                                        <div className="flex items-center gap-2 bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-2xl px-3.5 py-1.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all shadow-inner">
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={joDaysWorked}
                                                onChange={(e) => setJoDaysWorked(e.target.value)}
                                                placeholder="22"
                                                className="w-full bg-transparent py-2 text-base sm:text-lg font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                            />
                                            <span className="text-xs font-mono font-bold text-ink2/50 dark:text-paper/40 select-none pr-1">araw</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Presets */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-semibold text-ink2/50 dark:text-paper/40 mr-1">Daily Presets:</span>
                                    {JO_DAILY_PRESETS.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setJoDailyRate(String(p.value))}
                                            className={"text-[11px] font-bold px-2 py-0.5 rounded-xl border transition-all " + (
                                                Number(joDailyRate) === p.value
                                                    ? "bg-peso text-white border-peso shadow-xs"
                                                    : "bg-black/[0.03] dark:bg-white/[0.05] text-ink2 dark:text-paper/70 border-black/5 dark:border-white/10 hover:bg-black/[0.06]"
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Monthly Contract Inputs */
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink2/70 dark:text-paper/60 pl-1 mb-1">
                                        Buwanang Kontrata / Rate (₱)
                                    </label>
                                    <div className="flex items-center gap-2 bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all shadow-inner">
                                        <span className="text-lg font-mono font-bold text-peso dark:text-pesoLight select-none">₱</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={joMonthlyRate}
                                            onChange={(e) => setJoMonthlyRate(e.target.value)}
                                            placeholder="e.g. 20000"
                                            className="w-full bg-transparent py-2.5 text-base sm:text-lg font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Monthly Presets */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[11px] font-semibold text-ink2/50 dark:text-paper/40 mr-1">SG Presets:</span>
                                    {JO_MONTHLY_PRESETS.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            onClick={() => setJoMonthlyRate(String(p.value))}
                                            className={"text-[11px] font-bold px-2 py-0.5 rounded-xl border transition-all " + (
                                                Number(joMonthlyRate) === p.value
                                                    ? "bg-peso text-white border-peso shadow-xs"
                                                    : "bg-black/[0.03] dark:bg-white/[0.05] text-ink2 dark:text-paper/70 border-black/5 dark:border-white/10 hover:bg-black/[0.06]"
                                            )}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 20% Premium Toggle (CSC-COA-DBM Joint Circular) */}
                    <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
                        <div>
                            <span className="text-xs font-bold text-ink dark:text-paper block leading-tight">
                                +20% JO Premium (CSC-COA-DBM)
                            </span>
                            <span className="text-[11px] text-ink2/60 dark:text-paper/50">
                                Dagdag 20% sa base pay kapalit ng 13th month & leave benefits.
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setJoHasPremium20(!joHasPremium20)}
                            className={"relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none " + (
                                joHasPremium20 ? "bg-peso" : "bg-black/20 dark:bg-white/20"
                            )}
                        >
                            <span className={"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out " + (
                                joHasPremium20 ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* BIR Withholding Tax Selection */}
                    <div>
                        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink2/70 dark:text-paper/60 pl-1 mb-1.5">
                            Kaltas sa Tax ng Ahensya (BIR Withholding)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'exempt', label: '0% Tax Exempt', desc: '≤ ₱250k/yr Sworn' },
                                { id: 'ewt2', label: '2% Form 2307', desc: 'Creditable Tax' },
                                { id: 'ewt3', label: '3% Percentage', desc: 'Service Tax' },
                                { id: 'graduated', label: 'TRAIN Law', desc: 'Graduated Tax' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setJoTaxType(t.id)}
                                    className={"p-2.5 rounded-xl border text-left transition-all active:scale-95 " + (
                                        joTaxType === t.id
                                            ? "bg-peso/10 dark:bg-pesoLight/15 border-peso text-peso dark:text-pesoLight ring-1 ring-peso"
                                            : "bg-white/60 dark:bg-ink2/40 border-black/10 dark:border-white/10 text-ink dark:text-paper hover:bg-black/5"
                                    )}
                                >
                                    <span className="block text-xs font-bold leading-tight">{t.label}</span>
                                    <span className="block text-[10px] text-ink2/60 dark:text-paper/50 mt-0.5">{t.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Optional Voluntary Contributions Toggle */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowVoluntary(!showVoluntary)}
                            className="text-[11.5px] font-bold text-peso dark:text-pesoLight hover:underline flex items-center gap-1 focus:outline-none"
                        >
                            <span>{showVoluntary ? "− Itago ang Sariling Hulog sa SSS / PhilHealth / Pag-IBIG" : "+ Naghuhulog ka ba sa sarili mong SSS, PhilHealth, o Pag-IBIG? (Optional)"}</span>
                        </button>

                        {showVoluntary && (
                            <div className="mt-2.5 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-line/60 dark:border-white/10 space-y-2.5">
                                <p className="text-[11px] text-ink2/60 dark:text-paper/50">
                                    I-type ang halaga kung ikaw ay nagbabayad buwan-buwan bilang Voluntary / Self-Employed member para awtomatiko itong ibawas sa iyong take-home budget:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="block text-[10.5px] font-bold text-ink2/70 dark:text-paper/60 mb-1">Voluntary SSS (₱):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 560"
                                            value={joVolSSS}
                                            onChange={(e) => setJoVolSSS(e.target.value)}
                                            className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10.5px] font-bold text-ink2/70 dark:text-paper/60 mb-1">PhilHealth (₱):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 500"
                                            value={joVolPH}
                                            onChange={(e) => setJoVolPH(e.target.value)}
                                            className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10.5px] font-bold text-ink2/70 dark:text-paper/60 mb-1">Pag-IBIG (₱):</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="e.g. 200"
                                            value={joVolPI}
                                            onChange={(e) => setJoVolPI(e.target.value)}
                                            className="w-full bg-white dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-ink dark:text-paper focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* HERO RESULTS CARDS (ADAPTIVE FOR BOTH REGULAR & JO)       */}
            {/* ========================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                {/* 1. Bawat Sahod (Cutoff) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-peso/10 to-transparent border border-emerald-500/25 dark:border-emerald-400/20 relative overflow-hidden">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Bawat Sahod (Kinsenas)
                    </span>
                    <p className="font-display text-2xl sm:text-[1.75rem] font-bold text-emerald-700 dark:text-emerald-300 mt-1 tracking-tight">
                        ₱{window.peso ? window.peso(result.netSemiMonthly) : result.netSemiMonthly.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-900/60 dark:text-emerald-200/60 mt-0.5">
                        Tinatayang pumapasok kada cutoff (15th / 30th)
                    </p>
                </div>

                {/* 2. Buwanang Take-Home Pay */}
                <div className="p-4 sm:p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink2/60 dark:text-paper/60">
                        Buwanang Net Pay
                    </span>
                    <p className="font-display text-2xl sm:text-[1.75rem] font-bold text-ink dark:text-paper mt-1 tracking-tight">
                        ₱{window.peso ? window.peso(result.netMonthly) : result.netMonthly.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] font-medium text-ink2/50 dark:text-paper/40 mt-0.5">
                        {empType === 'jo' ? "Kabuuang sahod matapos ang tax at voluntary" : "Kabuuang take-home matapos ang kaltas"}
                    </p>
                </div>

                {/* 3. Kabuuang Kaltas */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-400/10 border border-rose-500/20 dark:border-rose-400/20">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                            Kabuuang Kaltas
                        </span>
                        <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300">
                            {result.deductionPercent}%
                        </span>
                    </div>
                    <p className="font-display text-2xl sm:text-[1.75rem] font-bold text-rose-600 dark:text-rose-300 mt-1 tracking-tight">
                        -₱{window.peso ? window.peso(result.totalDeductions) : result.totalDeductions.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] font-medium text-rose-900/60 dark:text-rose-200/60 mt-0.5 truncate">
                        {empType === 'jo'
                            ? ("Tax: ₱" + (window.peso ? window.peso(result.tax) : result.tax.toFixed(2)) + " • Voluntary: ₱" + (window.peso ? window.peso(result.voluntaryTotal || 0) : (result.voluntaryTotal || 0).toFixed(2)))
                            : ("Gov: ₱" + (window.peso ? window.peso(result.totalGovEmployee) : result.totalGovEmployee.toFixed(2)) + " • Tax: ₱" + (window.peso ? window.peso(result.tax) : result.tax.toFixed(2)))}
                    </p>
                </div>
            </div>

            {/* Expandable Breakdown Accordion */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 hover:bg-black/[0.04] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-peso dark:text-pesoLight">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg>
                        </span>
                        <span className="text-xs font-bold text-ink dark:text-paper">
                            {showBreakdown ? "Itago ang Itemized Kaltas Breakdown" : "Ipakita ang Itemized Kaltas & Breakdown Details"}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-peso dark:text-pesoLight">
                        <span className="inline-flex items-center gap-1"><span>{showBreakdown ? "Itago" : "Tingnan"}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={"transition-transform duration-200 " + (showBreakdown ? "rotate-180" : "")}><polyline points="6 9 12 15 18 9"/></svg></span>
                    </span>
                </button>

                {showBreakdown && (
                    <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-paperDim/50 dark:bg-black/20 border border-black/5 dark:border-white/10 animate-[fadeIn_0.25s_ease-out]">
                        {empType === 'regular' ? (
                            <React.Fragment>
                                {/* SSS */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-ink2/60 border border-line/60 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-paper flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" /> SSS Contribution
                                        </span>
                                        <span className="font-mono font-bold text-xs text-ink dark:text-paper">
                                            ₱{result.sssEmployee.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-ink2/60 dark:text-paper/50 flex justify-between">
                                        <span>Employer Share:</span>
                                        <span>₱{result.sssEmployer.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[10px] text-ink2/40 dark:text-paper/40 mt-1">
                                        {Number(grossInput) > 20000 ? "May regular SSS at WISP Mandatory Savings" : "Regular SSS Contribution (RA 11199)"}
                                    </div>
                                </div>

                                {/* PhilHealth */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-ink2/60 border border-line/60 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-paper flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> PhilHealth Premium
                                        </span>
                                        <span className="font-mono font-bold text-xs text-ink dark:text-paper">
                                            ₱{result.philhealthEmployee.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-ink2/60 dark:text-paper/50 flex justify-between">
                                        <span>Employer Share (2.5%):</span>
                                        <span>₱{result.philhealthEmployer.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[10px] text-ink2/40 dark:text-paper/40 mt-1">
                                        5% Total Premium (2.5% Employee share, 2024-2026)
                                    </div>
                                </div>

                                {/* Pag-IBIG */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-ink2/60 border border-line/60 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-paper flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-500" /> Pag-IBIG (HDMF)
                                        </span>
                                        <span className="font-mono font-bold text-xs text-ink dark:text-paper">
                                            ₱{result.pagibigEmployee.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-ink2/60 dark:text-paper/50 flex justify-between">
                                        <span>Employer Share:</span>
                                        <span>₱{result.pagibigEmployer.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[10px] text-ink2/40 dark:text-paper/40 mt-1">
                                        Circular No. 460 (Max cap: ₱10,000 salary)
                                    </div>
                                </div>

                                {/* BIR Tax */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-ink2/60 border border-line/60 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-paper flex items-center gap-1.5">
                                            <span className={"w-2 h-2 rounded-full " + (result.isTaxExempt ? "bg-emerald-500" : "bg-purple-500")} />
                                            BIR Withholding Tax
                                        </span>
                                        <span className={"font-mono font-bold text-xs " + (result.isTaxExempt ? "text-emerald-600 dark:text-emerald-400" : "text-ink dark:text-paper")}>
                                            {result.isTaxExempt ? "₱0 (EXEMPT)" : "₱" + result.tax.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-ink2/60 dark:text-paper/50 flex justify-between">
                                        <span>Taxable Income:</span>
                                        <span>₱{result.taxableIncome.toFixed(2)}</span>
                                    </div>
                                    <div className="text-[10px] text-ink2/40 dark:text-paper/40 mt-1">
                                        {result.taxBracketLabel}
                                    </div>
                                </div>
                            </React.Fragment>
                        ) : (
                            /* JO Breakdown Cards */
                            <React.Fragment>
                                {/* Gross Pay Breakdown */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-ink2/60 border border-line/60 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-paper">Base Gross Salary</span>
                                        <span className="font-mono font-bold text-xs text-ink dark:text-paper">₱{result.baseGross.toFixed(2)}</span>
                                    </div>
                                    {result.premium > 0 && (
                                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 flex justify-between font-semibold mt-1">
                                            <span>+20% Premium:</span>
                                            <span>+₱{result.premium.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="text-[10px] text-ink2/50 dark:text-paper/40 mt-1">
                                        {result.rateType === 'daily'
                                            ? ("₱" + result.dailyRate + " × " + result.daysWorked + " araw")
                                            : "Fixed Monthly Rate"}
                                    </div>
                                </div>

                                {/* BIR Tax Deduction */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-ink2/60 border border-line/60 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-paper">BIR Tax Withholding</span>
                                        <span className={"font-mono font-bold text-xs " + (result.tax === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                            {result.tax === 0 ? "₱0 (EXEMPT)" : "-₱" + result.tax.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-ink2/50 dark:text-paper/40 mt-1">
                                        {result.taxBracketLabel}
                                    </div>
                                </div>

                                {/* Voluntary SSS / PhilHealth / PagIBIG */}
                                <div className="p-3.5 rounded-xl bg-white dark:bg-ink2/60 border border-line/60 dark:border-white/10 sm:col-span-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-ink dark:text-paper">Sariling Hulog (Voluntary Contributions)</span>
                                        <span className="font-mono font-bold text-xs text-ink dark:text-paper">
                                            ₱{result.voluntaryTotal.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-[11px] text-ink2/60 dark:text-paper/50 mt-1">
                                        <div>SSS: ₱{result.voluntarySSS.toFixed(2)}</div>
                                        <div>PhilHealth: ₱{result.voluntaryPhilHealth.toFixed(2)}</div>
                                        <div>Pag-IBIG: ₱{result.voluntaryPagIBIG.toFixed(2)}</div>
                                    </div>
                                    <div className="text-[10px] text-ink2/40 dark:text-paper/40 mt-1.5">
                                        *Ito ay sariling hulog mo sa opisina ng SSS/PhilHealth/Pag-IBIG, hindi kinakaltas ng ahensya.
                                    </div>
                                </div>
                            </React.Fragment>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons to Apply to Budget */}
            <div className="pt-2 border-t border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                    type="button"
                    onClick={() => handleApplyPay(result.netSemiMonthly, "semi")}
                    className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-pesoLight to-peso text-white hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span>I-apply ang Bawat Sahod (₱{window.peso ? window.peso(result.netSemiMonthly) : result.netSemiMonthly.toFixed(2)}) sa Badyet</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleApplyPay(result.netMonthly, "monthly")}
                    className="w-full sm:w-auto px-4 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-black/5 dark:bg-white/10 text-ink dark:text-paper hover:bg-black/10 dark:hover:bg-white/15 active:scale-98 transition-all"
                >
                    I-apply ang Buwanan (₱{window.peso ? window.peso(result.netMonthly) : result.netMonthly.toFixed(2)})
                </button>
            </div>

            {/* Feedback notification toast */}
            {appliedMessage && (
                <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{appliedMessage} Awtomatikong na-update ang Allowance & Daily Pacing mo sa ibaba!</span>
                </div>
            )}
        </div>
    );
};
