// components/ExpenseList.js

// --- REAL SVG ICONS SUITE ---
const LIST_ICONS = {
    Search: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    X: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Filter: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    ),
    Download: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Printer: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
        </svg>
    ),
    Receipt: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 2h16v20l-3-2-2 2-2-2-2 2-2-2-2 2-3-2V2z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="16" y2="11" />
            <line x1="8" y1="15" x2="12" y2="15" />
        </svg>
    ),
    Inbox: ({ size = 26, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    ),
    ArrowUpDown: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="7 15 12 20 17 15" />
            <polyline points="17 9 12 4 7 9" />
        </svg>
    ),
    Calendar: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    Check: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Sparkles: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
        </svg>
    )
};


function SkeletonRow({ delay = 0 }) {
    const shimmerStyle = { animationDelay: `${delay}ms` };
    return (
        <div className="px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-line/20 dark:border-white/5 last:border-0">
            <div className="skeleton-shimmer w-[2.85rem] h-[2.85rem] rounded-[14px] shrink-0" style={shimmerStyle} />
            <div className="flex-1 min-w-0 space-y-2.5">
                <div className="skeleton-shimmer h-3.5 rounded-full w-3/5 max-w-[160px]" style={shimmerStyle} />
                <div className="skeleton-shimmer h-2.5 rounded-full w-2/5 max-w-[100px]" style={shimmerStyle} />
            </div>
            <div className="skeleton-shimmer h-4 rounded-full w-16 sm:w-20 shrink-0" style={shimmerStyle} />
        </div>
    );
}

// Digital Receipt Inspection Modal (Apple HIG aesthetics)
function DigitalReceiptModal({ entry, onClose, onDelete }) {
    if (!entry) return null;
    const isIncome = entry.type === "income";
    const peso = window.peso || ((n) => Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 }));

    const dateObj = window.TipidCore ? window.TipidCore.entryDate(entry) : new Date(entry.date || entry.createdAt);
    const dateFormatted = dateObj ? dateObj.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Recent";
    const timeFormatted = dateObj ? dateObj.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }) : "";

    const refNumber = `TXN-${String(entry.id || "").slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity duration-300">
            <div
                className="relative w-full max-w-md bg-paper dark:bg-ink text-ink dark:text-paper rounded-[2rem] shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Torn receipt top perforated edge decoration */}
                <div className="h-3 bg-gradient-to-r from-peso via-pesoLight to-gold" />

                <div className="p-6 sm:p-8">
                    {/* Header Row */}
                    <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center">
                                <LIST_ICONS.Receipt size={16} />
                            </span>
                            <div>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-ink2/60 dark:text-paper/60 font-semibold">
                                    Official Digital Receipt
                                </p>
                                <p className="text-xs font-mono font-bold text-ink dark:text-paper">
                                    {refNumber}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close receipt"
                            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-ink2 dark:text-paper transition-colors"
                        >
                            <LIST_ICONS.X size={14} />
                        </button>
                    </div>

                    {/* Amount Hero */}
                    <div className="text-center py-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/5 dark:border-white/5 mb-6">
                        <span className={`inline-block text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold mb-2 ${
                            isIncome
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                                : "bg-rose-500/15 text-rose-800 dark:text-rose-300"
                        }`}>
                            {isIncome ? "Income Credited" : "Expense Paid"}
                        </span>
                        <div className={`font-mono text-3xl sm:text-4xl font-bold tracking-tight ${
                            isIncome ? "text-emerald-700 dark:text-emerald-400" : "text-ink dark:text-paper"
                        }`}>
                            {isIncome ? '+' : '-'}₱{peso(entry.amount)}
                        </div>
                        <p className="text-sm font-semibold text-ink dark:text-paper mt-1.5 px-4 truncate">
                            {entry.desc}
                        </p>
                    </div>

                    {/* Receipt Details Table */}
                    <div className="space-y-3 text-xs mb-6 font-medium">
                        <div className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                            <span className="text-ink2/60 dark:text-paper/50">Date & Time</span>
                            <span className="font-mono text-ink dark:text-paper">{dateFormatted} {timeFormatted}</span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                            <span className="text-ink2/60 dark:text-paper/50">Category</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-ink dark:text-paper">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: (window.CATEGORY_COLOR && window.CATEGORY_COLOR[entry.category]) || "#1F6F54" }}
                                />
                                {window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[entry.category] || entry.category) : entry.category}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                            <span className="text-ink2/60 dark:text-paper/50">Payment Channel</span>
                            <span className="font-mono font-semibold text-ink dark:text-paper">{entry.method || "Cash"}</span>
                        </div>

                        {!isIncome && (
                            <div className="flex items-center justify-between py-1.5 border-b border-black/5 dark:border-white/5">
                                <span className="text-ink2/60 dark:text-paper/50">Spend Classification</span>
                                <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                                    entry.spendType === 'luho'
                                        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                }`}>
                                    {entry.spendType === 'luho' ? (
                                        <>
                                            <LIST_ICONS.Sparkles size={10} />
                                            <span>Discretionary (Luho)</span>
                                        </>
                                    ) : (
                                        <>
                                            <LIST_ICONS.Check size={10} />
                                            <span>Essential Need</span>
                                        </>
                                    )}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between py-1.5">
                            <span className="text-ink2/60 dark:text-paper/50">Ledger Verification</span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                                <LIST_ICONS.Check size={13} />
                                Authenticated
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="tap-scale flex-1 py-2.5 px-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-ink dark:text-paper text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <LIST_ICONS.Printer size={14} />
                            <span>Print Resibo</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="tap-scale flex-1 py-2.5 px-3 rounded-xl bg-peso text-white text-xs font-bold shadow-xs hover:bg-pesoLight transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EntryList({ uid, entries = [], loading = false }) {
    const { useState, useMemo } = React;
    const peso = window.peso || ((n) => Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 }));

    // Interactive Controls State
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'expense', 'income'
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [walletFilter, setWalletFilter] = useState("all");
    const [spendTypeFilter, setSpendTypeFilter] = useState("all"); // 'all', 'need', 'luho'
    const [dateRangeFilter, setDateRangeFilter] = useState("all"); // 'all', 'thisMonth', 'lastMonth', 'thisYear'
    const [sortBy, setSortBy] = useState("newest"); // 'newest', 'oldest', 'amountHigh', 'amountLow'
    const [activeReceipt, setActiveReceipt] = useState(null);

    // Active dataset: live Firebase entries
    const activeEntries = useMemo(() => {
        return entries || [];
    }, [entries]);

    // Unique Categories & Wallets present in active dataset
    const availableCategories = useMemo(() => {
        const set = new Set();
        activeEntries.forEach(e => { if (e.category) set.add(e.category); });
        return Array.from(set);
    }, [activeEntries]);

    const availableWallets = useMemo(() => {
        const set = new Set();
        activeEntries.forEach(e => { if (e.method) set.add(e.method); });
        return Array.from(set);
    }, [activeEntries]);

    // Filtering Engine
    const filteredEntries = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
        const startOfThisYear = new Date(now.getFullYear(), 0, 1).getTime();

        const query = searchQuery.trim().toLowerCase();

        return activeEntries.filter(entry => {
            // 1. Text Search Filter
            if (query) {
                const descMatch = (entry.desc || "").toLowerCase().includes(query);
                const catMatch = (entry.category || "").toLowerCase().includes(query);
                const methodMatch = (entry.method || "").toLowerCase().includes(query);
                const displayCat = window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[entry.category] || "").toLowerCase() : "";
                if (!descMatch && !catMatch && !methodMatch && !displayCat.includes(query)) {
                    return false;
                }
            }

            // 2. Type Filter (Income vs Expense)
            if (typeFilter !== "all" && entry.type !== typeFilter) {
                return false;
            }

            // 3. Category Filter
            if (categoryFilter !== "all" && entry.category !== categoryFilter) {
                return false;
            }

            // 4. Wallet / Method Filter
            if (walletFilter !== "all" && entry.method !== walletFilter) {
                return false;
            }

            // 5. Spend Classification Filter (Need vs Luho)
            if (spendTypeFilter !== "all") {
                if (entry.type === "income") return false;
                if (spendTypeFilter === "need" && entry.spendType !== "need" && entry.spendType) return false;
                if (spendTypeFilter === "luho" && entry.spendType !== "luho") return false;
            }

            // 6. Date Range Filter
            if (dateRangeFilter !== "all") {
                const parsedDate = window.TipidCore ? window.TipidCore.entryDate(entry) : new Date(entry.date || entry.createdAt);
                const entryTime = parsedDate ? parsedDate.getTime() : null;
                if (!entryTime || isNaN(entryTime)) return true;

                if (dateRangeFilter === "thisMonth" && entryTime < startOfThisMonth) return false;
                if (dateRangeFilter === "lastMonth" && (entryTime < startOfLastMonth || entryTime > endOfLastMonth)) return false;
                if (dateRangeFilter === "thisYear" && entryTime < startOfThisYear) return false;
            }

            return true;
        }).sort((a, b) => {
            const dateA = window.TipidCore ? window.TipidCore.entryDate(a) : new Date(a.date || a.createdAt);
            const dateB = window.TipidCore ? window.TipidCore.entryDate(b) : new Date(b.date || b.createdAt);
            const timeA = dateA ? dateA.getTime() : 0;
            const timeB = dateB ? dateB.getTime() : 0;

            if (sortBy === "newest") return timeB - timeA;
            if (sortBy === "oldest") return timeA - timeB;
            if (sortBy === "amountHigh") return (b.amount || 0) - (a.amount || 0);
            if (sortBy === "amountLow") return (a.amount || 0) - (b.amount || 0);
            return 0;
        });
    }, [activeEntries, searchQuery, typeFilter, categoryFilter, walletFilter, spendTypeFilter, dateRangeFilter, sortBy]);

    // Financial calculations on the filtered view
    const ledgerStats = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;

        filteredEntries.forEach(e => {
            const amt = e.amount || 0;
            if (e.type === "income") totalIncome += amt;
            else totalExpense += amt;
        });

        const net = totalIncome - totalExpense;
        return {
            totalIncome,
            totalExpense,
            net,
            count: filteredEntries.length
        };
    }, [filteredEntries]);

    // Chronological Grouping by Date
    const groupedEntries = useMemo(() => {
        const groups = {};
        const now = new Date();
        const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

        filteredEntries.forEach(entry => {
            const dateObj = window.TipidCore ? window.TipidCore.entryDate(entry) : new Date(entry.date || entry.createdAt);
            let groupKey = "Earlier Transactions";

            if (dateObj && !isNaN(dateObj.getTime())) {
                const diffDays = Math.round((startOfDay(now) - startOfDay(dateObj)) / 86400000);
                if (diffDays === 0) groupKey = "Today";
                else if (diffDays === 1) groupKey = "Yesterday";
                else {
                    groupKey = dateObj.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                }
            }

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    title: groupKey,
                    entries: [],
                    subtotal: 0
                };
            }
            groups[groupKey].entries.push(entry);
            const sign = entry.type === "income" ? 1 : -1;
            groups[groupKey].subtotal += (entry.amount || 0) * sign;
        });

        return Object.values(groups);
    }, [filteredEntries]);

    // Export to CSV Generator
    const handleExportCSV = () => {
        if (filteredEntries.length === 0) {
            return Swal.fire({
                icon: "info",
                title: "No Data to Export",
                text: "There are no transactions in the current filter to export.",
                confirmButtonColor: "#1F6F54",
                customClass: { popup: "tipid-swal" }
            });
        }

        const headers = ["Reference ID", "Date", "Time", "Type", "Description", "Category", "Payment Wallet", "Spend Type", "Amount (PHP)"];
        const rows = filteredEntries.map(e => {
            const d = window.TipidCore ? window.TipidCore.entryDate(e) : new Date(e.date || e.createdAt);
            const dateStr = d ? d.toISOString().slice(0, 10) : "";
            const timeStr = d ? d.toLocaleTimeString("en-PH", { hour12: false }) : "";
            const ref = `TXN-${String(e.id || "").slice(-6).toUpperCase()}`;
            const desc = `"${(e.desc || "").replace(/"/g, '""')}"`;
            const cat = `"${(e.category || "").replace(/"/g, '""')}"`;
            const method = `"${(e.method || "Cash").replace(/"/g, '""')}"`;
            const spend = e.spendType === "luho" ? "Want" : "Need";
            const amt = Number(e.amount || 0).toFixed(2);
            return [ref, dateStr, timeStr, e.type, desc, cat, method, spend, amt].join(",");
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateTag = new Date().toISOString().slice(0, 10);
        link.setAttribute("href", url);
        link.setAttribute("download", `Tipid_Ledger_Export_${dateTag}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Swal.fire({
            icon: "success",
            title: "Ledger Exported!",
            text: `Successfully exported ${filteredEntries.length} transactions as a CSV spreadsheet.`,
            confirmButtonColor: "#1F6F54",
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: "tipid-swal" }
        });
    };

    const resetFilters = () => {
        setSearchQuery("");
        setTypeFilter("all");
        setCategoryFilter("all");
        setWalletFilter("all");
        setSpendTypeFilter("all");
        setDateRangeFilter("all");
        setSortBy("newest");
    };

    return (
        <div className="relative receipt-edge-bottom space-y-4">
            <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] sm:rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios transition-all duration-300">
                {/* Top Subtle Gradient Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-peso to-gold" />

                {/* --- 1. SEARCH & LEDGER TOOLBAR --- */}
                <div className="p-5 sm:p-7 border-b border-black/5 dark:border-white/10 space-y-4">
                    {/* Top Row: Title, Record Count & Quick Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-2xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 border border-peso/20 shadow-xs">
                                <LIST_ICONS.Receipt size={18} />
                            </span>
                            <div>
                                <h3 className="font-display text-[1.18rem] sm:text-[1.25rem] font-bold text-ink dark:text-paper leading-tight">
                                    Financial Ledger
                                </h3>
                                <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                    Audited records & transaction history
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                            {/* Export CSV Button */}
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                title="Export filtered records to CSV"
                                className="tap-scale px-3 py-1.5 rounded-xl bg-white dark:bg-ink2/60 text-ink2/70 dark:text-paper/70 border border-black/10 dark:border-white/10 hover:bg-black/5 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                                <LIST_ICONS.Download size={13} />
                                <span>Export CSV</span>
                            </button>

                            {/* Print Statement Button */}
                            <button
                                type="button"
                                onClick={() => window.print()}
                                title="Print ledger statement"
                                className="tap-scale p-2 rounded-xl bg-white dark:bg-ink2/60 text-ink2/70 dark:text-paper/70 border border-black/10 dark:border-white/10 hover:bg-black/5 text-xs transition-all shadow-xs"
                            >
                                <LIST_ICONS.Printer size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Search Field & Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                        {/* Search Input Box */}
                        <div className="md:col-span-6 relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink2/40 dark:text-paper/40 pointer-events-none">
                                <LIST_ICONS.Search size={15} />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by merchant, category, or wallet..."
                                className="w-full pl-9 pr-9 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs sm:text-sm text-ink dark:text-paper placeholder:text-ink2/40 dark:placeholder:text-paper/40 focus:outline-none focus:ring-2 focus:ring-peso/40 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-ink2/60 dark:text-paper/60 hover:bg-black/20"
                                >
                                    <LIST_ICONS.X size={10} />
                                </button>
                            )}
                        </div>

                        {/* Type Tabs (All / Expenses / Income) */}
                        <div className="md:col-span-6 flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                            {[
                                { key: "all", label: "All Records" },
                                { key: "expense", label: "Expenses" },
                                { key: "income", label: "Income" }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setTypeFilter(tab.key)}
                                    className={`tap-scale flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                                        typeFilter === tab.key
                                            ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-bold"
                                            : "text-ink2/60 dark:text-paper/60 hover:text-ink"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter Pills Row (Category, Wallet, Spend Type, Timeframe, Sort) */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                        {/* Category Dropdown */}
                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 font-medium text-ink dark:text-paper focus:outline-none focus:ring-1 focus:ring-peso/40 cursor-pointer text-xs"
                            >
                                <option value="all">All Categories</option>
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[cat] || cat) : cat}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink2/40 dark:text-paper/40">
                                <LIST_ICONS.ArrowUpDown size={11} />
                            </span>
                        </div>

                        {/* Wallet Dropdown */}
                        <div className="relative">
                            <select
                                value={walletFilter}
                                onChange={(e) => setWalletFilter(e.target.value)}
                                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 font-medium text-ink dark:text-paper focus:outline-none focus:ring-1 focus:ring-peso/40 cursor-pointer text-xs"
                            >
                                <option value="all">All Wallets</option>
                                {availableWallets.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink2/40 dark:text-paper/40">
                                <LIST_ICONS.ArrowUpDown size={11} />
                            </span>
                        </div>

                        {/* Spend Type Dropdown */}
                        <div className="relative">
                            <select
                                value={spendTypeFilter}
                                onChange={(e) => setSpendTypeFilter(e.target.value)}
                                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 font-medium text-ink dark:text-paper focus:outline-none focus:ring-1 focus:ring-peso/40 cursor-pointer text-xs"
                            >
                                <option value="all">All Spend Types</option>
                                <option value="need">Needs (Essential)</option>
                                <option value="luho">Luho (Discretionary)</option>
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink2/40 dark:text-paper/40">
                                <LIST_ICONS.ArrowUpDown size={11} />
                            </span>
                        </div>

                        {/* Timeframe Dropdown */}
                        <div className="relative">
                            <select
                                value={dateRangeFilter}
                                onChange={(e) => setDateRangeFilter(e.target.value)}
                                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 font-medium text-ink dark:text-paper focus:outline-none focus:ring-1 focus:ring-peso/40 cursor-pointer text-xs"
                            >
                                <option value="all">All Time</option>
                                <option value="thisMonth">This Month</option>
                                <option value="lastMonth">Last Month</option>
                                <option value="thisYear">This Year</option>
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink2/40 dark:text-paper/40">
                                <LIST_ICONS.Calendar size={11} />
                            </span>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative ml-auto">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-3 pr-7 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 font-medium text-ink dark:text-paper focus:outline-none focus:ring-1 focus:ring-peso/40 cursor-pointer text-xs"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="amountHigh">Highest Amount</option>
                                <option value="amountLow">Lowest Amount</option>
                            </select>
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-ink2/40 dark:text-paper/40">
                                <LIST_ICONS.ArrowUpDown size={11} />
                            </span>
                        </div>
                    </div>

                    {/* Filter Summary Ribbon */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink2/60 dark:text-paper/50 pt-2 border-t border-black/5 dark:border-white/5 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            <span>Showing <strong>{filteredEntries.length}</strong> of <strong>{activeEntries.length}</strong> records</span>
                            {(searchQuery || typeFilter !== "all" || categoryFilter !== "all" || walletFilter !== "all" || spendTypeFilter !== "all" || dateRangeFilter !== "all") && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-peso dark:text-pesoLight font-bold underline hover:opacity-80"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <span>In: <strong className="text-emerald-700 dark:text-emerald-400">₱{peso(ledgerStats.totalIncome)}</strong></span>
                            <span>Out: <strong className="text-rose-600 dark:text-rose-400">₱{peso(ledgerStats.totalExpense)}</strong></span>
                            <span>Net: <strong className={ledgerStats.net >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                                {ledgerStats.net < 0 ? '-' : ''}₱{peso(Math.abs(ledgerStats.net))}
                            </strong></span>
                        </div>
                    </div>
                </div>

                {/* --- 2. TRANSACTION LIST BODY --- */}
                {loading ? (
                    <div className="py-2">
                        <SkeletonRow delay={0} />
                        <SkeletonRow delay={90} />
                        <SkeletonRow delay={180} />
                        <SkeletonRow delay={270} />
                    </div>
                ) : activeEntries.length === 0 ? (
                    <div className="empty-bounce py-16 sm:py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
                        <span className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-paperDim to-paperDim/50 dark:from-ink2/60 dark:to-ink2/20 border border-dashed border-line dark:border-white/15 flex items-center justify-center shadow-sm text-peso">
                            <LIST_ICONS.Inbox size={26} />
                        </span>
                        <p className="text-[14px] font-semibold text-ink dark:text-paper">
                            No transactions recorded yet
                        </p>
                        <p className="text-[12px] text-ink2/60 dark:text-paper/50 max-w-[260px] leading-relaxed">
                            Log income or expenses from your Dashboard to start tracking your finances.
                        </p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                        <LIST_ICONS.Search size={28} className="text-ink2/30 dark:text-paper/30 mb-2" />
                        <p className="text-sm font-semibold text-ink dark:text-paper">No transactions match your search</p>
                        <p className="text-xs text-ink2/50 dark:text-paper/40 mt-1 mb-4">Try clearing your filters or changing search keywords.</p>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="tap-scale px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-bold text-ink dark:text-paper hover:bg-black/10"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                        {groupedEntries.map((group) => (
                            <div key={group.title} className="p-3 sm:p-4">
                                {/* Chronological Group Header */}
                                <div className="flex items-center justify-between px-3 py-1.5 mb-1 text-[11px] font-mono text-ink2/50 dark:text-paper/40 font-semibold uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-peso" />
                                        <span>{group.title}</span>
                                        <span className="text-[10px] font-normal lowercase">({group.entries.length})</span>
                                    </div>
                                    <span className={group.subtotal >= 0 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-ink2/60 dark:text-paper/50"}>
                                        {group.subtotal < 0 ? '-' : '+'}₱{peso(Math.abs(group.subtotal))}
                                    </span>
                                </div>

                                <ul className="space-y-1">
                                    {group.entries.map((item) => (
                                        <window.ExpenseItem
                                            key={item.id}
                                            item={item}
                                            uid={uid}
                                            onViewReceipt={(entryData) => setActiveReceipt(entryData)}
                                        />
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Digital Receipt Inspection Modal */}
            {activeReceipt && (
                <DigitalReceiptModal
                    entry={activeReceipt}
                    onClose={() => setActiveReceipt(null)}
                />
            )}
        </div>
    );
}

// Attach to window for global component loading
window.EntryList = EntryList;
window.ExpenseList = EntryList;
