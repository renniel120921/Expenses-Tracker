// Hoisted outside the component: these only depend on props, never on component
// state. Defining them inside the component body would recreate a new function
// reference every render, which makes React treat them as a different component
// type on each keystroke — unmounting and remounting the underlying <input>, so
// it loses focus after every character. Keeping them here fixes that.
const FieldWrap = ({ icon, children, className = "" }) => (
    <div className={`flex items-center gap-3 bg-white/50 dark:bg-black/20 ring-1 ring-black/10 dark:ring-white/10 rounded-xl px-4 shadow-sm focus-within:ring-2 focus-within:ring-peso/50 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 ${className}`}>
        {icon}
        {children}
    </div>
);

const StatChip = ({ label, value, accent }) => (
    <div className="flex-1 min-w-[7.5rem] max-w-full bento-card rounded-2xl p-4 shadow-sm border border-black/5 dark:border-white/5 min-w-0">
        <p className="text-[9px] font-mono uppercase font-bold tracking-widest text-ink2/50 dark:text-paper/40 mb-1">{label}</p>
        <p className={`font-mono text-[15px] sm:text-[16px] font-bold tracking-tight truncate ${accent || "text-ink dark:text-paper"}`} title={value}>{value}</p>
    </div>
);

const ReceiptRow = ({ label, value, valueClass = "" }) => (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-dashed border-ink/15 dark:border-paper/15 last:border-b-0">
        <span className="text-[12px] text-ink2/70 dark:text-paper/60 leading-snug">{label}</span>
        <span className={`font-mono text-[13px] font-bold text-right shrink-0 ${valueClass || "text-ink dark:text-paper"}`}>{value}</span>
    </div>
);

// Same bank/e-wallet catalog used on the dashboard and the Hulugan tracker —
// duplicated here (rather than assuming window.SUPPORTED_WALLETS already
// exists) because this page can be opened on its own without dashboard.html
// ever having loaded its inline script.
const WALLET_META = window.SUPPORTED_WALLETS || [
    { id: "Cash", name: "Cash", type: "cash", color: "from-[#1F6F54] to-[#123D2E]", text: "CASH", font: "font-display tracking-[0.15em]", textStyle: "text-white" },
    { id: "GCash", name: "GCash", type: "ewallet", color: "from-[#0052FE] to-[#004ADB]", text: "GCash", font: "font-sans italic font-extrabold tracking-tighter", textStyle: "text-white" },
    { id: "Maya", name: "Maya", type: "ewallet", color: "from-[#0A0A0A] via-[#171717] to-[#242424]", text: "maya", font: "font-sans font-black tracking-widest lowercase", textStyle: "text-white" },
    { id: "ShopeePay", name: "ShopeePay", type: "ewallet", color: "from-[#EE4D2D] to-[#D8390F]", text: "ShopeePay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "GrabPay", name: "GrabPay", type: "ewallet", color: "from-[#00B14F] to-[#009344]", text: "GrabPay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "Atome", name: "Atome Card", type: "credit", color: "from-[#FFDE00] to-[#D4B300]", text: "atome", font: "font-sans font-black lowercase tracking-widest", textStyle: "text-[#111]" },
    { id: "MariBank", name: "MariBank", type: "digital", color: "from-[#EE4D2D] to-[#D8390F]", text: "MariBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "SeaBank", name: "SeaBank", type: "digital", color: "from-[#FF6E00] to-[#E65A00]", text: "SeaBank", font: "font-sans font-bold", textStyle: "text-white" },
    { id: "GoTyme", name: "GoTyme Bank", type: "digital", color: "from-[#0052FF] to-[#00238A]", text: "GoTyme", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "Tonik", name: "Tonik Bank", type: "digital", color: "from-[#FF4D85] to-[#E6004F]", text: "tonik", font: "font-sans font-black lowercase tracking-tight", textStyle: "text-white" },
    { id: "UNO", name: "UNO Digital Bank", type: "digital", color: "from-[#E63946] to-[#8E0000]", text: "UNO", font: "font-sans font-black tracking-[0.2em] uppercase", textStyle: "text-white" },
    { id: "UnionDigital", name: "UnionDigital Bank", type: "digital", color: "from-[#FF6B00] to-[#C24700]", text: "UnionDigital", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "CIMB", name: "CIMB Bank", type: "digital", color: "from-[#E3000F] to-[#8E0000]", text: "CIMB", font: "font-sans font-black tracking-widest", textStyle: "text-white" },
    { id: "DiskarTech", name: "DiskarTech", type: "ewallet", color: "from-[#00A5E3] to-[#0067C7]", text: "DiskarTech", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "BDO", name: "BDO Unibank", type: "bank", color: "from-[#002A86] to-[#00133D]", text: "BDO", font: "font-sans font-black tracking-[0.15em]", textStyle: "text-white" },
    { id: "BPI", name: "BPI", type: "bank", color: "from-[#B30000] to-[#5C0000]", text: "BPI", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "Metrobank", name: "Metrobank", type: "bank", color: "from-[#0033A0] to-[#001444]", text: "Metrobank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "PNB", name: "PNB", type: "bank", color: "from-[#004A99] to-[#001D44]", text: "PNB", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "SecurityBank", name: "Security Bank", type: "bank", color: "from-[#005EB8] to-[#002C56]", text: "SecurityBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "UnionBank", name: "UnionBank", type: "bank", color: "from-[#EA5B0C] to-[#8A2E00]", text: "UnionBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "RCBC", name: "RCBC", type: "bank", color: "from-[#003DA5] to-[#001444]", text: "RCBC", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "ChinaBank", name: "China Bank", type: "bank", color: "from-[#C8102E] to-[#6E0000]", text: "China Bank", font: "font-serif font-bold", textStyle: "text-white" },
    { id: "EastWest", name: "EastWest Bank", type: "bank", color: "from-[#4B145E] to-[#1F0527]", text: "EastWest", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "LandBank", name: "Land Bank", type: "bank", color: "from-[#005B33] to-[#00281A]", text: "LANDBANK", font: "font-sans font-black tracking-tight", textStyle: "text-white" },
    { id: "PayPal", name: "PayPal", type: "ewallet", color: "from-[#003087] to-[#0067B4]", text: "PayPal", font: "font-sans italic font-bold tracking-tight", textStyle: "text-white" },
];

function walletMeta(id) {
    return WALLET_META.find(w => w.id === id) || { id, name: id, type: "bank", text: id, font: "font-sans font-bold tracking-tight", textStyle: "text-white", color: "from-ink2 to-ink" };
}

// A small, realistic-looking mini "card" for picking which wallet pays for a
// logged expense — same brand colors/typography as the real card on the
// dashboard, shrunk down into a tappable chip.
const MiniWalletChip = ({ id, meta, active, onClick }) => {
    const showChip = meta.type === "bank" || meta.type === "credit";
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`relative shrink-0 w-[6.5rem] h-[3.75rem] rounded-[12px] bg-gradient-to-br ${meta.color} p-2.5 flex flex-col justify-between overflow-hidden text-left transition-all duration-200 ${
                active ? 'ring-2 ring-peso ring-offset-2 ring-offset-white dark:ring-offset-ink2 shadow-md scale-[1.02]' : 'ring-1 ring-black/5 dark:ring-white/10 opacity-75 hover:opacity-100 shadow-sm'
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

window.AllowanceCalculator = function AllowanceCalculator({ user, entries: entriesProp, loading: entriesLoading }) {
    const { useState, useEffect, useRef, useMemo } = React;

    const uid = user?.uid || window.TipidAuth?.currentUser?.uid || null;
    const entries = entriesProp || [];

    const CATEGORIES = window.CATEGORIES || ["Pagkain", "Pamasahe", "Bills", "Load", "Ipon", "Project Components", "Iba pa"];

    const CATEGORY_META = {
        "Pagkain": { color: "#D4AF37", bg: "#FDF6E3", dark: "rgba(212,175,55,0.15)", icon: <path d="M7 2v6a2 2 0 0 0 2 2v10M7 2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2m0-8v8m10-8c-2.2 0-4 2.1-4 5.5S14.8 15 17 15v7" /> },
        "Pamasahe": { color: "#2E7DC9", bg: "#E8F1FB", dark: "rgba(46,125,201,0.15)", icon: <><path d="M4 16V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" /><path d="M4 16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" /><circle cx="8" cy="19" r="1.4" /><circle cx="16" cy="19" r="1.4" /></> },
        "Bills": { color: "#D64045", bg: "#FAEDE9", dark: "rgba(214,64,69,0.15)", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></> },
        "Load": { color: "#7C5CBF", bg: "#F1ECFB", dark: "rgba(124,92,191,0.15)", icon: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></> },
        "Ipon": { color: "#1F6F54", bg: "#E6F3EF", dark: "rgba(31,111,84,0.15)", icon: <><path d="M19 9V6a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1v3.4a1 1 0 0 0 .6.92l1.9.82" /><path d="M3 9h14a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-1" /><path d="M3 9v10a1 1 0 0 0 1 1h3v-4" /><path d="M13 9v12" /></> },
        "Project Components": { color: "#4A5568", bg: "#EEF1F4", dark: "rgba(74,85,104,0.15)", icon: <><path d="m21 16-9 5-9-5V8l9-5 9 5Z" /><path d="M12 21v-8" /><path d="m21 8-9 5-9-5" /></> }
    };
    const DEFAULT_META = { color: "#6B7280", bg: "#EEF0F2", dark: "rgba(107,114,128,0.15)", icon: <><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></> };
    const getCategoryMeta = (cat) => CATEGORY_META[cat] || DEFAULT_META;

    const [salary, setSalary] = useState("");
    const [bills, setBills] = useState("");
    const [savings, setSavings] = useState("");
    const [paydayDate, setPaydayDate] = useState("");

    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const saveTimer = useRef(null);

    const [editOpen, setEditOpen] = useState(false);
    const autoOpenedRef = useRef(false);

    const [dataReady, setDataReady] = useState(!!window.TipidData);
    const [expAmount, setExpAmount] = useState("");
    const [expNote, setExpNote] = useState("");
    const [expCategory, setExpCategory] = useState(CATEGORIES[CATEGORIES.length - 1] || "Iba pa");
    const [loggingExpense, setLoggingExpense] = useState(false);

    // The user's actual configured wallets/cards — same "wallets" map the
    // dashboard reads from and writes to. Letting the user pick one here
    // (instead of always logging as "Cash") means the expense entry carries
    // the real method, so that wallet's balance on the dashboard reflects it
    // automatically — no separate deduction logic needed, it's the same
    // entries collection the dashboard already sums up per method.
    const [baseBalances, setBaseBalances] = useState({ Cash: 0 });
    const [expMethod, setExpMethod] = useState("Cash");

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
            } catch (err) {
                // Keep the Cash-only fallback — this field is a convenience,
                // the rest of the tracker doesn't depend on it.
            }
        })();
        return () => { cancelled = true; };
    }, [uid]);

    const walletIds = useMemo(() => Object.keys(baseBalances), [baseBalances]);

    // Running balance per wallet: base balance (set on the dashboard) plus
    // every income/expense entry tagged with that method, exactly like the
    // dashboard computes it — so what the user sees here always matches
    // what they'd see there.
    const walletBalances = useMemo(() => {
        const balances = {};
        Object.keys(baseBalances).forEach(k => balances[k] = parseFloat(baseBalances[k]) || 0);
        entries.forEach(e => {
            const m = e.method || "Cash";
            const amt = parseFloat(e.amount) || 0;
            if (balances[m] === undefined) balances[m] = 0;
            if (e.type === "income") balances[m] += amt;
            else balances[m] -= amt;
        });
        return balances;
    }, [entries, baseBalances]);

    useEffect(() => {
        if (!walletIds.includes(expMethod)) setExpMethod(walletIds[0] || "Cash");
    }, [walletIds]);

    const [dismissedBanner, setDismissedBanner] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [notifEnabled, setNotifEnabled] = useState(false);
    const notifiedFlags = useRef({ danger: false, warning: false, payday: false });

    const todayKey = (d = new Date()) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const entryToDate = (entry) => {
        const raw = entry.createdAt;
        if (raw && typeof raw.toDate === "function") return raw.toDate();
        if (raw) return new Date(raw);
        return new Date();
    };

    const pushToast = (message, tone = "success") => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, tone }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const notifyBrowser = (title, body) => {
        if (!notifEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
        try { new Notification(title, { body, icon: "/assets/logo.svg" }); } catch (err) { console.error(err); }
    };

    const toggleNotifications = async () => {
        if (typeof Notification === "undefined") {
            pushToast("Hindi supported ng browser mo ang notifications.", "warning");
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
            pushToast("Naka-on na ang browser notifications.", "success");
        } else {
            pushToast("Hindi pinayagan ang notifications sa browser settings.", "warning");
        }
    };

    useEffect(() => {
        if (!uid) return;
        const pref = localStorage.getItem(`tipid_notif_${uid}`);
        if (pref === "on" && typeof Notification !== "undefined" && Notification.permission === "granted") {
            setNotifEnabled(true);
        }
    }, [uid]);

    useEffect(() => {
        if (window.TipidData) { setDataReady(true); return; }
        const handler = () => setDataReady(true);
        window.addEventListener("tipid-data-ready", handler, { once: true });
        return () => window.removeEventListener("tipid-data-ready", handler);
    }, []);

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

    useEffect(() => {
        if (!loaded || !uid || !window.db || !window.FirestoreAPI) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            const { doc, setDoc, serverTimestamp } = window.FirestoreAPI;
            try {
                setSaving(true);
                await setDoc(doc(window.db, "users", uid), {
                    allowance: {
                        salary: parseFloat(salary) || 0,
                        bills: parseFloat(bills) || 0,
                        savings: parseFloat(savings) || 0,
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

    const todaysExpenses = useMemo(() => {
        const key = todayKey();
        return entries.filter(e => e.type !== "income" && todayKey(entryToDate(e)) === key);
    }, [entries]);

    const spentToday = useMemo(
        () => todaysExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
        [todaysExpenses]
    );

    const numSalary = parseFloat(salary) || 0;
    const numBills = parseFloat(bills) || 0;
    const numSavings = parseFloat(savings) || 0;

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

    // ---------- Smart weekly insights ----------
    const DAY_LABELS = ["Lin", "Lun", "Mar", "Miy", "Huw", "Biy", "Sab"];

    const dailyHistory = useMemo(() => {
        const out = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            const key = todayKey(d);
            const total = entries
                .filter(e => e.type !== "income" && todayKey(entryToDate(e)) === key)
                .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            out.push({ key, dow: d.getDay(), total, isToday: i === 0 });
        }
        return out;
    }, [entries]);

    const totalExpenseCount = useMemo(() => entries.filter(e => e.type !== "income").length, [entries]);
    const hasEnoughHistory = totalExpenseCount >= 3;

    const priorDays = dailyHistory.slice(0, -1); // last 6 days, excludes today (today is still in progress)
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

    // --------------------------------------------

    useEffect(() => {
        if (loaded && !isConfigured && !autoOpenedRef.current) {
            autoOpenedRef.current = true;
            setEditOpen(true);
        }
    }, [loaded, isConfigured]);

    useEffect(() => {
        if (!loaded) return;
        const flags = notifiedFlags.current;

        if (isOverBudget && !flags.danger) {
            flags.danger = true; setDismissedBanner(false);
            notifyBrowser("Sobra ka na sa daily budget!", `Nagastos mo na ang ₱${window.peso(spentToday)} ngayong araw, lagpas sa safe na ₱${window.peso(dailySafe)}.`);
        } else if (!isOverBudget) { flags.danger = false; }

        if (isNearLimit && !flags.warning) {
            flags.warning = true; setDismissedBanner(false);
            notifyBrowser("Malapit ka na sa daily limit", `Nagastos ka na ng ₱${window.peso(spentToday)} sa ₱${window.peso(dailySafe)} na safe daily spending mo.`);
        } else if (!isNearLimit) { flags.warning = false; }

        if (isPaydaySoon && !flags.payday) {
            flags.payday = true; setDismissedBanner(false);
            notifyBrowser("Papalapit na ang payday", `${daysLeft} araw na lang bago sumapit ang payday mo.`);
        } else if (!isPaydaySoon) { flags.payday = false; }
    }, [isOverBudget, isNearLimit, isPaydaySoon, loaded]);

    const handleLogExpense = async (e) => {
        e.preventDefault();
        const amt = parseFloat(expAmount);
        if (!amt || amt <= 0 || !uid || !window.TipidData) return;

        const currentBalance = walletBalances[expMethod] || 0;
        if (amt > currentBalance) {
            return Swal.fire({
                icon: 'error',
                title: 'Kulang ang Balanse',
                html: `Hindi mo pwedeng gamitin ang <b>${walletMeta(expMethod).name}</b> dahil <b>₱${window.peso(currentBalance)}</b> na lang ang laman nito.`,
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
            setExpAmount(""); setExpNote("");
            pushToast("Na-log ang gastos mo.", "success");
        } catch (err) {
            console.error(err);
            pushToast("Hindi na-save ang gastos. Subukan ulit.", "warning");
        } finally {
            setLoggingExpense(false);
        }
    };

    const handleDeleteExpense = async (entryId) => {
        if (!uid || !window.TipidData) return;
        try {
            await window.TipidData.deleteEntry(uid, entryId);
            pushToast("Naalis na ang expense.", "success");
        } catch (err) { console.error(err); }
    };

    let banner = null;
    if (!dismissedBanner) {
        if (isOverBudget) {
            banner = { tone: "danger", title: "Sobra sa daily limit", message: `Lumagpas ka ng ₱${window.peso(Math.abs(remainingToday))} sa safe limit mo ngayong araw.` };
        } else if (isNearLimit) {
            banner = { tone: "warning", title: "Malapit ka na sa limit", message: `Natitira ka na lang ng ₱${window.peso(Math.max(remainingToday, 0))} para sa araw na ito.` };
        } else if (isPaydaySoon) {
            banner = { tone: "info", title: "Papalapit na ang payday", message: `${daysLeft} ${daysLeft === 1 ? "araw" : "araw"} na lang bago sumapit ang payday mo.` };
        }
    }

    const bannerStyles = {
        danger: "bg-[#FAEDE9] dark:bg-[#D64045]/20 border-[#D64045]/30 text-[#D64045] dark:text-[#F38C80]",
        warning: "bg-[#FDF6E3] dark:bg-[#D4AF37]/20 border-[#D4AF37]/30 text-[#D4AF37] dark:text-[#E8C071]",
        info: "bg-[#E6F3EF] dark:bg-[#1F6F54]/20 border-[#1F6F54]/30 text-[#1F6F54] dark:text-[#52C8A1]"
    };

    const bannerIcon = {
        danger: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></svg>,
        warning: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>,
        info: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" /></svg>
    };

    const spendRatio = dailySafe > 0 ? Math.min(spentToday / dailySafe, 1) : 0;
    const spendPct = Math.round(spendRatio * 100);
    const ringTone = isOverBudget ? "#D64045" : isNearLimit ? "#D4AF37" : "#1F6F54";
    const RING_R = 54;
    const RING_C = 2 * Math.PI * RING_R;
    const ringOffset = RING_C * (1 - spendRatio);

    const fieldIcon = {
        salary: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 text-ink2/40 dark:text-paper/40" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-1" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>,
        bills: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 text-ink2/40 dark:text-paper/40" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>,
        savings: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 text-ink2/40 dark:text-paper/40" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1v3.4a1 1 0 0 0 .6.92l1.9.82" /><path d="M3 9h14a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-1" /><path d="M3 9v10a1 1 0 0 0 1 1h3v-4" /><path d="M13 9v12" /></svg>,
        payday: <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 text-ink2/40 dark:text-paper/40" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" /></svg>
    };

    const QUICK_AMOUNTS = [20, 50, 100, 200];

    // ---------- Weekly Resibo (receipt-style insights) ----------
    const maxBar = Math.max(dailySafe, ...dailyHistory.map(d => d.total), 1);

    const weeklyResiboSection = (!loaded || !isConfigured) ? null : (
            <section className="fade-up" style={{ animationDelay: "60ms" }} aria-labelledby="resibo-heading">
                <div className="relative">
                    <div
                        className="h-3 -mb-px text-paperDim dark:text-ink"
                        style={{
                            backgroundImage: "linear-gradient(135deg, currentColor 25%, transparent 25%), linear-gradient(225deg, currentColor 25%, transparent 25%)",
                            backgroundSize: "14px 14px",
                            backgroundPosition: "bottom",
                            backgroundRepeat: "repeat-x"
                        }}
                        aria-hidden="true"
                    />
                    <div className="bento-card rounded-none px-6 sm:px-8 py-6 border-x border-black/5 dark:border-white/5">
                        <div className="flex items-center justify-between mb-5">
                            <h3 id="resibo-heading" className="font-mono text-[13px] font-bold tracking-widest text-ink dark:text-paper">
                                RESIBO NG LINGGO
                            </h3>
                            <span className="font-mono text-[10px] text-ink2/50 dark:text-paper/40">{DAY_LABELS[dailyHistory[0]?.dow ?? 0]}–{DAY_LABELS[new Date().getDay()]}</span>
                        </div>

                        {!hasEnoughHistory ? (
                            <p className="text-[13px] text-ink2/60 dark:text-paper/50 leading-relaxed py-4 text-center">
                                Mag-log pa ng ilang gastos para makabuo ng lingguhang pattern at makapagbigay ng payo.
                            </p>
                        ) : (
                            <>
                                <div className="flex items-end justify-between gap-2 mb-6 px-1">
                                    {dailyHistory.map((d) => {
                                        const h = Math.max((d.total / maxBar) * 64, d.total > 0 ? 4 : 2);
                                        const over = dailySafe > 0 && d.total > dailySafe;
                                        const near = dailySafe > 0 && !over && d.total >= dailySafe * 0.8;
                                        const barColor = over ? "#D64045" : near ? "#D4AF37" : "#1F6F54";
                                        return (
                                            <div key={d.key} className="flex flex-col items-center gap-2 flex-1">
                                                <div className="w-full h-16 flex items-end justify-center">
                                                    <div
                                                        className="w-[60%] rounded-t-md transition-all duration-500"
                                                        style={{
                                                            height: `${h}px`,
                                                            backgroundColor: barColor,
                                                            opacity: d.isToday ? 1 : 0.55
                                                        }}
                                                    />
                                                </div>
                                                <span className={`text-[9px] font-mono font-bold ${d.isToday ? "text-peso dark:text-pesoLight" : "text-ink2/40 dark:text-paper/30"}`}>
                                                    {d.isToday ? "NGAYON" : DAY_LABELS[d.dow]}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="border-t border-dashed border-ink/15 dark:border-paper/15 pt-1">
                                    <ReceiptRow label="Karaniwang gastos / araw" value={`₱${window.peso(avgDailySpend)}`} />
                                    {dailySafe > 0 && (
                                        <ReceiptRow
                                            label="Kumpara sa safe daily limit"
                                            value={paceVsSafePct <= 0 ? `${Math.abs(paceVsSafePct)}% mas mababa` : `${paceVsSafePct}% mas mataas`}
                                            valueClass={paceVsSafePct <= 0 ? "text-[#1F6F54] dark:text-[#52C8A1]" : "text-[#D64045] dark:text-[#F38C80]"}
                                        />
                                    )}
                                    {topCategoryEntry && (
                                        <ReceiptRow label="Pinaka-ginastusan" value={`${topCategoryEntry.name} · ₱${window.peso(topCategoryEntry.amount)}`} />
                                    )}
                                    <ReceiptRow
                                        label="Sunod-sunod na araw sa loob ng budget"
                                        value={`${budgetStreak} ${budgetStreak === 1 ? "araw" : "araw"}`}
                                        valueClass={budgetStreak >= 3 ? "text-[#1F6F54] dark:text-[#52C8A1]" : ""}
                                    />
                                </div>

                                <div className={`mt-4 rounded-xl px-4 py-3 text-[12.5px] leading-relaxed font-medium ${
                                    willRunOutEarly
                                        ? "bg-[#FAEDE9] dark:bg-[#D64045]/15 text-[#D64045] dark:text-[#F38C80]"
                                        : "bg-[#E6F3EF] dark:bg-[#1F6F54]/15 text-[#1F6F54] dark:text-[#52C8A1]"
                                }`}>
                                    {willRunOutEarly
                                        ? `Sa kasalukuyang bilis ng paggastos, maaaring maubos ang budget mo ${shortfallDays} ${shortfallDays === 1 ? "araw" : "araw"} bago sumapit ang payday.`
                                        : "Sa kasalukuyang bilis ng paggastos, sasapat ang budget mo hanggang sa payday. Ituloy lang."}
                                </div>
                            </>
                        )}
                    </div>
                    <div
                        className="h-3 -mt-px text-paperDim dark:text-ink rotate-180"
                        style={{
                            backgroundImage: "linear-gradient(135deg, currentColor 25%, transparent 25%), linear-gradient(225deg, currentColor 25%, transparent 25%)",
                            backgroundSize: "14px 14px",
                            backgroundPosition: "bottom",
                            backgroundRepeat: "repeat-x"
                        }}
                        aria-hidden="true"
                    />
                </div>
            </section>
    );
    // --------------------------------------------------------------

    return (
        <div className="space-y-6 sm:space-y-8 fade-up relative">

            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`fade-up pointer-events-auto rounded-[1.25rem] px-5 py-3.5 text-[13px] font-bold shadow-iosLg border backdrop-blur-2xl flex items-center gap-3 ${
                            t.tone === "warning"
                                ? "bg-expense/95 text-white border-expense/50"
                                : "bg-ink/95 dark:bg-paper/95 text-paper dark:text-ink border-white/10"
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${t.tone === "warning" ? "bg-white" : "bg-peso dark:bg-pesoLight"}`} />
                        {t.message}
                    </div>
                ))}
            </div>

            {banner && (
                <div role="alert" aria-live="polite" className={`fade-up flex items-start gap-4 rounded-[1.5rem] border shadow-sm px-5 py-4 ${bannerStyles[banner.tone]}`}>
                    <div className="mt-0.5">{bannerIcon[banner.tone]}</div>
                    <div className="flex-1 mt-0.5">
                        <p className="text-[13px] font-bold leading-none">{banner.title}</p>
                        <p className="text-[13px] font-medium opacity-90 mt-2 leading-relaxed">{banner.message}</p>
                    </div>
                    <button
                        onClick={() => setDismissedBanner(true)}
                        className="text-[11px] font-bold opacity-60 hover:opacity-100 transition-opacity duration-150 shrink-0 mt-0.5 bg-black/5 dark:bg-white/10 px-2.5 py-1.5 rounded-md"
                        aria-label="Isara ang alert"
                    >
                        Isara
                    </button>
                </div>
            )}

            <div className="relative bento-card rounded-[2rem] p-6 sm:p-8 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pesoLight to-peso rounded-t-[2rem]" />

                <div className="flex items-start justify-between gap-3 mb-8 mt-1 w-full">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-[14px] bg-[#E6F3EF] dark:bg-[#1F6F54]/20 flex items-center justify-center text-[#1F6F54] dark:text-[#52C8A1] shrink-0 border border-[#1F6F54]/10 dark:border-[#52C8A1]/20 shadow-inner">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18" /><path d="M7 15h3" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-display text-[1.15rem] sm:text-[1.25rem] font-bold text-ink dark:text-paper leading-tight tracking-tight truncate">Configuration</h3>
                            <span className="text-[12px] font-medium text-ink2/60 dark:text-paper/50 flex items-center gap-1.5 mt-1 truncate">
                                {saving && <span className="w-1.5 h-1.5 rounded-full bg-[#1F6F54] dark:bg-[#52C8A1] animate-pulse shrink-0" />}
                                <span className="truncate">{saving ? "Nagse-sync..." : loaded ? "Nakatago at secure" : "Naglo-load..."}</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {loaded && isConfigured && (
                            <button
                                onClick={() => setEditOpen(o => !o)}
                                className="text-[12px] font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border bg-white/60 dark:bg-ink2/40 border-black/10 dark:border-white/10 text-ink2/70 dark:text-paper/60 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-peso/50"
                            >
                                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 hidden sm:block" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                {editOpen ? "Isara" : "I-edit"}
                            </button>
                        )}
                        <button
                            onClick={toggleNotifications}
                            aria-pressed={notifEnabled}
                            className={`text-[11px] font-bold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-peso/50 ${
                                notifEnabled
                                    ? "bg-gradient-to-r from-pesoLight to-peso border-transparent text-white"
                                    : "bg-white/60 dark:bg-ink2/40 border-black/10 dark:border-white/10 text-ink2/60 dark:text-paper/50 hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                {!notifEnabled && <path d="M2 2l20 20" />}
                            </svg>
                        </button>
                    </div>
                </div>

                {!loaded ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-pulse">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-[56px] rounded-[14px] bg-black/5 dark:bg-white/5" />
                        ))}
                    </div>
                ) : editOpen ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-8 fade-up">
                        <div>
                            <label className="block text-[12px] font-semibold text-ink dark:text-paper mb-1 px-1">
                                Sahod / Kita
                            </label>
                            <p className="text-[11px] text-ink2/55 dark:text-paper/45 mb-2 px-1 leading-snug">Kabuuang pera na matatanggap mo sa araw na ito — sahod, padala, o kita.</p>
                            <FieldWrap icon={fieldIcon.salary}>
                                <input
                                    type="number"
                                    placeholder="hal. 15000"
                                    value={salary}
                                    onChange={e => setSalary(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-ink dark:text-paper mb-1 px-1">
                                Fixed na Bills
                            </label>
                            <p className="text-[11px] text-ink2/55 dark:text-paper/45 mb-2 px-1 leading-snug">Mga dapat bayaran bago gumastos ng baon — upa, kuryente, load, hulugan.</p>
                            <FieldWrap icon={fieldIcon.bills}>
                                <input
                                    type="number"
                                    placeholder="hal. 3000"
                                    value={bills}
                                    onChange={e => setBills(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>
                        <div>
                            <label className="block text-[12px] font-semibold text-ink dark:text-paper mb-1 px-1">
                                Ilalaan sa Ipon
                            </label>
                            <p className="text-[11px] text-ink2/55 dark:text-paper/45 mb-2 px-1 leading-snug">Magkano ang gusto mong itabi bago hatiin ang natitira sa baon. Kung wala munang itatabi, puwedeng iwan na 0.</p>
                            <FieldWrap icon={fieldIcon.savings}>
                                <input
                                    type="number"
                                    placeholder="hal. 1000 (o 0 kung wala)"
                                    value={savings}
                                    onChange={e => setSavings(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>
                        <div>
                            <div className="flex items-center justify-between px-1 mb-1">
                                <label className="block text-[12px] font-semibold text-ink dark:text-paper">
                                    Susunod na Payday
                                </label>
                                {paydayDate && (
                                    <span className="text-[11px] font-bold text-[#1F6F54] dark:text-[#52C8A1] bg-[#E6F3EF] dark:bg-[#1F6F54]/20 px-2 py-0.5 rounded-md border border-[#1F6F54]/10 dark:border-[#52C8A1]/20">
                                        {daysLeft} {daysLeft === 1 ? "araw" : "araw"} pa
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-ink2/55 dark:text-paper/45 mb-2 px-1 leading-snug">Kailan mo matatanggap ang susunod na sahod o padala. Dito hahatiin ang badyet mo araw-araw.</p>
                            <FieldWrap icon={fieldIcon.payday}>
                                <input
                                    type="date"
                                    value={paydayDate}
                                    onChange={e => setPaydayDate(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none appearance-none"
                                />
                            </FieldWrap>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4 mb-8 fade-up">
                        <StatChip label="Sahod" value={`₱${window.peso(numSalary)}`} />
                        <StatChip label="Bills" value={`₱${window.peso(numBills)}`} />
                        <StatChip label="Ipon" value={`₱${window.peso(numSavings)}`} />
                        <StatChip
                            label="Payday"
                            value={paydayDate ? `${daysLeft} araw pa` : "Hindi pa naitatakda"}
                            accent={paydayDate ? "text-[#1F6F54] dark:text-[#52C8A1]" : "text-ink2/40 dark:text-paper/40"}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 sm:gap-8 items-center pt-8 border-t border-black/5 dark:border-white/10">
                    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
                        <div className="bg-white/60 dark:bg-black/20 p-5 rounded-[1.25rem] border border-black/5 dark:border-white/5 shadow-sm min-w-0">
                            <p className="text-[11px] font-semibold text-ink2/50 dark:text-paper/40 mb-2">Natitirang badyet</p>
                            <p
                                className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight truncate ${remaining < 0 ? 'text-[#D64045] dark:text-[#F38C80]' : 'text-ink dark:text-paper'}`}
                                title={`₱${window.peso(remaining)}`}
                            >
                                ₱{window.peso(remaining)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-[#E6F3EF] to-[#D5EBE3] dark:from-[#1F6F54]/20 dark:to-[#1F6F54]/10 p-5 rounded-[1.25rem] border border-[#1F6F54]/10 dark:border-[#52C8A1]/20 shadow-sm relative overflow-hidden min-w-0">
                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/30 dark:bg-white/10 rounded-full blur-xl pointer-events-none" />
                            <p className="text-[11px] font-semibold text-[#1F6F54] dark:text-[#52C8A1] mb-2 relative z-10">Safe daily budget</p>
                            <p
                                className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#1F6F54] dark:text-[#52C8A1] relative z-10 truncate"
                                title={`₱${window.peso(dailySafe)}`}
                            >
                                ₱{window.peso(dailySafe)}
                            </p>
                            {loaded && isConfigured && daysLeft === 0 && (
                                <p className="text-[11px] font-medium text-[#1F6F54]/70 dark:text-[#52C8A1]/70 mt-2 relative z-10 leading-snug">
                                    Ngayon ang itinakdang payday mo — i-update ang petsa para makuha ang bagong daily limit.
                                </p>
                            )}
                        </div>
                    </div>

                    {dailySafe > 0 && (
                        <div className="flex items-center justify-center sm:justify-self-end relative group">
                            <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative w-[140px] h-[140px] shrink-0 drop-shadow-sm">
                                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                    <circle cx="60" cy="60" r={RING_R} fill="none" strokeWidth="10" className="stroke-black/5 dark:stroke-white/10" />
                                    <circle
                                        cx="60" cy="60" r={RING_R} fill="none" strokeWidth="10" strokeLinecap="round"
                                        stroke={ringTone}
                                        strokeDasharray={RING_C}
                                        strokeDashoffset={ringOffset}
                                        className="transition-[stroke-dashoffset,stroke] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="font-mono text-3xl font-bold tracking-tighter text-ink dark:text-paper">{spendPct}%</span>
                                    <span className="text-[11px] font-medium text-ink2/50 dark:text-paper/40 mt-1">nagamit ngayon</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {weeklyResiboSection}

            {/* Today's real spending */}
            <div className="bento-card rounded-[2rem] p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-[14px] bg-[#FDF6E3] dark:bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] dark:text-[#E8C071] shrink-0 border border-[#D4AF37]/10 dark:border-[#E8C071]/20 shadow-inner">
                        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                        </svg>
                    </div>
                    <h3 className="font-display text-[1.25rem] font-bold text-ink dark:text-paper tracking-tight">Ngayong Araw</h3>
                </div>
                <p className="text-[13px] font-medium text-ink2/60 dark:text-paper/50 mb-8 pl-[4rem] leading-snug">I-log ang ginastos mo para makita agad kung nasa loob ka pa ng safe daily limit.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/50 dark:bg-black/20 p-5 rounded-[1.25rem] border border-black/5 dark:border-white/5 shadow-sm min-w-0">
                        <p className="text-[11px] font-semibold text-ink2/60 dark:text-paper/50 mb-2">Nagastos ngayon</p>
                        <p className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-paper truncate" title={`₱${window.peso(spentToday)}`}>₱{window.peso(spentToday)}</p>
                    </div>
                    <div className={`p-5 rounded-[1.25rem] border shadow-sm transition-colors duration-300 min-w-0 ${
                        remainingToday < 0
                            ? 'bg-[#FAEDE9] dark:bg-[#D64045]/20 border-[#D64045]/10 dark:border-[#F38C80]/20'
                            : 'bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/5'
                    }`}>
                        <p className={`text-[11px] font-semibold mb-2 ${
                            remainingToday < 0 ? 'text-[#D64045] dark:text-[#F38C80]' : 'text-ink2/60 dark:text-paper/50'
                        }`}>
                            {remainingToday < 0 ? 'Sobra sa budget' : 'Natitirang pwedeng gastusin'}
                        </p>
                        <p
                            className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight truncate ${
                                remainingToday < 0 ? 'text-[#D64045] dark:text-[#F38C80]' : 'text-[#1F6F54] dark:text-[#52C8A1]'
                            }`}
                            title={`₱${window.peso(Math.abs(remainingToday))}`}
                        >
                            ₱{window.peso(Math.abs(remainingToday))}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleLogExpense} className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="sm:flex-1">
                            <FieldWrap icon={<span className="text-ink2/40 dark:text-paper/40 font-mono text-[16px] font-bold shrink-0">₱</span>}>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Halaga"
                                    value={expAmount}
                                    onChange={e => setExpAmount(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-4 text-[16px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                            <div className="flex items-center gap-2 mt-3 px-1">
                                {QUICK_AMOUNTS.map(a => (
                                    <button
                                        key={a}
                                        type="button"
                                        onClick={() => setExpAmount(String((parseFloat(expAmount) || 0) + a))}
                                        className="text-[11px] font-mono font-bold text-ink2/60 dark:text-paper/60 border border-black/5 dark:border-white/10 bg-white dark:bg-black/20 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 px-3 py-1.5 rounded-lg shadow-sm transition-all duration-150"
                                    >
                                        +₱{a}
                                    </button>
                                ))}
                                {expAmount !== "" && (
                                    <button
                                        type="button"
                                        onClick={() => setExpAmount("")}
                                        className="text-[11px] font-bold text-ink2/40 dark:text-paper/40 hover:text-expense dark:hover:text-[#F38C80] ml-auto transition-colors duration-150 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg"
                                    >
                                        I-clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <FieldWrap className="sm:flex-1 self-start" icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 text-ink2/40 dark:text-paper/40" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>}>
                            <input
                                type="text"
                                placeholder="Note (opsyonal)"
                                value={expNote}
                                onChange={e => setExpNote(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-4 text-[15px] font-medium text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                            />
                        </FieldWrap>
                    </div>

                    {/* Bayad Gamit — pick the real wallet/card this expense comes out of.
                        Logging it with that method means the wallet's balance on the
                        dashboard is automatically reduced, since it reads from the
                        same entries collection this write goes into. */}
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-mono font-bold text-ink2/45 dark:text-paper/40 uppercase tracking-widest px-1">Bayad Gamit</p>
                        <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                            {walletIds.map(id => {
                                const meta = walletMeta(id);
                                return (
                                    <MiniWalletChip key={id} id={id} meta={meta} active={expMethod === id} onClick={() => setExpMethod(id)} />
                                );
                            })}
                        </div>
                        <p className="text-[10.5px] text-ink2/45 dark:text-paper/40 px-1">
                            Balanse ng {walletMeta(expMethod).name}: <span className="font-mono font-semibold text-ink dark:text-paper">₱{window.peso(walletBalances[expMethod] || 0)}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 px-1 mt-1">
                        {CATEGORIES.filter(c => c !== "Kita").map(c => {
                            const meta = getCategoryMeta(c);
                            const active = expCategory === c;
                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setExpCategory(c)}
                                    style={active ? { backgroundColor: meta.bg, borderColor: `${meta.color}55`, color: meta.color } : undefined}
                                    className={`flex items-center gap-2 text-[12.5px] font-bold px-4 py-2 rounded-xl border transition-all duration-200 active:scale-95 ${
                                        active
                                            ? "shadow-sm"
                                            : "bg-white/50 dark:bg-white/[0.04] border-black/5 dark:border-white/5 text-ink2/60 dark:text-paper/50 hover:bg-black/5 dark:hover:bg-white/[0.08]"
                                    }`}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0" strokeWidth="2.5" stroke={active ? meta.color : "currentColor"} strokeLinecap="round" strokeLinejoin="round">
                                        {meta.icon}
                                    </svg>
                                    {c}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="submit"
                        disabled={loggingExpense || !expAmount}
                        className="bg-gradient-to-r from-pesoLight to-peso hover:shadow-lg hover:shadow-peso/20 active:scale-[0.98] disabled:opacity-50 disabled:hover:shadow-none text-white text-[15px] font-bold tracking-wide rounded-[1.25rem] px-6 py-4 transition-all duration-200 w-full flex items-center justify-center gap-2.5 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
                    >
                        {loggingExpense ? (
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 animate-spin" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                                I-log ang gastos
                            </>
                        )}
                    </button>
                </form>

                {entriesLoading ? (
                    <div className="space-y-3 animate-pulse">
                        {[0, 1, 2].map(i => <div key={i} className="h-[68px] rounded-[1.25rem] bg-black/5 dark:bg-white/5" />)}
                    </div>
                ) : todaysExpenses.length > 0 ? (
                    <ul className="space-y-3">
                        {todaysExpenses.map(exp => {
                            const meta = getCategoryMeta(exp.category);
                            const expWallet = walletMeta(exp.method || "Cash");
                            return (
                                <li key={exp.id} className="group flex items-center gap-4 bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 border border-black/5 dark:border-white/5 rounded-[1.25rem] px-5 py-4 transition-all duration-200 shadow-sm">
                                    <div
                                        className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 shadow-inner"
                                        style={{ backgroundColor: meta.bg, color: meta.color }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" className="w-[20px] h-[20px]" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                            {meta.icon}
                                        </svg>
                                    </div>
                                    <span className="flex-1 min-w-0 flex flex-col justify-center">
                                        <span className="font-mono font-bold text-[16px] text-ink dark:text-paper leading-none">₱{window.peso(exp.amount)}</span>
                                        <span className="text-[12px] font-medium text-ink2/60 dark:text-paper/50 truncate mt-1.5 flex items-center gap-1.5">
                                            {exp.desc || exp.category}
                                            <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-ink2/60 dark:text-paper/50 shrink-0">
                                                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${expWallet.color}`} />
                                                {expWallet.name}
                                            </span>
                                        </span>
                                    </span>
                                    <button
                                        onClick={() => handleDeleteExpense(exp.id)}
                                        aria-label="Alisin"
                                        className="text-ink2/30 hover:text-expense dark:text-paper/30 dark:hover:text-[#F38C80] p-2.5 rounded-xl bg-white dark:bg-black/30 hover:bg-expense/10 dark:hover:bg-[#B5483B]/20 transition-all duration-200 shrink-0 border border-black/5 dark:border-white/5 active:scale-90"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl bg-white/30 dark:bg-black/10 border border-dashed border-black/10 dark:border-white/10">
                        <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-ink2/30 dark:text-paper/20 mb-4 shadow-inner">
                            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
                        </div>
                        <p className="text-[14px] font-bold text-ink2/70 dark:text-paper/60">Walang na-log ngayon</p>
                        <p className="text-[12px] font-medium text-ink2/50 dark:text-paper/40 mt-2 leading-relaxed">Idagdag sa itaas para masubaybayan ang araw mo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
