// components/AllowanceCalculator.js

window.AllowanceCalculator = function AllowanceCalculator({ user }) {
    const { useState, useEffect, useRef, useMemo } = React;

    const uid = user?.uid || window.TipidAuth?.currentUser?.uid || null;

    // Fall back to the same list dashboard.html defines
    const CATEGORIES = window.CATEGORIES || ["Pagkain", "Pamasahe", "Bills", "Load", "Ipon", "Project Components", "Iba pa"];

    // ---- form state ----
    const [salary, setSalary] = useState("");
    const [bills, setBills] = useState("");
    const [savings, setSavings] = useState("");
    const [paydayDate, setPaydayDate] = useState(""); // "YYYY-MM-DD"

    // ---- load / save state ----
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const saveTimer = useRef(null);

    // ---- real entries, via window.TipidData ----
    const [dataReady, setDataReady] = useState(!!window.TipidData);
    const [entries, setEntries] = useState([]);
    const [expAmount, setExpAmount] = useState("");
    const [expNote, setExpNote] = useState("");
    const [expCategory, setExpCategory] = useState(CATEGORIES[CATEGORIES.length - 1] || "Iba pa");
    const [loggingExpense, setLoggingExpense] = useState(false);

    // ---- alerts / notifications ----
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

    // ---- toast helper ----
    const pushToast = (message, tone = "success") => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, tone }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    };

    // ---- browser notification helper ----
    const notifyBrowser = (title, body) => {
        if (!notifEnabled || typeof Notification === "undefined" || Notification.permission !== "granted") return;
        try {
            new Notification(title, { body, icon: "/assets/logo.svg" });
        } catch (err) {
            console.error("Notification failed:", err);
        }
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

    // restore notif preference
    useEffect(() => {
        if (!uid) return;
        const pref = localStorage.getItem(`tipid_notif_${uid}`);
        if (pref === "on" && typeof Notification !== "undefined" && Notification.permission === "granted") {
            setNotifEnabled(true);
        }
    }, [uid]);

    // ---- wait for window.TipidData ----
    useEffect(() => {
        if (window.TipidData) { setDataReady(true); return; }
        const handler = () => setDataReady(true);
        window.addEventListener("tipid-data-ready", handler, { once: true });
        return () => window.removeEventListener("tipid-data-ready", handler);
    }, []);

    // ---- 1. Load saved allowance settings ----
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

    // ---- 2. Auto-save (debounced) ----
    useEffect(() => {
        if (!loaded || !uid || !window.db || !window.FirestoreAPI) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            const { doc, setDoc, serverTimestamp } = window.FirestoreAPI;
            try {
                setSaving(true);
                await setDoc(
                    doc(window.db, "users", uid),
                    {
                        allowance: {
                            salary: parseFloat(salary) || 0,
                            bills: parseFloat(bills) || 0,
                            savings: parseFloat(savings) || 0,
                            paydayDate: paydayDate || null,
                            updatedAt: serverTimestamp()
                        }
                    },
                    { merge: true }
                );
            } catch (err) {
                console.error("Failed to save allowance settings:", err);
            } finally {
                setSaving(false);
            }
        }, 600);

        return () => clearTimeout(saveTimer.current);
    }, [salary, bills, savings, paydayDate, loaded, uid]);

    // ---- 3. Live-listen to entries ----
    useEffect(() => {
        if (!uid || !dataReady || !window.TipidData) return;
        const unsub = window.TipidData.subscribeEntries(
            uid,
            (list) => setEntries(list),
            (err) => console.error("Failed to subscribe to entries:", err)
        );
        return unsub;
    }, [uid, dataReady]);

    // ---- derive "today's" real spending ----
    const todaysExpenses = useMemo(() => {
        const key = todayKey();
        return entries.filter(e => e.type !== "income" && todayKey(entryToDate(e)) === key);
    }, [entries]);

    const spentToday = useMemo(
        () => todaysExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
        [todaysExpenses]
    );

    // ---- derived numbers ----
    const numSalary = parseFloat(salary) || 0;
    const numBills = parseFloat(bills) || 0;
    const numSavings = parseFloat(savings) || 0;

    const daysLeft = (() => {
        if (!paydayDate) return 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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

    // ---- 4. Fire alerts ----
    useEffect(() => {
        if (!loaded) return;
        const flags = notifiedFlags.current;

        if (isOverBudget && !flags.danger) {
            flags.danger = true;
            setDismissedBanner(false);
            notifyBrowser("Sobra ka na sa daily budget!", `Nagastos mo na ang ₱${window.peso(spentToday)} ngayong araw, lagpas sa safe na ₱${window.peso(dailySafe)}.`);
        } else if (!isOverBudget) {
            flags.danger = false;
        }

        if (isNearLimit && !flags.warning) {
            flags.warning = true;
            setDismissedBanner(false);
            notifyBrowser("Malapit ka na sa daily limit", `Nagastos ka na ng ₱${window.peso(spentToday)} sa ₱${window.peso(dailySafe)} na safe daily spending mo.`);
        } else if (!isNearLimit) {
            flags.warning = false;
        }

        if (isPaydaySoon && !flags.payday) {
            flags.payday = true;
            setDismissedBanner(false);
            notifyBrowser("Papalapit na ang payday", `${daysLeft} araw na lang bago sumapit ang payday mo.`);
        } else if (!isPaydaySoon) {
            flags.payday = false;
        }
    }, [isOverBudget, isNearLimit, isPaydaySoon, loaded]);

    const handleLogExpense = async (e) => {
        e.preventDefault();
        const amt = parseFloat(expAmount);
        if (!amt || amt <= 0 || !uid || !window.TipidData) return;

        try {
            setLoggingExpense(true);
            await window.TipidData.addExpense(uid, {
                desc: expNote.trim() || expCategory,
                amount: amt,
                category: expCategory,
                method: "Cash"
            });
            setExpAmount("");
            setExpNote("");
            pushToast("Na-log ang gastos mo.", "success");
        } catch (err) {
            console.error("Failed to log expense:", err);
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
        } catch (err) {
            console.error("Failed to delete expense:", err);
        }
    };

    // ---- banner content ----
    let banner = null;
    if (!dismissedBanner) {
        if (isOverBudget) {
            banner = {
                tone: "danger",
                title: "Sobra ka na sa safe daily spending",
                message: `Lumagpas ka ng ₱${window.peso(Math.abs(remainingToday))} sa dapat mong magastos ngayong araw.`
            };
        } else if (isNearLimit) {
            banner = {
                tone: "warning",
                title: "Malapit ka na sa daily limit",
                message: `Natitira ka na lang ng ₱${window.peso(Math.max(remainingToday, 0))} para sa araw na ito.`
            };
        } else if (isPaydaySoon) {
            banner = {
                tone: "info",
                title: "Papalapit na ang payday",
                message: `${daysLeft} ${daysLeft === 1 ? "araw" : "araw"} na lang bago sumapit ang payday mo.`
            };
        }
    }

    const bannerStyles = {
        danger: "bg-[#FAEDE9] dark:bg-[#B5483B]/20 border-[#B5483B]/30 text-[#B5483B] dark:text-[#F38C80]",
        warning: "bg-[#FDF6E3] dark:bg-[#C9932E]/20 border-[#C9932E]/30 text-[#C9932E] dark:text-[#E8C071]",
        info: "bg-[#E6F3EF] dark:bg-[#1F6F54]/20 border-[#1F6F54]/30 text-[#1F6F54] dark:text-[#52C8A1]"
    };

    const bannerIcon = {
        danger: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" /><path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
        ),
        warning: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
        ),
        info: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" />
            </svg>
        )
    };

    const spendRatio = dailySafe > 0 ? Math.min(spentToday / dailySafe, 1) : 0;
    const spendPct = Math.round(spendRatio * 100);
    const barTone = isOverBudget ? "bg-[#B5483B]" : isNearLimit ? "bg-[#C9932E]" : "bg-[#1F6F54]";

    // Reusable field wrapper to match entry forms
    const FieldWrap = ({ icon, children }) => (
        <div className="flex items-center gap-2.5 bg-white/60 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200">
            {icon}
            {children}
        </div>
    );

    const fieldIcon = {
        salary: <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] shrink-0 text-ink2/30 dark:text-paper/30" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-1" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>,
        bills: <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] shrink-0 text-ink2/30 dark:text-paper/30" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>,
        savings: <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] shrink-0 text-ink2/30 dark:text-paper/30" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1v3.4a1 1 0 0 0 .6.92l1.9.82" /><path d="M3 9h14a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-1" /><path d="M3 9v10a1 1 0 0 0 1 1h3v-4" /><path d="M13 9v12" /><circle cx="7" cy="5" r="0" /></svg>,
        payday: <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] shrink-0 text-ink2/30 dark:text-paper/30" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" /></svg>
    };

    return (
        <div className="space-y-6 sm:space-y-8 fade-up relative">

            {/* Toast stack */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`fade-up pointer-events-auto rounded-[14px] px-4 py-3 text-[13px] font-medium shadow-iosLg border backdrop-blur-xl flex items-center gap-2.5 ${
                            t.tone === "warning"
                                ? "bg-expense/90 text-white border-expense/50"
                                : "bg-ink/90 dark:bg-paper/95 text-paper dark:text-ink border-white/10"
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.tone === "warning" ? "bg-white" : "bg-peso dark:bg-pesoLight"}`} />
                        {t.message}
                    </div>
                ))}
            </div>

            {banner && (
                <div className={`fade-up flex items-start gap-3.5 rounded-[1.25rem] border px-4 sm:px-5 py-4 ${bannerStyles[banner.tone]}`}>
                    {bannerIcon[banner.tone]}
                    <div className="flex-1 mt-0.5">
                        <p className="text-[14px] font-semibold leading-tight">{banner.title}</p>
                        <p className="text-[12px] opacity-80 mt-1">{banner.message}</p>
                    </div>
                    <button
                        onClick={() => setDismissedBanner(true)}
                        className="text-[11px] font-mono opacity-60 hover:opacity-100 transition-opacity duration-150 shrink-0 mt-0.5 uppercase tracking-wide bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md"
                        aria-label="Isara ang alert"
                    >
                        Alisin
                    </button>
                </div>
            )}

            {/* Allowance Settings Card */}
            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-peso to-pesoLight rounded-t-[1.75rem]" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[14px] bg-[#E6F3EF] dark:bg-[#1F6F54]/20 flex items-center justify-center text-[#1F6F54] dark:text-[#52C8A1] shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18" /><path d="M7 15h3" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">Allowance Calculator</h3>
                            <span className="text-[11px] font-mono text-ink2/50 dark:text-paper/40 flex items-center gap-1.5 mt-0.5">
                                {saving && <span className="w-1.5 h-1.5 rounded-full bg-[#1F6F54] dark:bg-[#52C8A1] animate-pulse" />}
                                {saving ? "Sini-save..." : loaded ? "Naka-save" : "Loading..."}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={toggleNotifications}
                        className={`text-[11px] font-mono font-medium px-3.5 py-2 rounded-full border transition-all duration-200 flex items-center gap-2 shrink-0 w-max ${
                            notifEnabled
                                ? "bg-[#E6F3EF] border-[#1F6F54]/30 text-[#1F6F54] dark:bg-[#1F6F54]/20 dark:border-[#52C8A1]/30 dark:text-[#52C8A1]"
                                : "bg-white/60 dark:bg-ink2/40 border-black/10 dark:border-white/10 text-ink2/60 dark:text-paper/50 hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            {!notifEnabled && <path d="M2 2l20 20" />}
                        </svg>
                        <span>{notifEnabled ? "Notifications ON" : "Notifications OFF"}</span>
                    </button>
                </div>

                {!loaded ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8 animate-pulse">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-[52px] rounded-[14px] bg-black/5 dark:bg-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-8">
                        <div>
                            <label className="block text-[10px] font-mono font-semibold text-ink2/60 dark:text-paper/50 mb-1.5 uppercase tracking-widest px-1">
                                Salary / Income
                            </label>
                            <FieldWrap icon={fieldIcon.salary}>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={salary}
                                    onChange={e => setSalary(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3 text-[14px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono font-semibold text-ink2/60 dark:text-paper/50 mb-1.5 uppercase tracking-widest px-1">
                                Fixed Bills
                            </label>
                            <FieldWrap icon={fieldIcon.bills}>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={bills}
                                    onChange={e => setBills(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3 text-[14px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono font-semibold text-ink2/60 dark:text-paper/50 mb-1.5 uppercase tracking-widest px-1">
                                Savings Goal
                            </label>
                            <FieldWrap icon={fieldIcon.savings}>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={savings}
                                    onChange={e => setSavings(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3 text-[14px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>
                        <div>
                            <div className="flex items-center justify-between px-1 mb-1.5">
                                <label className="block text-[10px] font-mono font-semibold text-ink2/60 dark:text-paper/50 uppercase tracking-widest">
                                    Susunod na Payday
                                </label>
                                {paydayDate && (
                                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#1F6F54] dark:text-[#52C8A1] bg-[#E6F3EF] dark:bg-[#1F6F54]/20 px-1.5 py-0.5 rounded-md">
                                        {daysLeft} araw pa
                                    </span>
                                )}
                            </div>
                            <FieldWrap icon={fieldIcon.payday}>
                                <input
                                    type="date"
                                    value={paydayDate}
                                    onChange={e => setPaydayDate(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3 text-[14px] font-mono font-medium text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none appearance-none"
                                />
                            </FieldWrap>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-black/5 dark:border-white/10">
                    <div className="bg-white/60 dark:bg-black/20 p-5 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase font-semibold tracking-wider text-ink2/60 dark:text-paper/50 mb-1.5">Remaining Budget</p>
                        <p className={`font-mono text-2xl font-bold tracking-tight ${remaining < 0 ? 'text-[#B5483B] dark:text-[#F38C80]' : 'text-ink dark:text-paper'}`}>
                            ₱{window.peso(remaining)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-[#E6F3EF] to-[#D5EBE3] dark:from-[#1F6F54]/20 dark:to-[#1F6F54]/10 p-5 rounded-2xl border border-[#1F6F54]/10 dark:border-[#52C8A1]/20">
                        <p className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#1F6F54] dark:text-[#52C8A1] mb-1.5">Safe Daily Spending</p>
                        <p className="font-mono text-3xl font-bold tracking-tight text-[#1F6F54] dark:text-[#52C8A1]">
                            ₱{window.peso(dailySafe)}<span className="text-sm font-body font-medium opacity-60 tracking-normal"> / day</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Today's real spending */}
            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7">
                <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-10 h-10 rounded-[14px] bg-[#FDF6E3] dark:bg-[#C9932E]/20 flex items-center justify-center text-[#C9932E] dark:text-[#E8C071] shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                        </svg>
                    </div>
                    <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper">Ngayong Araw</h3>
                </div>
                <p className="text-[12px] text-ink2/60 dark:text-paper/50 mb-6 pl-[3.25rem] leading-snug">I-log ang ginastos mo para makita agad kung nasa loob ka pa ng safe daily spending.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="bg-white/60 dark:bg-black/20 p-5 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase font-semibold tracking-wider text-ink2/60 dark:text-paper/50 mb-1.5">Nagastos Ngayon</p>
                        <p className="font-mono text-2xl font-bold tracking-tight text-ink dark:text-paper">₱{window.peso(spentToday)}</p>
                    </div>
                    <div className={`p-5 rounded-2xl border transition-colors ${
                        remainingToday < 0
                            ? 'bg-[#FAEDE9] dark:bg-[#B5483B]/20 border-[#B5483B]/10 dark:border-[#F38C80]/20'
                            : 'bg-white/60 dark:bg-black/20 border-black/5 dark:border-white/5'
                    }`}>
                        <p className={`text-[10px] font-mono uppercase font-semibold tracking-wider mb-1.5 ${
                            remainingToday < 0 ? 'text-[#B5483B] dark:text-[#F38C80]' : 'text-ink2/60 dark:text-paper/50'
                        }`}>
                            {remainingToday < 0 ? 'Sobra sa Budget' : 'Natitirang Pwedeng Gastusin'}
                        </p>
                        <p className={`font-mono text-2xl font-bold tracking-tight ${
                            remainingToday < 0 ? 'text-[#B5483B] dark:text-[#F38C80]' : 'text-[#1F6F54] dark:text-[#52C8A1]'
                        }`}>
                            ₱{window.peso(Math.abs(remainingToday))}
                        </p>
                    </div>
                </div>

                {dailySafe > 0 && (
                    <div className="mb-7 px-1">
                        <div className="flex items-center justify-between text-[11px] font-mono font-medium text-ink2/60 dark:text-paper/50 mb-2.5">
                            <span>{spendPct}% ng safe daily spending</span>
                            <span>₱{window.peso(spentToday)} / ₱{window.peso(dailySafe)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out ${barTone}`}
                                style={{ width: `${spendRatio * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <form onSubmit={handleLogExpense} className="flex flex-col gap-3.5 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3.5">
                        <FieldWrap className="sm:flex-1" icon={<span className="text-ink2/40 dark:text-paper/40 font-mono text-[14px] shrink-0">₱</span>}>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Halaga"
                                value={expAmount}
                                onChange={e => setExpAmount(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                            />
                        </FieldWrap>
                        <FieldWrap className="sm:flex-1 relative" icon={<span className="text-ink2/40 dark:text-paper/40 shrink-0"><svg viewBox="0 0 24 24" fill="none" className="w-[15px] h-[15px]" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.59 9.59a2 2 0 0 0 2.82 0l4.59-4.59a2 2 0 0 0 0-2.82Z"/><circle cx="7.5" cy="7.5" r="1"/></svg></span>}>
                            <select
                                value={expCategory}
                                onChange={e => setExpCategory(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper focus:outline-none appearance-none pr-2"
                            >
                                {CATEGORIES.filter(c => c !== "Kita").map(c => (
                                    <option key={c} value={c} className="bg-paper dark:bg-ink dark:text-paper">{c}</option>
                                ))}
                            </select>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink2/30 dark:text-paper/30 shrink-0 pointer-events-none absolute right-4"><path d="M6 9l6 6 6-6" /></svg>
                        </FieldWrap>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3.5">
                        <FieldWrap className="flex-1" icon={<span className="text-ink2/40 dark:text-paper/40 shrink-0"><svg viewBox="0 0 24 24" fill="none" className="w-[15px] h-[15px]" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>}>
                            <input
                                type="text"
                                placeholder="Note (opsyonal)"
                                value={expNote}
                                onChange={e => setExpNote(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                            />
                        </FieldWrap>
                        <button
                            type="submit"
                            disabled={loggingExpense || !expAmount}
                            className="bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/20 active:scale-95 disabled:opacity-60 disabled:hover:shadow-none text-white text-[14px] font-semibold rounded-[14px] px-6 py-3.5 transition-all duration-200 sm:w-40 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 shrink-0"
                        >
                            {loggingExpense ? (
                                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 animate-spin" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                                    I-log
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {todaysExpenses.length > 0 ? (
                    <ul className="space-y-2.5">
                        {todaysExpenses.map(exp => (
                            <li key={exp.id} className="group flex items-center justify-between bg-white/40 dark:bg-white/[0.03] hover:bg-white/70 dark:hover:bg-white/[0.08] border border-black/[0.03] dark:border-white/[0.02] rounded-2xl px-4 sm:px-5 py-3.5 transition-all duration-200">
                                <span className="text-ink dark:text-paper truncate pr-2">
                                    <span className="font-mono font-bold text-[14px] sm:text-[15px]">₱{window.peso(exp.amount)}</span>
                                    <span className="text-[13px] font-medium text-ink2/60 dark:text-paper/50 ml-1.5">— {exp.desc || exp.category}</span>
                                </span>
                                <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    aria-label="Alisin"
                                    className="text-ink2/30 hover:text-expense dark:text-paper/30 dark:hover:text-[#F38C80] p-1.5 rounded-full hover:bg-expense/10 dark:hover:bg-[#B5483B]/20 transition-all duration-200 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 active:scale-90"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" strokeWidth="2.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl bg-white/40 dark:bg-black/10 border border-dashed border-black/10 dark:border-white/10">
                        <div className="w-12 h-12 rounded-[14px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-ink2/30 dark:text-paper/20 mb-3">
                            <svg viewBox="0 0 24 24" fill="none" className="w-[22px] h-[22px]" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
                        </div>
                        <p className="text-[13px] font-semibold text-ink2/70 dark:text-paper/60">Wala ka pang na-log na gastos ngayon</p>
                        <p className="text-[11.5px] text-ink2/50 dark:text-paper/40 mt-1">Idagdag sa itaas para masubaybayan ang araw mo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
