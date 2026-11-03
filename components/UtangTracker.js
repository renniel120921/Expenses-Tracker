// components/UtangTracker.js

// --- REAL SVG ICONS SUITE ---
const UTANG_ICONS = {
    ArrowDownLeft: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="17" y1="7" x2="7" y2="17" />
            <polyline points="17 17 7 17 7 7" />
        </svg>
    ),
    ArrowUpRight: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
        </svg>
    ),
    Scale: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 3v18" />
            <path d="M5 6l7-3 7 3" />
            <path d="M2 13l3-7 3 7a4 4 0 0 1-6 0z" fill="currentColor" fillOpacity="0.15" />
            <path d="M16 13l3-7 3 7a4 4 0 0 1-6 0z" fill="currentColor" fillOpacity="0.15" />
            <path d="M4 21h16" />
        </svg>
    ),
    Wallet: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" fill="currentColor" fillOpacity="0.15" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            <circle cx="18" cy="14" r="0.75" fill="currentColor" stroke="none" />
        </svg>
    ),
    User: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" fill="currentColor" fillOpacity="0.15" />
        </svg>
    ),
    Users: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    CalendarClock: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2.5" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <circle cx="13" cy="16" r="3" fill="currentColor" fillOpacity="0.2" />
            <polyline points="13 15 13 16 14 16.5" strokeWidth="1.8" />
        </svg>
    ),
    Handshake: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-3-3a1 1 0 0 0-1.4 0l-1.3 1.3" />
            <path d="m13 7-2-2a1 1 0 0 0-1.4 0L5.3 9.3a1 1 0 0 0 0 1.4l3 3a1 1 0 0 0 1.4 0l1.3-1.3" />
            <path d="m2 14 6 6" />
            <path d="m22 10-6-6" />
        </svg>
    ),
    CheckCircleFilled: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
            <path d="m8.5 12 2.5 2.5 5-5" strokeWidth="2.6" />
        </svg>
    ),
    AlertPulse: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="currentColor" fillOpacity="0.18" />
            <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2.5" />
            <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
    ),
    Tag: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        </svg>
    ),
    Sparkles: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    Search: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Close: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Trash: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    RotateCcw: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
    ),
    Plus: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Check: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Loader: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
            <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
    ),
    Inbox: ({ size = 26, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    )
};

// Helper to get initials from a person's name
function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDueStatus(item, todayStr) {
    if (item.status === "Paid") {
        return {
            statusKey: "paid",
            label: "Settled",
            tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-400/15 dark:border-emerald-400/25",
            dotTone: "bg-emerald-500"
        };
    }
    if (!item.dueDate) {
        return {
            statusKey: "no_date",
            label: "Open deadline",
            tone: "text-ink2/60 dark:text-paper/50 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10",
            dotTone: "bg-ink2/40"
        };
    }
    const d = new Date(item.dueDate);
    if (isNaN(d.getTime())) {
        return {
            statusKey: "scheduled",
            label: "Due: " + item.dueDate,
            tone: "text-ink2/60 dark:text-paper/50 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10",
            dotTone: "bg-ink2/40"
        };
    }
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);
        return {
            statusKey: "overdue",
            label: daysAgo === 1 ? "Overdue (Yesterday)" : `Overdue by ${daysAgo}d`,
            tone: "text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/25 dark:bg-rose-400/20 dark:border-rose-400/30",
            dotTone: "bg-rose-500 animate-ping",
            isUrgent: true
        };
    }
    if (diffDays === 0) {
        return {
            statusKey: "today",
            label: "Due Today",
            tone: "text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/25 dark:bg-amber-400/20 dark:border-amber-400/30",
            dotTone: "bg-amber-500 animate-pulse",
            isUrgent: true
        };
    }
    if (diffDays === 1) {
        return {
            statusKey: "tomorrow",
            label: "Due Tomorrow",
            tone: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20 dark:bg-amber-400/15 dark:border-amber-400/25",
            dotTone: "bg-amber-500"
        };
    }
    if (diffDays <= 3) {
        return {
            statusKey: "soon",
            label: `Due in ${diffDays} days`,
            tone: "text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20 dark:bg-teal-400/15 dark:border-teal-400/25",
            dotTone: "bg-teal-500"
        };
    }
    return {
        statusKey: "upcoming",
        label: `In ${diffDays} days`,
        tone: "text-ink2/70 dark:text-paper/70 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10",
        dotTone: "bg-ink2/40"
    };
}

// Animated Amount component
function AnimatedAmount({ value, className }) {
    const { useState, useEffect, useRef } = React;
    const safeValue = Number.isFinite(value) ? value : 0;
    const [display, setDisplay] = useState(safeValue);
    const prevValue = useRef(safeValue);
    const rafRef = useRef(null);

    useEffect(() => {
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const from = prevValue.current;
        const to = safeValue;

        if (reduceMotion || from === to) {
            setDisplay(to);
            prevValue.current = to;
            return;
        }

        const duration = 600;
        const start = performance.now();
        cancelAnimationFrame(rafRef.current);

        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 4);
            setDisplay(from + (to - from) * eased);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                prevValue.current = to;
                setDisplay(to);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [safeValue]);

    return <span className={className}>₱{window.peso(display)}</span>;
}

// FieldWrap defined outside component to prevent re-mounting inputs & keyboard loss
function FieldWrap({ icon, children, className = "" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-white/80 dark:bg-ink2/30 ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/50 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 shadow-xs ${className}`}>
            {icon}
            {children}
        </div>
    );
}

// Quick presets for notes and relationships
const QUICK_RELATION_PRESETS = [
    { label: "Friend / Barkada", note: "Friend loan" },
    { label: "Family / Kamag-anak", note: "Family assistance" },
    { label: "Coworker / Work", note: "Workmate advance" },
    { label: "Food / Meal Split", note: "Split meal / dinner" },
    { label: "Abono / Emergency", note: "Emergency advance" },
    { label: "Bank / Loan App", note: "Lending app / Bank" },
];

// --- MAIN UTANG TRACKER COMPONENT ---
window.UtangTracker = function UtangTracker({ uid, utangList = [], loading }) {
    const { useState, useMemo, useRef } = React;

    // ---- form state ----
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [direction, setDirection] = useState("owed_to_me"); // "owed_to_me" (pautang) | "i_owe" (utang ko)
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ---- filter & search state ----
    const [filter, setFilter] = useState("all"); // "all", "owed_to_me", "i_owe", "settled"
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("dueDate"); // "dueDate", "amount", "name"

    const inputRef = useRef(null);
    const todayStr = window.TipidCore ? window.TipidCore.manilaDateKey() : new Date().toISOString().slice(0, 10);

    // ---- derived totals (unpaid only for active balances) ----
    const totals = useMemo(() => {
        const unpaid = utangList.filter(u => u.status !== "Paid");
        const owedToMe = window.TipidCore ? window.TipidCore.sumMoney(unpaid.filter(u => u.direction !== "i_owe").map(u => u.amount)) : 0;
        const iOwe = window.TipidCore ? window.TipidCore.sumMoney(unpaid.filter(u => u.direction === "i_owe").map(u => u.amount)) : 0;
        const net = owedToMe - iOwe;

        const paidList = utangList.filter(u => u.status === "Paid");
        const overdueList = unpaid.filter(u => u.dueDate && u.dueDate < todayStr);

        return {
            owedToMe,
            iOwe,
            net,
            unpaidCount: unpaid.length,
            owedToMeCount: unpaid.filter(u => u.direction !== "i_owe").length,
            iOweCount: unpaid.filter(u => u.direction === "i_owe").length,
            paidCount: paidList.length,
            overdueCount: overdueList.length,
            settledPct: utangList.length > 0 ? Math.round((paidList.length / utangList.length) * 100) : 0
        };
    }, [utangList, todayStr]);

    const handleAdd = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!name.trim() || !amt || amt <= 0 || !uid || !window.TipidData) {
            return Swal.fire({
                icon: "warning",
                title: "Incomplete Details",
                text: "Please provide a valid person/counterparty name and an amount greater than 0.",
                confirmButtonColor: "#1F6F54",
                customClass: { popup: "tipid-swal" }
            });
        }

        try {
            setSubmitting(true);
            await window.TipidData.addUtang(uid, {
                name: name.trim(),
                amount: amt,
                direction,
                dueDate: dueDate || null,
                notes: notes.trim(),
            });

            setName("");
            setAmount("");
            setDueDate("");
            setNotes("");

            Swal.fire({
                icon: "success",
                title: direction === "owed_to_me" ? "Receivable Logged! 🤝" : "Debt Obligation Logged! 💳",
                text: "Record has been securely registered in your ledger.",
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: "tipid-swal" }
            });
        } catch (err) {
            console.error("Failed to add utang:", err);
            Swal.fire({
                icon: "error",
                title: "Failed to Save",
                text: "Please check your network and try again.",
                confirmButtonColor: "#B5483B",
                customClass: { popup: "tipid-swal" }
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettle = async (item) => {
        if (!uid || !window.TipidData) return;
        const isReceivable = item.direction !== "i_owe";
        const result = await Swal.fire({
            icon: "question",
            title: isReceivable ? "Payment Received?" : "Debt Paid in Full?",
            text: `Confirm settlement of ₱${window.peso(item.amount)} with ${item.name}`,
            showCancelButton: true,
            confirmButtonText: "Yes, Mark Settled",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#1F6F54",
            cancelButtonColor: "#2F4037",
            customClass: { popup: "tipid-swal" },
            reverseButtons: true
        });
        if (!result.isConfirmed) return;
        try {
            await window.TipidData.settleUtang(uid, item.id);
            if (window.TipidCelebration) {
                const title = isReceivable ? "Bayad Natanggap! 🎉" : "Hooray! Debt-free ka na sa utang na ito! 🎉";
                const message = isReceivable
                    ? `Nasingil mo na ang ₱${window.peso(item.amount)} mula kay ${item.name}!`
                    : `Natapos mo nang bayaran ang buong ₱${window.peso(item.amount)} kay ${item.name}. Malaking hakbang ito tungo sa financial freedom!`;
                window.TipidCelebration.celebrate({ title, message });
            }
        } catch (err) {
            console.error("Failed to settle utang:", err);
        }
    };

    const handleReopen = async (item) => {
        if (!uid || !window.TipidData) return;
        try {
            await window.TipidData.reopenUtang(uid, item.id);
        } catch (err) {
            console.error("Failed to reopen utang:", err);
        }
    };

    const handleDelete = async (item) => {
        if (!uid || !window.TipidData) return;
        const result = await Swal.fire({
            icon: "warning",
            title: `Delete record for ${item.name}?`,
            text: `Amount: ₱${window.peso(item.amount)}. This action cannot be reversed.`,
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#B5483B",
            cancelButtonColor: "#2F4037",
            customClass: { popup: "tipid-swal" },
            reverseButtons: true
        });
        if (!result.isConfirmed) return;
        try {
            await window.TipidData.deleteUtang(uid, item.id);
        } catch (err) {
            console.error("Failed to delete utang:", err);
        }
    };

    // Filter & Sort
    const displayedList = useMemo(() => {
        let list = [...utangList];

        // Filter tab
        if (filter === "owed_to_me") {
            list = list.filter(u => u.direction !== "i_owe" && u.status !== "Paid");
        } else if (filter === "i_owe") {
            list = list.filter(u => u.direction === "i_owe" && u.status !== "Paid");
        } else if (filter === "settled") {
            list = list.filter(u => u.status === "Paid");
        } else {
            // "all" shows active unpaid records first
            list = list.filter(u => u.status !== "Paid");
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(u =>
                (u.name || "").toLowerCase().includes(q) ||
                (u.notes || "").toLowerCase().includes(q)
            );
        }

        // Sort
        list.sort((a, b) => {
            if (sortBy === "amount") {
                return (b.amount || 0) - (a.amount || 0);
            }
            if (sortBy === "name") {
                return (a.name || "").localeCompare(b.name || "");
            }
            // default: dueDate
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        });

        return list;
    }, [utangList, filter, searchQuery, sortBy]);

    return (
        <div className="space-y-6 sm:space-y-8 fade-up">

            {/* --- 3 APPLE HIG SUMMARY METRIC CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

                {/* 1. Owed to Me (Pautang) */}
                <div
                    onClick={() => setFilter(filter === "owed_to_me" ? "all" : "owed_to_me")}
                    className={`relative overflow-hidden bg-white/80 dark:bg-ink2/35 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border shadow-ios transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${
                        filter === "owed_to_me" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-white/90 dark:border-white/10"
                    }`}
                >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-peso to-emerald-700" />
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-[14px] bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-500/20 dark:border-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                                <UTANG_ICONS.ArrowDownLeft size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                                    Owed to Me (Receivables)
                                </p>
                                <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                    {totals.owedToMeCount} people to collect from
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-baseline justify-between gap-2">
                        <AnimatedAmount value={totals.owedToMe} className="font-mono text-[1.85rem] sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300" />
                        <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/15 px-2 py-0.5 rounded-md">
                            Collect
                        </span>
                    </div>
                </div>

                {/* 2. I Owe (Utang Ko) */}
                <div
                    onClick={() => setFilter(filter === "i_owe" ? "all" : "i_owe")}
                    className={`relative overflow-hidden bg-white/80 dark:bg-ink2/35 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border shadow-ios transition-all duration-300 hover:-translate-y-1 cursor-pointer group ${
                        filter === "i_owe" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-white/90 dark:border-white/10"
                    }`}
                >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-[14px] bg-rose-500/10 dark:bg-rose-400/15 border border-rose-500/20 dark:border-rose-400/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                                <UTANG_ICONS.ArrowUpRight size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-rose-600 dark:text-rose-400">
                                    I Owe (Payables)
                                </p>
                                <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                    {totals.iOweCount} pending liabilities
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-baseline justify-between gap-2">
                        <AnimatedAmount value={totals.iOwe} className="font-mono text-[1.85rem] sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400" />
                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-400/15 px-2 py-0.5 rounded-md">
                            To Pay
                        </span>
                    </div>
                </div>

                {/* 3. Net Liquidity Position */}
                <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/35 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border border-white/90 dark:border-white/10 shadow-ios transition-all duration-300 hover:-translate-y-1 group">
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                        totals.net > 0 ? "bg-gradient-to-r from-emerald-400 to-peso" : totals.net < 0 ? "bg-gradient-to-r from-rose-400 to-rose-600" : "bg-gradient-to-r from-indigo-400 to-indigo-600"
                    }`} />
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-[14px] bg-indigo-500/10 dark:bg-indigo-400/15 border border-indigo-500/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                                <UTANG_ICONS.Scale size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-indigo-700/80 dark:text-indigo-300/80">
                                    Net Position
                                </p>
                                <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                    {totals.net >= 0 ? "Net Positive Credit" : "Net Negative Debt"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-baseline justify-between gap-2">
                        <p className={`font-mono text-[1.85rem] sm:text-3xl font-bold tracking-tight ${
                            totals.net > 0 ? "text-emerald-700 dark:text-emerald-300" : totals.net < 0 ? "text-rose-600 dark:text-rose-400" : "text-ink dark:text-paper"
                        }`}>
                            {totals.net < 0 ? "-" : totals.net > 0 ? "+" : ""}₱{window.peso(Math.abs(totals.net))}
                        </p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                            totals.net >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                            {totals.net >= 0 ? "Surplus" : "Deficit"}
                        </span>
                    </div>
                </div>

            </div>

            {/* --- RECORD DEBT / LOAN SECTION --- */}
            <div className="bg-white/80 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.85rem] border border-white/90 dark:border-white/10 shadow-ios p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-pesoLight via-emerald-500 to-peso" />

                <div className="flex items-start justify-between gap-4 mb-6 relative z-10 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-peso/15 to-peso/5 dark:from-pesoLight/20 dark:to-pesoLight/5 border border-peso/20 dark:border-pesoLight/20 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 shadow-xs">
                            <UTANG_ICONS.Sparkles size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-[1.25rem] font-semibold text-ink dark:text-paper leading-tight">
                                Record Debt or Loan
                            </h3>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50">
                                Log money lent to others (Pautang) or personal liabilities borrowed (Utang)
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleAdd} className="flex flex-col gap-4 relative z-10">

                    {/* Interactive Direction Segmented Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-black/5 dark:border-white/5">
                        <button
                            type="button"
                            onClick={() => setDirection("owed_to_me")}
                            className={`tap-scale p-3.5 rounded-xl flex items-center gap-3 transition-all text-left ${
                                direction === "owed_to_me"
                                    ? "bg-white dark:bg-ink shadow-sm border border-emerald-500/30 ring-1 ring-emerald-500/20"
                                    : "hover:bg-white/50 dark:hover:bg-white/5 opacity-70"
                            }`}
                        >
                            <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <UTANG_ICONS.ArrowDownLeft size={18} />
                            </span>
                            <div>
                                <p className="font-semibold text-[13.5px] text-emerald-700 dark:text-emerald-300 leading-tight">
                                    Owed to Me (Pautang)
                                </p>
                                <p className="text-[11px] text-ink2/60 dark:text-paper/50 mt-0.5">
                                    I lent money; person will pay me back
                                </p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setDirection("i_owe")}
                            className={`tap-scale p-3.5 rounded-xl flex items-center gap-3 transition-all text-left ${
                                direction === "i_owe"
                                    ? "bg-white dark:bg-ink shadow-sm border border-rose-500/30 ring-1 ring-rose-500/20"
                                    : "hover:bg-white/50 dark:hover:bg-white/5 opacity-70"
                            }`}
                        >
                            <span className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <UTANG_ICONS.ArrowUpRight size={18} />
                            </span>
                            <div>
                                <p className="font-semibold text-[13.5px] text-rose-600 dark:text-rose-400 leading-tight">
                                    I Owe (Utang Ko)
                                </p>
                                <p className="text-[11px] text-ink2/60 dark:text-paper/50 mt-0.5">
                                    I borrowed funds; I will repay them
                                </p>
                            </div>
                        </button>
                    </div>

                    {/* Quick Relationship / Category Presets */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-[11px] font-mono uppercase font-semibold text-ink2/40 dark:text-paper/40 tracking-wider shrink-0">
                            Quick Tag:
                        </span>
                        {QUICK_RELATION_PRESETS.map((p, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setNotes(notes ? `${notes} • ${p.note}` : p.note)}
                                className="tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/5 dark:border-white/10 text-[11.5px] font-medium text-ink2/70 dark:text-paper/70 transition-all"
                            >
                                <span>{p.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Form Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">

                        {/* Person Name */}
                        <div className="sm:col-span-7">
                            <FieldWrap icon={<UTANG_ICONS.User size={17} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="utang-name" className="sr-only">Person or Organization</label>
                                <input
                                    id="utang-name"
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Person Name (e.g. Juan Dela Cruz, Mama, Colleague)"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[14.5px] font-medium text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                        {/* Amount */}
                        <div className="sm:col-span-5">
                            <FieldWrap icon={<span className="text-ink2/50 dark:text-paper/50 font-mono text-[16px] font-bold shrink-0">₱</span>}>
                                <label htmlFor="utang-amount" className="sr-only">Amount</label>
                                <input
                                    id="utang-amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-mono font-bold text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">

                        {/* Due Date */}
                        <div className="sm:col-span-6">
                            <FieldWrap icon={<UTANG_ICONS.CalendarClock size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="utang-due-date" className="sr-only">Expected Settlement Date</label>
                                <input
                                    id="utang-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[13.5px] font-mono font-semibold text-ink dark:text-paper focus:outline-none cursor-pointer"
                                />
                            </FieldWrap>
                        </div>

                        {/* Notes / Reference */}
                        <div className="sm:col-span-6">
                            <FieldWrap icon={<UTANG_ICONS.Tag size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="utang-notes" className="sr-only">Note or Purpose</label>
                                <input
                                    id="utang-notes"
                                    type="text"
                                    placeholder="Note / Purpose (e.g. Lunch abono, Emergency advance)"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[13.5px] text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                    </div>

                    <div className="flex items-center justify-end mt-1">
                        <button
                            type="submit"
                            disabled={submitting || !name.trim() || !amount}
                            aria-label={submitting ? "Recording..." : "Record Entry"}
                            className="tap-scale w-full sm:w-auto bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/25 active:scale-95 disabled:opacity-60 text-white font-semibold rounded-[14px] px-7 py-3.5 text-[14px] transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
                        >
                            {submitting ? <UTANG_ICONS.Loader size={18} className="spin" /> : <UTANG_ICONS.Plus size={18} />}
                            <span>{submitting ? "Recording..." : "Record Entry"}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* --- DEBT LEDGER & HISTORY --- */}
            <div className="bg-white/80 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.85rem] border border-white/90 dark:border-white/10 shadow-ios overflow-hidden p-6 sm:p-8">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-7 rounded-full bg-peso dark:bg-pesoLight" />
                        <div>
                            <h3 className="font-display text-[1.25rem] font-semibold text-ink dark:text-paper">
                                Debt Ledger
                            </h3>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50">
                                {utangList.length} total entries • {totals.unpaidCount} currently active
                            </p>
                        </div>
                    </div>

                    {/* Settlement progress pill */}
                    {!loading && utangList.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-[11.5px] font-mono font-semibold bg-peso/10 dark:bg-pesoLight/15 border border-peso/20 dark:border-pesoLight/20 px-3 py-1.5 rounded-xl text-peso dark:text-pesoLight">
                                {totals.paidCount}/{utangList.length} settled ({totals.settledPct}%)
                            </span>
                        </div>
                    )}
                </div>

                {/* Filter Tabs & Search Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">

                    {/* Filter Segmented Control */}
                    <div className="inline-flex p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 gap-1 overflow-x-auto scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                filter === "all"
                                    ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Active ({totals.unpaidCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("owed_to_me")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                filter === "owed_to_me"
                                    ? "bg-white dark:bg-ink text-emerald-700 dark:text-emerald-300 shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-emerald-700 dark:hover:text-emerald-300"
                            }`}
                        >
                            Owed to Me ({totals.owedToMeCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("i_owe")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                filter === "i_owe"
                                    ? "bg-white dark:bg-ink text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-rose-600 dark:hover:text-rose-400"
                            }`}
                        >
                            I Owe ({totals.iOweCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("settled")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                filter === "settled"
                                    ? "bg-white dark:bg-ink text-peso dark:text-pesoLight shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-peso dark:hover:text-pesoLight"
                            }`}
                        >
                            Settled ({totals.paidCount})
                        </button>
                    </div>

                    {/* Search & Sort */}
                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-56">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2/40 dark:text-paper/40 pointer-events-none">
                                <UTANG_ICONS.Search size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or note..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/70 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-[12.5px] text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-peso/50"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink2/40 dark:text-paper/40 hover:text-ink dark:hover:text-paper"
                                >
                                    <UTANG_ICONS.Close size={12} />
                                </button>
                            )}
                        </div>

                        {/* Sort Selector */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            aria-label="Sort debts"
                            className="bg-white/70 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-ink2/70 dark:text-paper/70 focus:outline-none cursor-pointer"
                        >
                            <option value="dueDate">Due Date</option>
                            <option value="amount">Amount</option>
                            <option value="name">Name</option>
                        </select>
                    </div>

                </div>

                {/* Ledger Content List */}
                {loading ? (
                    <div role="status" aria-label="Loading debts" className="py-16 flex flex-col items-center justify-center gap-3 text-ink2/40 dark:text-paper/30">
                        <UTANG_ICONS.Loader size={26} className="spin text-peso" />
                        <span className="text-[12px] font-mono">Synchronizing debt records...</span>
                    </div>
                ) : displayedList.length === 0 ? (
                    <div className="py-14 px-4 flex flex-col items-center justify-center gap-3 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                        <div aria-hidden="true" className="w-14 h-14 rounded-2xl bg-paperDim dark:bg-ink2/50 border border-dashed border-line dark:border-white/15 flex items-center justify-center text-ink2/40 dark:text-paper/30">
                            <UTANG_ICONS.Inbox size={26} />
                        </div>
                        <div>
                            <p className="text-[14px] font-semibold text-ink dark:text-paper mb-1">
                                {searchQuery ? "No matching records found" : filter === "settled" ? "No settled debts yet" : "No debt records in this category"}
                            </p>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50 max-w-sm">
                                {searchQuery ? "Try clearing your search term to view all records." : "Use the form above to log money lent or borrowed."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayedList.map(item => {
                            const isOwedToMe = item.direction !== "i_owe";
                            const isPaid = item.status === "Paid";
                            const dueInfo = getDueStatus(item, todayStr);
                            const initials = getInitials(item.name);

                            return (
                                <div
                                    key={item.id}
                                    className={`relative overflow-hidden group flex items-center justify-between gap-3.5 pl-4 pr-3 sm:pl-5 sm:pr-4 py-3.5 rounded-2xl transition-all duration-200 border ${
                                        isPaid
                                            ? "bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-70 hover:opacity-100"
                                            : dueInfo.statusKey === "overdue"
                                                ? "bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border-rose-500/20 dark:border-rose-500/25 hover:bg-white dark:hover:bg-ink2/60 shadow-xs"
                                                : "bg-white/60 dark:bg-white/[0.03] border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-ink2/60 shadow-xs"
                                    }`}
                                >
                                    {/* Left Direction Accent Bar */}
                                    <div
                                        className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-[55%] w-[3.5px] rounded-full transition-opacity duration-300 ${
                                            isPaid ? "bg-emerald-500" : isOwedToMe ? "bg-emerald-600" : "bg-rose-500"
                                        } ${isPaid ? "opacity-30" : "opacity-80 group-hover:opacity-100"}`}
                                        aria-hidden="true"
                                    />

                                    {/* Main Info */}
                                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">

                                        {/* Counterparty Initials Squircle Avatar */}
                                        <div
                                            className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 border shadow-xs font-mono font-bold text-[13px] ${
                                                isPaid
                                                    ? "bg-black/5 dark:bg-white/5 text-ink2/40 dark:text-paper/40 border-black/5 dark:border-white/5"
                                                    : isOwedToMe
                                                        ? "bg-emerald-500/10 dark:bg-emerald-400/15 border-emerald-500/20 dark:border-emerald-400/20 text-emerald-700 dark:text-emerald-300"
                                                        : "bg-rose-500/10 dark:bg-rose-400/15 border-rose-500/20 dark:border-rose-400/20 text-rose-700 dark:text-rose-300"
                                            }`}
                                        >
                                            {initials}
                                        </div>

                                        {/* Details */}
                                        <div className="min-w-0 pr-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className={`font-semibold text-[14.5px] sm:text-[15.5px] leading-tight truncate ${
                                                    isPaid ? "line-through text-ink2/40 dark:text-paper/30" : "text-ink dark:text-paper"
                                                }`}>
                                                    {item.name}
                                                </p>

                                                {/* Direction Badge */}
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                                                    isPaid
                                                        ? "bg-black/5 dark:bg-white/5 text-ink2/40 dark:text-paper/30 border-transparent"
                                                        : isOwedToMe
                                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                                                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                                                }`}>
                                                    {isOwedToMe ? <UTANG_ICONS.ArrowDownLeft size={10} /> : <UTANG_ICONS.ArrowUpRight size={10} />}
                                                    <span>{isOwedToMe ? "Owed to Me" : "I Owe"}</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {/* Due Date & Urgency Pill */}
                                                <span className={`text-[10.5px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                                                    isPaid
                                                        ? "bg-black/5 dark:bg-white/5 text-ink2/40 dark:text-paper/30 border-transparent"
                                                        : dueInfo.tone
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${dueInfo.dotTone}`} />
                                                    <span>{dueInfo.label}</span>
                                                    {item.dueDate && (
                                                        <span className="opacity-70 font-mono">({formatDate(item.dueDate)})</span>
                                                    )}
                                                </span>

                                                {/* Notes if available */}
                                                {item.notes && (
                                                    <span className="text-[11.5px] text-ink2/50 dark:text-paper/40 truncate max-w-[220px]" title={item.notes}>
                                                        • {item.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Amount & Settle/Delete Actions */}
                                    <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
                                        <span className={`font-mono font-bold tabular-nums text-[16px] sm:text-[18px] tracking-tight ${
                                            isPaid
                                                ? "text-ink2/40 dark:text-paper/30 line-through"
                                                : isOwedToMe
                                                    ? "text-emerald-700 dark:text-emerald-300"
                                                    : "text-rose-600 dark:text-rose-400"
                                        }`}>
                                            ₱{window.peso(item.amount)}
                                        </span>

                                        {/* Settle or Reopen Action Button */}
                                        {isPaid ? (
                                            <button
                                                type="button"
                                                onClick={() => handleReopen(item)}
                                                title="Reopen record"
                                                className="tap-scale inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-ink2/60 dark:text-paper/60 transition-colors"
                                            >
                                                <UTANG_ICONS.RotateCcw size={12} />
                                                <span className="hidden sm:inline">Reopen</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSettle(item)}
                                                title="Mark as Settled"
                                                className="tap-scale inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-xl bg-peso/10 hover:bg-peso text-peso hover:text-white dark:bg-pesoLight/15 dark:hover:bg-pesoLight dark:text-pesoLight dark:hover:text-ink transition-all"
                                            >
                                                <UTANG_ICONS.Check size={14} />
                                                <span className="hidden sm:inline">Settle</span>
                                            </button>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item)}
                                            aria-label={`Delete record for ${item.name}`}
                                            className="tap-scale p-2 rounded-xl text-ink2/30 hover:text-rose-600 hover:bg-rose-500/10 dark:text-paper/30 dark:hover:text-rose-400 dark:hover:bg-rose-500/20 active:scale-90 transition-colors"
                                        >
                                            <UTANG_ICONS.Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};
