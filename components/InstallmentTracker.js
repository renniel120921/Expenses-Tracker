// components/InstallmentTracker.js

// --- REAL SVG ICONS SUITE ---
const TRACKER_ICONS = {
    Plus: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Check: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Pencil: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
    ),
    Wallet: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
    ),
    Calendar: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Trash: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Eye: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Sparkles: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
        </svg>
    ),
    Clock: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    Shield: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Zap: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    ChevronDown: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    ChevronUp: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="18 15 12 9 6 15" />
        </svg>
    )
};

// Date helpers
function addMonths(date, months) {
    return window.TipidCore.addMonthsClamped(date, months);
}

function formatDatePH(date) {
    if (!date) return "—";
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function resolveStartDate(item) {
    if (item.startDate) return new Date(item.startDate);
    const fromId = Number(item.id);
    return isNaN(fromId) ? new Date() : new Date(fromId);
}

function monthsDueSoFar(startDateStr, today, terms) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const t = new Date(today);
    t.setHours(0, 0, 0, 0);
    if (isNaN(start.getTime()) || t < start) return 0;

    let months = (t.getFullYear() - start.getFullYear()) * 12 + (t.getMonth() - start.getMonth());
    if (t.getDate() < start.getDate()) months -= 1;

    const dueCount = months + 1;
    return Math.max(0, Math.min(dueCount, terms));
}

// Bank & E-Wallet catalog
const WALLET_META = window.SUPPORTED_WALLETS || [
    { id: "Cash", name: "Cash", type: "cash", color: "from-[#1F6F54] to-[#123D2E]", text: "CASH", font: "font-display tracking-[0.15em]", textStyle: "text-white" },
    { id: "GCash", name: "GCash", type: "ewallet", color: "from-[#0052FE] to-[#004ADB]", text: "GCash", font: "font-sans italic font-extrabold tracking-tighter", textStyle: "text-white" },
    { id: "Maya", name: "Maya", type: "ewallet", color: "from-[#0A0A0A] via-[#171717] to-[#242424]", text: "maya", font: "font-sans font-black tracking-widest lowercase", textStyle: "text-white" },
    { id: "ShopeePay", name: "ShopeePay", type: "ewallet", color: "from-[#EE4D2D] to-[#D8390F]", text: "ShopeePay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "GrabPay", name: "GrabPay", type: "ewallet", color: "from-[#00B14F] to-[#009344]", text: "GrabPay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "BDO", name: "BDO Unibank", type: "bank", color: "from-[#002A86] to-[#00133D]", text: "BDO", font: "font-sans font-black tracking-[0.15em]", textStyle: "text-white" },
    { id: "BPI", name: "BPI", type: "bank", color: "from-[#B30000] to-[#5C0000]", text: "BPI", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "UnionBank", name: "UnionBank", type: "bank", color: "from-[#EA5B0C] to-[#8A2E00]", text: "UnionBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "SecurityBank", name: "Security Bank", type: "bank", color: "from-[#005EB8] to-[#002C56]", text: "SecurityBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" }
];

function walletMeta(id) {
    return WALLET_META.find(w => w.id === id) || { id, name: id, type: "bank", text: id, font: "font-sans font-bold tracking-tight", textStyle: "text-white", color: "from-[#1F6F54] to-[#123D2E]" };
}

function MiniWalletChip({ id, meta, active, onClick }) {
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
                    <TRACKER_ICONS.Check size={9} className="text-peso" />
                </span>
            )}
        </button>
    );
}

// Realistic Philippine Demonstration Sample Dataset
const SAMPLE_DEMO_INSTALLMENTS = [
    {
        id: "demo-inst-1",
        name: "iPhone 15 Pro (256GB)",
        platform: "SPayLater",
        paymentMethod: "GCash",
        srp: 70990,
        totalAmount: 76500,
        terms: 12,
        paidMonths: 5,
        monthly: 6375,
        startDate: new Date(Date.now() - 86400000 * 30 * 5).toISOString().split("T")[0]
    },
    {
        id: "demo-inst-2",
        name: "Yamaha Aerox Scooter",
        platform: "Home Credit",
        paymentMethod: "BDO",
        srp: 124000,
        totalAmount: 144000,
        terms: 24,
        paidMonths: 14,
        monthly: 6000,
        startDate: new Date(Date.now() - 86400000 * 30 * 14).toISOString().split("T")[0]
    },
    {
        id: "demo-inst-3",
        name: "MacBook Air M2 Work Setup",
        platform: "Billease",
        paymentMethod: "Maya",
        srp: 59990,
        totalAmount: 64500,
        terms: 6,
        paidMonths: 4,
        monthly: 10750,
        startDate: new Date(Date.now() - 86400000 * 30 * 4).toISOString().split("T")[0]
    },
    {
        id: "demo-inst-4",
        name: "Panasonic Inverter Refrigerator",
        platform: "Credit Card",
        paymentMethod: "BPI",
        srp: 24990,
        totalAmount: 24990,
        terms: 12,
        paidMonths: 12,
        monthly: 2082.50,
        startDate: new Date(Date.now() - 86400000 * 30 * 13).toISOString().split("T")[0]
    }
];

window.InstallmentTracker = function InstallmentTracker({ uid, onSummaryChange }) {
    const { useState, useEffect, useMemo } = React;
    const peso = window.peso || ((n) => Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 }));

    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem(`tipid_installments_${uid}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [useDemoMode, setUseDemoMode] = useState(false);
    const [filterTab, setFilterTab] = useState("active"); // 'all', 'active', 'completed'
    const [providerFilter, setProviderFilter] = useState("all");
    const [sortBy, setSortBy] = useState("dueSoonest");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [walletIds, setWalletIds] = useState(["Cash"]);

    // Form State
    const [name, setName] = useState("");
    const [platform, setPlatform] = useState("SPayLater");
    const [srp, setSrp] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [terms, setTerms] = useState("");
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    // Fetch configured wallets
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (window.FirestoreAPI && window.db) {
                    const { doc, getDoc } = window.FirestoreAPI;
                    const snap = await getDoc(doc(window.db, "users", uid));
                    if (!cancelled && snap.exists() && snap.data().wallets) {
                        const ids = Object.keys(snap.data().wallets);
                        setWalletIds(ids.includes("Cash") ? ids : ["Cash", ...ids]);
                    }
                }
            } catch (_) {}
        })();
        return () => { cancelled = true; };
    }, [uid]);

    useEffect(() => {
        localStorage.setItem(`tipid_installments_${uid}`, JSON.stringify(items));
    }, [items, uid]);

    // Active dataset
    const activeItems = useMemo(() => {
        if (useDemoMode || items.length === 0) {
            return useDemoMode ? SAMPLE_DEMO_INSTALLMENTS : items;
        }
        return items;
    }, [items, useDemoMode]);

    // Available providers
    const platforms = ["SPayLater", "LazPayLater", "Home Credit", "Billease", "Maya EasyCredit", "GGives", "Motorcycle Loan", "Credit Card", "Other"];

    // Financial calculations
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalMonthly = 0;
        let totalOriginal = 0;
        let totalPaid = 0;
        let totalRemaining = 0;
        let overdueCount = 0;
        let activeCount = 0;
        let completedCount = 0;
        let nearestDue = null;
        let latestCompletion = null;

        activeItems.forEach(item => {
            const isDone = item.paidMonths >= item.terms;
            const startD = resolveStartDate(item);
            const legacyDownpayment = item.downpayment || 0;
            const paidSoFar = legacyDownpayment + (item.paidMonths * item.monthly);
            const remaining = Math.max(0, item.totalAmount - paidSoFar);

            totalOriginal += item.totalAmount;
            totalPaid += paidSoFar;

            if (isDone) {
                completedCount++;
            } else {
                activeCount++;
                totalMonthly += item.monthly;
                totalRemaining += remaining;

                const nextDueDate = addMonths(startD, item.paidMonths);
                const finalDate = addMonths(startD, item.terms - 1);

                if (nextDueDate < today) overdueCount++;
                if (!nearestDue || nextDueDate < nearestDue) nearestDue = nextDueDate;
                if (!latestCompletion || finalDate > latestCompletion) latestCompletion = finalDate;
            }
        });

        const freedomProgress = totalOriginal > 0 ? Math.min(100, Math.round((totalPaid / totalOriginal) * 100)) : 100;

        return {
            totalMonthly,
            totalOriginal,
            totalPaid,
            totalRemaining,
            overdueCount,
            activeCount,
            completedCount,
            nearestDue,
            latestCompletion,
            freedomProgress
        };
    }, [activeItems]);

    // Send summary stats upward if requested
    useEffect(() => {
        if (typeof onSummaryChange === "function") {
            onSummaryChange(stats);
        }
    }, [stats, onSummaryChange]);

    // Filtered and Sorted list
    const filteredList = useMemo(() => {
        return activeItems.filter(item => {
            const isDone = item.paidMonths >= item.terms;
            if (filterTab === "active" && isDone) return false;
            if (filterTab === "completed" && !isDone) return false;
            if (providerFilter !== "all" && item.platform !== providerFilter) return false;
            return true;
        }).sort((a, b) => {
            const isDoneA = a.paidMonths >= a.terms;
            const isDoneB = b.paidMonths >= b.terms;
            if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;

            const startA = resolveStartDate(a);
            const startB = resolveStartDate(b);
            const dueA = addMonths(startA, a.paidMonths).getTime();
            const dueB = addMonths(startB, b.paidMonths).getTime();

            if (sortBy === "dueSoonest") return dueA - dueB;
            if (sortBy === "highestMonthly") return (b.monthly || 0) - (a.monthly || 0);
            if (sortBy === "highestRemaining") {
                const remA = a.totalAmount - (a.paidMonths * a.monthly);
                const remB = b.totalAmount - (b.paidMonths * b.monthly);
                return remB - remA;
            }
            return Number(b.id || 0) - Number(a.id || 0);
        });
    }, [activeItems, filterTab, providerFilter, sortBy]);

    // Live preview numbers
    let amtNum = NaN;
    try { if (totalAmount !== "") amtNum = window.TipidCore.money(totalAmount); } catch (_) {}
    const termsNum = parseInt(terms);
    const srpNum = srp.trim() === "" ? null : parseFloat(srp);
    const previewMonthly = (!isNaN(amtNum) && !isNaN(termsNum) && termsNum > 0) ? amtNum / termsNum : null;
    const markupAmt = (srpNum !== null && !isNaN(srpNum) && !isNaN(amtNum)) ? amtNum - srpNum : null;

    const handleAdd = async (e) => {
        e.preventDefault();
        let amt = NaN;
        try { amt = window.TipidCore.money(totalAmount); } catch (_) {}
        const t = parseInt(terms);
        const srpVal = srp.trim() === "" ? null : parseFloat(srp);

        if (!name.trim() || isNaN(amt) || amt <= 0 || isNaN(t) || t <= 0) {
            return Swal.fire({ icon: 'warning', title: 'Hold on!', text: 'Please complete the installment details.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' } });
        }

        let paidMonths = 0;
        const suggested = monthsDueSoFar(startDate, new Date(), t);

        if (suggested > 0) {
            const { value: confirmedPaid, isConfirmed } = await Swal.fire({
                icon: 'question',
                title: 'How many months have you already paid?',
                text: `The first payment was due on ${formatDatePH(new Date(startDate))}. Based on this, you would have paid approximately ${suggested} months up to now.`,
                input: 'number',
                inputValue: suggested,
                inputAttributes: { min: 0, max: String(t), step: 1 },
                showCancelButton: true,
                confirmButtonText: 'Confirm',
                cancelButtonText: 'No payments made yet',
                confirmButtonColor: '#1F6F54',
                cancelButtonColor: '#33443A',
                customClass: { popup: 'tipid-swal' },
                inputValidator: (value) => {
                    if (value === '' || value === null || value === undefined) return 'Please enter a number';
                    const n = Number(value);
                    if (isNaN(n) || n < 0 || n > t) return `Must be between 0 and ${t}`;
                }
            });
            if (isConfirmed) paidMonths = Number(confirmedPaid);
        }

        const newItem = {
            id: Date.now().toString(),
            name: name.trim(),
            platform,
            paymentMethod,
            srp: srpVal,
            totalAmount: amt,
            terms: t,
            paidMonths,
            monthly: window.TipidCore.fromCentavos(Math.round(window.TipidCore.toCentavos(amt) / t)),
            startDate
        };

        setItems([newItem, ...items]);
        setName("");
        setSrp("");
        setTotalAmount("");
        setTerms("");
        setStartDate(new Date().toISOString().split("T")[0]);
        setIsFormOpen(false);

        Swal.fire({ icon: 'success', title: 'Saved!', text: 'New installment plan has been tracked.', confirmButtonColor: '#1F6F54', timer: 1500, showConfirmButton: false, customClass: { popup: 'tipid-swal' } });
    };

    const handlePay = (id) => {
        if (String(id).startsWith("demo-")) {
            return Swal.fire({ icon: 'info', title: 'Sample Demo Plan', text: 'This is a sample demonstration record for preview.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' } });
        }

        setItems(items.map(item => {
            if (item.id === id && item.paidMonths < item.terms) {
                return { ...item, paidMonths: item.paidMonths + 1 };
            }
            return item;
        }));

        Swal.fire({
            icon: 'success',
            title: 'Payment Recorded!',
            text: 'You are one month closer to total debt freedom! 🎉',
            confirmButtonColor: '#1F6F54',
            timer: 1800,
            showConfirmButton: false,
            customClass: { popup: 'tipid-swal' }
        });
    };

    const handleDelete = (id) => {
        if (String(id).startsWith("demo-")) {
            return Swal.fire({ icon: 'info', title: 'Sample Demo Plan', text: 'Sample records cannot be permanently deleted.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' } });
        }

        Swal.fire({
            title: 'Delete this plan?',
            text: 'This installment plan will be permanently removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B5483B',
            cancelButtonColor: '#33443A',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            customClass: { popup: 'tipid-swal' },
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                setItems(items.filter(item => item.id !== id));
            }
        });
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* --- DEBT FREEDOM & MILESTONE BANNER --- */}
            <div className="bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-peso to-gold" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 border border-peso/20 shadow-xs">
                            <TRACKER_ICONS.Shield size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-[1.18rem] sm:text-[1.25rem] font-bold text-ink dark:text-paper leading-tight">
                                Overall Freedom Progress
                            </h3>
                            <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                Total installment principal cleared across all plans
                                {useDemoMode && <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 font-bold font-mono">(Sample Demo Data)</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setUseDemoMode(v => !v)}
                            className={`tap-scale px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                                useDemoMode
                                    ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
                                    : "bg-white dark:bg-ink2/60 text-ink2/70 dark:text-paper/70 border-black/10 dark:border-white/10 hover:bg-black/5"
                            }`}
                        >
                            <TRACKER_ICONS.Eye size={13} />
                            <span>{useDemoMode ? "Live Data" : "Preview Demo"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsFormOpen(v => !v)}
                            className="tap-scale px-3.5 py-1.5 rounded-xl bg-peso text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:bg-pesoLight"
                        >
                            <TRACKER_ICONS.Plus size={14} />
                            <span>{isFormOpen ? "Close Form" : "New Plan"}</span>
                        </button>
                    </div>
                </div>

                {/* Big Progress Bar */}
                <div className="space-y-2 mb-6">
                    <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-ink2/60 dark:text-paper/50">Paid: <strong>₱{peso(stats.totalPaid)}</strong> of ₱{peso(stats.totalOriginal)}</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{stats.freedomProgress}% Cleared</span>
                    </div>
                    <div className="h-3.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                        <div
                            className="h-full bg-gradient-to-r from-gold via-peso to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-xs"
                            style={{ width: `${stats.freedomProgress}%` }}
                        />
                    </div>
                </div>

                {/* Milestone Targets Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-black/5 dark:border-white/5">
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-3.5 rounded-xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase text-ink2/50 dark:text-paper/40">Monthly Obligation</p>
                        <p className="font-mono text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                            ₱{peso(stats.totalMonthly)}
                        </p>
                    </div>

                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-3.5 rounded-xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase text-ink2/50 dark:text-paper/40">Remaining Debt</p>
                        <p className="font-mono text-base sm:text-lg font-bold text-ink dark:text-paper mt-0.5">
                            ₱{peso(stats.totalRemaining)}
                        </p>
                    </div>

                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-3.5 rounded-xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase text-ink2/50 dark:text-paper/40">Debt-Free Target</p>
                        <p className="font-display text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
                            {stats.latestCompletion ? stats.latestCompletion.toLocaleDateString("en-PH", { month: "short", year: "numeric" }) : "All Clear! 🎉"}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- ADD NEW PLAN FORM (EXPANDABLE) --- */}
            {isFormOpen && (
                <div className="bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios p-6 sm:p-8 fade-up">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-gold/10 dark:bg-gold/15 text-gold flex items-center justify-center shrink-0 border border-gold/20 shadow-xs">
                                <TRACKER_ICONS.Plus size={18} />
                            </span>
                            <div>
                                <h3 className="font-display text-[1.15rem] font-bold text-ink dark:text-paper leading-tight">
                                    New Installment Plan
                                </h3>
                                <p className="text-[11px] text-ink2/50 dark:text-paper/50">Add financing obligation to your tracking calendar</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-ink2/60 dark:text-paper/60 hover:bg-black/10"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleAdd} className="space-y-5">
                        {/* 1. Item & Provider */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-ink2/50 dark:text-paper/40 uppercase tracking-widest px-1">Item Description & Provider</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                    <TRACKER_ICONS.Pencil size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="e.g. iPhone 15 Pro, Laptop, Appliance"
                                        className="w-full bg-transparent py-3 text-xs sm:text-sm text-ink dark:text-paper focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                    <TRACKER_ICONS.Wallet size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                                    <select
                                        value={platform}
                                        onChange={e => setPlatform(e.target.value)}
                                        className="w-full bg-transparent py-3 text-xs sm:text-sm text-ink dark:text-paper focus:outline-none cursor-pointer"
                                    >
                                        {platforms.map(p => <option key={p} value={p} className="bg-paper dark:bg-ink">{p}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Pricing & Financing */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-ink2/50 dark:text-paper/40 uppercase tracking-widest px-1">Pricing & Total Financing Cost</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                    <span className="text-ink2/40 dark:text-paper/40 font-mono text-sm shrink-0">₱</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={srp}
                                        onChange={e => setSrp(e.target.value)}
                                        placeholder="Cash Price / SRP (optional)"
                                        className="w-full bg-transparent py-3 text-xs sm:text-sm font-mono text-ink dark:text-paper focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                    <span className="text-ink2/40 dark:text-paper/40 font-mono text-sm shrink-0">₱</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={totalAmount}
                                        onChange={e => setTotalAmount(e.target.value)}
                                        placeholder="Total Financing Cost (all months)"
                                        className="w-full bg-transparent py-3 text-xs sm:text-sm font-mono text-ink dark:text-paper focus:outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {previewMonthly !== null && (
                                <div className="p-3 rounded-xl bg-peso/10 border border-peso/20 text-xs font-mono text-peso dark:text-pesoLight flex items-center justify-between">
                                    <span>Calculated Monthly: <strong>₱{peso(previewMonthly)}</strong> / month</span>
                                    {markupAmt !== null && (
                                        <span>Interest Markup: <strong>{markupAmt >= 0 ? '+' : ''}₱{peso(markupAmt)}</strong></span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 3. Duration & First Due Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-ink2/50 dark:text-paper/40 uppercase tracking-widest px-1">Duration & First Due Date</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="flex items-center gap-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                    <TRACKER_ICONS.Clock size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={terms}
                                        onChange={e => setTerms(e.target.value)}
                                        placeholder="Duration (Months e.g. 6, 12, 24)"
                                        className="w-full bg-transparent py-3 text-xs sm:text-sm text-ink dark:text-paper focus:outline-none"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                    <TRACKER_ICONS.Calendar size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full bg-transparent py-3 text-xs sm:text-sm font-mono text-ink dark:text-paper focus:outline-none cursor-pointer"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. Payment Method Mini-Chips */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-ink2/50 dark:text-paper/40 uppercase tracking-widest px-1">Funding Wallet / Card</label>
                            <div className="flex overflow-x-auto gap-2.5 pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                                {walletIds.map(id => {
                                    const meta = walletMeta(id);
                                    return (
                                        <MiniWalletChip
                                            key={id}
                                            id={id}
                                            meta={meta}
                                            active={paymentMethod === id}
                                            onClick={() => setPaymentMethod(id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-peso to-pesoLight text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2"
                        >
                            Save Installment Plan
                        </button>
                    </form>
                </div>
            )}

            {/* --- LIST CONTROLS & FILTER ROW --- */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                {/* Active vs Completed Tabs */}
                <div role="group" aria-label="Installment status" className="inline-flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                    {[
                        { key: "active", label: `Active (${stats.activeCount})` },
                        { key: "completed", label: `Completed (${stats.completedCount})` },
                        { key: "all", label: `All Plans (${activeItems.length})` }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setFilterTab(tab.key)}
                            className={`tap-scale px-3 py-1.5 rounded-lg transition-all ${
                                filterTab === tab.key
                                    ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-bold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-ink"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sort / Provider Selectors */}
                <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                    <select
                        value={providerFilter}
                        onChange={e => setProviderFilter(e.target.value)}
                        className="py-1.5 pl-2.5 pr-6 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 font-medium text-ink dark:text-paper cursor-pointer"
                    >
                        <option value="all">All Providers</option>
                        {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="py-1.5 pl-2.5 pr-6 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 font-medium text-ink dark:text-paper cursor-pointer"
                    >
                        <option value="dueSoonest">Due Soonest</option>
                        <option value="highestMonthly">Highest Monthly</option>
                        <option value="highestRemaining">Highest Remaining</option>
                    </select>
                </div>
            </div>

            {/* --- INSTALLMENT PLANS CARDS LIST --- */}
            <div className="space-y-4">
                {filteredList.length === 0 ? (
                    <div className="py-16 text-center flex flex-col items-center bg-white/40 dark:bg-black/10 rounded-3xl border border-black/5 dark:border-white/5">
                        <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-ink2/30 dark:text-paper/30 mb-3">
                            <TRACKER_ICONS.Check size={24} />
                        </div>
                        <p className="text-sm font-semibold text-ink dark:text-paper">
                            {filterTab === "completed" ? "No completed installment plans yet." : "No active installment plans. All clear!"}
                        </p>
                        <p className="text-xs text-ink2/50 dark:text-paper/40 mt-1 mb-4">
                            Log your SPayLater, Home Credit, or loans to track payoff timelines.
                        </p>
                        <button
                            type="button"
                            onClick={() => setUseDemoMode(true)}
                            className="tap-scale px-4 py-2 rounded-xl bg-peso text-white text-xs font-bold shadow-xs hover:bg-pesoLight"
                        >
                            Preview Sample Demo Plans
                        </button>
                    </div>
                ) : (
                    filteredList.map(item => {
                        const pct = Math.min(100, Math.round((item.paidMonths / item.terms) * 100));
                        const isDone = item.paidMonths >= item.terms;

                        const startD = resolveStartDate(item);
                        const completionDate = addMonths(startD, item.terms - 1);
                        const nextDueDate = isDone ? null : addMonths(startD, item.paidMonths);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isOverdue = !isDone && nextDueDate && nextDueDate < today;

                        const legacyDownpayment = item.downpayment || 0;
                        const markup = (item.srp !== null && item.srp !== undefined) ? item.totalAmount - item.srp : null;
                        const isDiscount = markup !== null && markup < 0;
                        const totalPaidSoFar = legacyDownpayment + (item.paidMonths * item.monthly);
                        const remaining = Math.max(0, item.totalAmount - totalPaidSoFar);
                        const method = walletMeta(item.paymentMethod || "Cash");

                        return (
                            <div
                                key={item.id}
                                className={`p-5 sm:p-6 rounded-[1.75rem] border transition-all duration-300 shadow-ios ${
                                    isDone
                                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20'
                                        : 'bg-white/80 dark:bg-ink2/30 border-white/80 dark:border-white/10 hover:shadow-iosLg'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4 gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink2/70 dark:text-paper/70">
                                                {item.platform}
                                            </span>

                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-ink2/70 dark:text-paper/70">
                                                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${method.color}`} />
                                                {method.name || method.text}
                                            </span>

                                            {isDone && (
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                                                    🎉 100% Paid Off!
                                                </span>
                                            )}

                                            {isOverdue && (
                                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                                                    ⚠️ Overdue
                                                </span>
                                            )}
                                        </div>

                                        <h4 className={`text-base sm:text-lg font-bold leading-tight ${isDone ? 'line-through text-ink2/50 dark:text-paper/50' : 'text-ink dark:text-paper'}`}>
                                            {item.name}
                                        </h4>
                                        <p className="text-xs text-ink2/60 dark:text-paper/50 font-mono mt-1">
                                            ₱{peso(item.monthly)} / month • Total ₱{peso(item.totalAmount)}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        aria-label="Delete plan"
                                        title="Delete installment plan"
                                        className="tap-scale p-2 rounded-full text-ink2/30 hover:text-expense hover:bg-expense/10 dark:hover:bg-expense/20 transition-colors"
                                    >
                                        <TRACKER_ICONS.Trash size={16} />
                                    </button>
                                </div>

                                {/* Financing Breakdown Pills */}
                                {(item.srp || legacyDownpayment > 0) && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-[11px] font-mono">
                                        {item.srp ? (
                                            <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl px-3 py-2 border border-black/5 dark:border-white/5">
                                                <p className="text-ink2/50 dark:text-paper/40 text-[9px] uppercase tracking-wider">Cash SRP</p>
                                                <p className="text-ink dark:text-paper font-semibold mt-0.5">₱{peso(item.srp)}</p>
                                            </div>
                                        ) : null}

                                        {markup !== null ? (
                                            <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl px-3 py-2 border border-black/5 dark:border-white/5">
                                                <p className="text-ink2/50 dark:text-paper/40 text-[9px] uppercase tracking-wider">
                                                    {isDiscount ? "Discount" : "Interest Markup"}
                                                </p>
                                                <p className={`font-semibold mt-0.5 ${isDiscount ? 'text-emerald-700 dark:text-emerald-400' : (markup > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink dark:text-paper')}`}>
                                                    {isDiscount ? '-' : (markup > 0 ? '+' : '')}₱{peso(Math.abs(markup))}
                                                </p>
                                            </div>
                                        ) : null}

                                        {legacyDownpayment > 0 ? (
                                            <div className="bg-black/[0.03] dark:bg-white/[0.03] rounded-xl px-3 py-2 border border-black/5 dark:border-white/5">
                                                <p className="text-ink2/50 dark:text-paper/40 text-[9px] uppercase tracking-wider">Downpayment</p>
                                                <p className="text-ink dark:text-paper font-semibold mt-0.5">₱{peso(legacyDownpayment)}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Progress Bar & Completion Callout */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs font-mono text-ink2/60 dark:text-paper/60">
                                        <span>Progress: <strong>{item.paidMonths} of {item.terms}</strong> months</span>
                                        <span className="font-bold text-ink dark:text-paper">{pct}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-gold to-peso rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Target Payoff Milestone Card */}
                                <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 mb-3 border ${
                                    isDone
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-gold/10 dark:bg-gold/15 border-gold/20 text-ink dark:text-paper'
                                }`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                            isDone ? 'bg-emerald-500/20 text-emerald-700' : 'bg-gold/20 text-gold'
                                        }`}>
                                            <TRACKER_ICONS.Calendar size={16} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-ink2/50 dark:text-paper/40">
                                                {isDone ? "Cleared In" : "Target Payoff"}
                                            </p>
                                            <p className="font-display text-sm sm:text-base font-bold leading-tight truncate">
                                                {completionDate.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>

                                    {!isDone && (
                                        <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0">
                                            {Math.max(item.terms - item.paidMonths, 0)} mos remaining
                                        </span>
                                    )}
                                </div>

                                {/* Balance & Next Due row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ink2/60 dark:text-paper/50 mb-4 px-1">
                                    {!isDone && (
                                        <span>Remaining: <strong className="text-ink dark:text-paper">₱{peso(remaining)}</strong></span>
                                    )}
                                    {!isDone && nextDueDate && (
                                        <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
                                            Next Due: <strong>{formatDatePH(nextDueDate)}</strong>
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {!isDone && (
                                    <button
                                        type="button"
                                        onClick={() => handlePay(item.id)}
                                        className="tap-scale w-full py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-peso hover:text-white dark:hover:bg-pesoLight text-ink dark:text-paper text-xs font-bold transition-all flex items-center justify-center gap-2 border border-black/5 dark:border-white/5"
                                    >
                                        <TRACKER_ICONS.Check size={15} />
                                        <span>Mark 1 Month Paid</span>
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
