// components/AllowanceCalculator.js

window.AllowanceCalculator = function AllowanceCalculator({ user }) {
    const { useState, useEffect, useRef, useMemo } = React;

    const uid = user?.uid || window.TipidAuth?.currentUser?.uid || null;

    // Fall back to the same list dashboard.html defines, in case this page
    // ever loads before/without that inline script setting window.CATEGORIES.
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

    // ---- real entries, via window.TipidData (same source dashboard.html uses) ----
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

    // ---- browser notification helper (no server needed; works while the browser is open) ----
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

    // restore notif preference per user
    useEffect(() => {
        if (!uid) return;
        const pref = localStorage.getItem(`tipid_notif_${uid}`);
        if (pref === "on" && typeof Notification !== "undefined" && Notification.permission === "granted") {
            setNotifEnabled(true);
        }
    }, [uid]);

    // ---- wait for window.TipidData (firebase-data.js) to finish loading ----
    useEffect(() => {
        if (window.TipidData) { setDataReady(true); return; }
        const handler = () => setDataReady(true);
        window.addEventListener("tipid-data-ready", handler, { once: true });
        return () => window.removeEventListener("tipid-data-ready", handler);
    }, []);

    // ---- 1. Load saved allowance settings from Firestore on mount ----
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

    // ---- 2. Auto-save (debounced) whenever inputs change, after initial load ----
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [salary, bills, savings, paydayDate, loaded, uid]);

    // ---- 3. Live-listen to entries via the shared TipidData layer ----
    // (same subscribeEntries() dashboard.html uses — one source of truth for schema)
    useEffect(() => {
        if (!uid || !dataReady || !window.TipidData) return;
        const unsub = window.TipidData.subscribeEntries(
            uid,
            (list) => setEntries(list),
            (err) => console.error("Failed to subscribe to entries:", err)
        );
        return unsub;
    }, [uid, dataReady]);

    // ---- derive "today's" real spending from the full entries list ----
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

    // ---- 4. Fire alerts (banner + optional browser notification) when thresholds are crossed ----
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOverBudget, isNearLimit, isPaydaySoon, loaded]);

    const handleLogExpense = async (e) => {
        e.preventDefault();
        const amt = parseFloat(expAmount);
        if (!amt || amt <= 0 || !uid || !window.TipidData) return;

        try {
            setLoggingExpense(true);
            // Routed through TipidData.addExpense so this writes the exact same
            // shape (type/desc/amount/category/method) that Dashboard's
            // SmartSummary and ExpenseChart expect — no more "undefined" category.
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

    // ---- banner content (priority: over-budget > near-limit > payday) ----
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
        danger: "bg-expense/10 border-expense/25 text-expense",
        warning: "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400",
        info: "bg-peso/10 dark:bg-pesoLight/10 border-peso/25 dark:border-pesoLight/25 text-peso dark:text-pesoLight"
    };

    const bannerIcon = {
        danger: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" /><path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
        ),
        warning: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
        ),
        info: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" />
            </svg>
        )
    };

    // ---- purely visual: how full today's spending is, for the progress bar ----
    const spendRatio = dailySafe > 0 ? Math.min(spentToday / dailySafe, 1) : 0;
    const spendPct = Math.round(spendRatio * 100);
    const barTone = isOverBudget ? "bg-expense" : isNearLimit ? "bg-amber-500" : "bg-peso dark:bg-pesoLight";

    const fieldIcon = {
        salary: (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-1" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
        ),
        bills: (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" />
            </svg>
        ),
        savings: (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 9V6a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1v3.4a1 1 0 0 0 .6.92l1.9.82" />
                <path d="M3 9h14a4 4 0 0 1 4 4v2a2 2 0 0 1-2 2h-1" />
                <path d="M3 9v10a1 1 0 0 0 1 1h3v-4" />
                <path d="M13 9v12" />
                <circle cx="7" cy="5" r="0" />
            </svg>
        ),
        payday: (
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 2v4" /><path d="M16 2v4" />
            </svg>
        )
    };

    return (
        <div className="space-y-6 fade-up relative">
            {/* Toast stack */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`fade-up pointer-events-auto rounded-2xl px-4 py-3 text-sm font-medium shadow-lg border backdrop-blur-xl flex items-center gap-2 ${
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
                <div className={`fade-up flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${bannerStyles[banner.tone]}`}>
                    {bannerIcon[banner.tone]}
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{banner.title}</p>
                        <p className="text-xs opacity-80 mt-0.5">{banner.message}</p>
                    </div>
                    <button
                        onClick={() => setDismissedBanner(true)}
                        className="text-xs font-mono opacity-60 hover:opacity-100 transition-opacity duration-150 shrink-0 mt-0.5"
                        aria-label="Isara ang alert"
                    >
                        alisin
                    </button>
                </div>
            )}

            <div className="bg-white/85 dark:bg-ink2/30 backdrop-blur-xl rounded-[1.75rem] border border-line/50 dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] p-6 sm:p-7">
                <div className="flex items-center justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-peso/10 dark:bg-pesoLight/10 flex items-center justify-center text-peso dark:text-pesoLight shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18" /><path d="M7 15h3" />
                            </svg>
                        </div>
                        <h3 className="font-display text-lg font-semibold text-ink dark:text-paper">Daily Allowance Calculator</h3>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] font-mono text-ink2/50 dark:text-paper/40 hidden sm:inline-flex items-center gap-1.5">
                            {saving && <span className="w-1.5 h-1.5 rounded-full bg-peso dark:bg-pesoLight animate-pulse" />}
                            {saving ? "Sini-save..." : loaded ? "Naka-save" : ""}
                        </span>
                        <button
                            onClick={toggleNotifications}
                            className={`text-[11px] font-mono px-3 py-1.5 rounded-full border transition-all duration-150 flex items-center gap-1.5 ${
                                notifEnabled
                                    ? "bg-peso/10 border-peso/30 text-peso dark:text-pesoLight"
                                    : "bg-paper/50 dark:bg-ink2/40 border-line dark:border-ink2/50 text-ink2/60 dark:text-paper/50 hover:border-line dark:hover:border-white/20"
                            }`}
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                {!notifEnabled && <path d="M2 2l20 20" />}
                            </svg>
                            <span className="hidden xs:inline">{notifEnabled ? "Notifications ON" : "Notifications OFF"}</span>
                        </button>
                    </div>
                </div>

                {!loaded ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 animate-pulse">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className="h-[70px] rounded-2xl bg-paper/60 dark:bg-ink2/40 border border-line/40 dark:border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-ink2/60 dark:text-paper/50 mb-1.5 uppercase tracking-wider">
                                <span className="text-peso/60 dark:text-pesoLight/60">{fieldIcon.salary}</span>
                                Salary / Income
                            </label>
                            <input
                                type="number"
                                placeholder="₱18,000"
                                value={salary}
                                onChange={e => setSalary(e.target.value)}
                                className="w-full bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-peso/40 focus:border-peso/40 transition-all duration-200 font-medium text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-ink2/60 dark:text-paper/50 mb-1.5 uppercase tracking-wider">
                                <span className="text-peso/60 dark:text-pesoLight/60">{fieldIcon.bills}</span>
                                Fixed Bills
                            </label>
                            <input
                                type="number"
                                placeholder="₱8,000"
                                value={bills}
                                onChange={e => setBills(e.target.value)}
                                className="w-full bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-peso/40 focus:border-peso/40 transition-all duration-200 font-medium text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-ink2/60 dark:text-paper/50 mb-1.5 uppercase tracking-wider">
                                <span className="text-peso/60 dark:text-pesoLight/60">{fieldIcon.savings}</span>
                                Savings Goal
                            </label>
                            <input
                                type="number"
                                placeholder="₱2,000"
                                value={savings}
                                onChange={e => setSavings(e.target.value)}
                                className="w-full bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-peso/40 focus:border-peso/40 transition-all duration-200 font-medium text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-mono text-ink2/60 dark:text-paper/50 mb-1.5 uppercase tracking-wider">
                                <span className="text-peso/60 dark:text-pesoLight/60">{fieldIcon.payday}</span>
                                Susunod na Payday
                            </label>
                            <input
                                type="date"
                                value={paydayDate}
                                onChange={e => setPaydayDate(e.target.value)}
                                className="w-full bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-peso/40 focus:border-peso/40 transition-all duration-200 font-medium text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                            />
                            {paydayDate && (
                                <p className="text-[11px] text-ink2/50 dark:text-paper/40 mt-1.5 font-mono flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-peso/60 dark:bg-pesoLight/60" />
                                    {daysLeft} araw na lang
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-line/50 dark:border-white/10">
                    <div className="bg-paperDim/50 dark:bg-ink2/40 p-5 rounded-2xl border border-line/40 dark:border-white/5">
                        <p className="text-xs font-mono uppercase tracking-wider text-ink2/60 dark:text-paper/50 mb-1">Remaining Budget</p>
                        <p className={`font-display text-2xl font-semibold ${remaining < 0 ? 'text-expense' : 'text-ink dark:text-paper'}`}>
                            ₱{window.peso(remaining)}
                        </p>
                    </div>
                    <div className="bg-peso/10 dark:bg-pesoLight/10 p-5 rounded-2xl border border-peso/20 dark:border-pesoLight/20">
                        <p className="text-xs font-mono uppercase tracking-wider text-peso dark:text-pesoLight mb-1">Safe Daily Spending</p>
                        <p className="font-display text-3xl font-bold text-peso dark:text-pesoLight">
                            ₱{window.peso(dailySafe)}<span className="text-sm font-body font-normal text-peso/70 dark:text-pesoLight/70"> / day</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Today's real spending, linked to the calculator above */}
            <div className="bg-white/85 dark:bg-ink2/30 backdrop-blur-xl rounded-[1.75rem] border border-line/50 dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] p-6 sm:p-7">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-peso/10 dark:bg-pesoLight/10 flex items-center justify-center text-peso dark:text-pesoLight shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px]" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                        </svg>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-ink dark:text-paper">Ngayong Araw</h3>
                </div>
                <p className="text-xs text-ink2/60 dark:text-paper/50 mb-5 pl-12 -mt-1">I-log ang ginastos mo para makita agad kung nasa loob ka pa ng safe daily spending. Lalabas din ito sa Dashboard mo.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-paperDim/50 dark:bg-ink2/40 p-5 rounded-2xl border border-line/40 dark:border-white/5">
                        <p className="text-xs font-mono uppercase tracking-wider text-ink2/60 dark:text-paper/50 mb-1">Nagastos Ngayon</p>
                        <p className="font-display text-2xl font-semibold text-ink dark:text-paper">₱{window.peso(spentToday)}</p>
                    </div>
                    <div className={`p-5 rounded-2xl border ${remainingToday < 0 ? 'bg-expense/10 border-expense/20' : 'bg-peso/10 dark:bg-pesoLight/10 border-peso/20 dark:border-pesoLight/20'}`}>
                        <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${remainingToday < 0 ? 'text-expense' : 'text-peso dark:text-pesoLight'}`}>
                            {remainingToday < 0 ? 'Sobra sa Budget' : 'Natitirang Pwedeng Gastusin'}
                        </p>
                        <p className={`font-display text-2xl font-bold ${remainingToday < 0 ? 'text-expense' : 'text-peso dark:text-pesoLight'}`}>
                            ₱{window.peso(Math.abs(remainingToday))}
                        </p>
                    </div>
                </div>

                {dailySafe > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between text-[11px] font-mono text-ink2/50 dark:text-paper/40 mb-1.5">
                            <span>{spendPct}% ng safe daily spending</span>
                            <span>₱{window.peso(spentToday)} / ₱{window.peso(dailySafe)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-paperDim dark:bg-ink2/60 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${barTone}`}
                                style={{ width: `${spendRatio * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <form onSubmit={handleLogExpense} className="flex flex-col gap-3 mb-5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="number"
                            placeholder="Halaga (₱)"
                            value={expAmount}
                            onChange={e => setExpAmount(e.target.value)}
                            className="flex-1 bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-peso/40 focus:border-peso/40 transition-all duration-200 text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                        />
                        <select
                            value={expCategory}
                            onChange={e => setExpCategory(e.target.value)}
                            className="flex-1 bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-peso/40 focus:border-peso/40 transition-all duration-200 text-ink dark:text-paper"
                        >
                            {CATEGORIES.filter(c => c !== "Kita").map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Note (opsyonal)"
                            value={expNote}
                            onChange={e => setExpNote(e.target.value)}
                            className="flex-1 bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-peso/40 focus:border-peso/40 transition-all duration-200 text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                        />
                        <button
                            type="submit"
                            disabled={loggingExpense || !expAmount}
                            className="tap-scale bg-peso hover:bg-pesoDeep disabled:opacity-50 disabled:hover:bg-peso text-white text-sm font-medium rounded-2xl px-6 py-3 transition-colors duration-200 sm:w-40 flex items-center justify-center gap-1.5 shadow-[0_6px_16px_-6px_rgba(21,158,109,0.55)] disabled:shadow-none"
                        >
                            {loggingExpense ? (
                                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 animate-spin" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14" /><path d="M5 12h14" />
                                    </svg>
                                    I-log
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {todaysExpenses.length > 0 ? (
                    <ul className="space-y-2">
                        {todaysExpenses.map(exp => (
                            <li key={exp.id} className="group flex items-center justify-between bg-paperDim/40 dark:bg-ink2/30 hover:bg-paperDim/70 dark:hover:bg-ink2/50 rounded-xl px-4 py-2.5 text-sm transition-colors duration-150">
                                <span className="text-ink dark:text-paper truncate">
                                    <span className="font-mono font-medium">₱{window.peso(exp.amount)}</span>
                                    <span className="text-ink2/50 dark:text-paper/40"> — {exp.desc || exp.category}</span>
                                </span>
                                <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="text-ink2/30 hover:text-expense text-xs font-mono transition-colors duration-150 shrink-0 ml-3 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    alisin
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-2xl border border-dashed border-line/60 dark:border-white/10">
                        <div className="w-10 h-10 rounded-full bg-paperDim/70 dark:bg-ink2/50 flex items-center justify-center text-ink2/40 dark:text-paper/30 mb-2.5">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                                <path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h6" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-ink2/60 dark:text-paper/40">Wala ka pang na-log na gastos ngayon</p>
                        <p className="text-xs text-ink2/40 dark:text-paper/30 mt-0.5">Idagdag sa itaas para masubaybayan ang araw mo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
