// components/ExpenseChart.js

// --- REAL SVG ICONS SUITE ---
const CHART_ICONS = {
    Doughnut: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.15" />
            <path d="M12 2v6" />
        </svg>
    ),
    LineTrend: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    BarFlow: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="13" width="4" height="8" rx="1" fill="currentColor" fillOpacity="0.15" />
            <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" fillOpacity="0.25" />
            <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" fillOpacity="0.15" />
        </svg>
    ),
    Wallet: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" fill="currentColor" fillOpacity="0.15" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            <circle cx="18" cy="14" r="0.75" fill="currentColor" stroke="none" />
        </svg>
    ),
    NeedWant: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    Sparkles: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    ArrowUp: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    ArrowDown: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
        </svg>
    ),
    Check: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Clock: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
        </svg>
    ),
    Inbox: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    ),
    Zap: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Eye: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
};

window.ExpenseChart = function ExpenseChart({ entries = [], onStatsChange }) {
    const { useState, useMemo, useEffect, useRef } = React;
    const peso = window.peso || ((n) => Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 }));

    // View Options: 'category', 'trend', 'flow', 'wallet', 'needwant'
    const [view, setView] = useState("category");
    const [dateFilter, setDateFilter] = useState("thisMonth"); // 'thisWeek', 'thisMonth', 'thisYear', 'all'

    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Active dataset: uses live Firebase entries
    const activeEntries = entries || [];

    // 1. Date Range Filtering
    const filteredEntries = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const dayOfWeek = (now.getDay() + 6) % 7;
        const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek).getTime();
        const startOfThisYear = new Date(now.getFullYear(), 0, 1).getTime();

        return activeEntries.filter(e => {
            if (dateFilter === "all") return true;
            const parsedDate = window.TipidCore ? window.TipidCore.entryDate(e) : new Date(e.date || e.createdAt);
            const entryTime = parsedDate ? parsedDate.getTime() : null;
            if (!entryTime || isNaN(entryTime)) return true;

            if (dateFilter === "thisWeek") return entryTime >= startOfThisWeek;
            if (dateFilter === "thisMonth") return entryTime >= startOfThisMonth;
            if (dateFilter === "thisYear") return entryTime >= startOfThisYear;
            return true;
        });
    }, [activeEntries, dateFilter]);

    // 2. Comprehensive Financial Analytics Engine
    const analytics = useMemo(() => {
        const expenses = filteredEntries.filter(e => e.type === "expense");
        const incomes = filteredEntries.filter(e => e.type === "income");

        const totalExpense = window.TipidCore ? window.TipidCore.sumMoney(expenses.map(e => e.amount)) : expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const totalIncome = window.TipidCore ? window.TipidCore.sumMoney(incomes.map(e => e.amount)) : incomes.reduce((s, e) => s + (e.amount || 0), 0);
        const net = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((net / totalIncome) * 100)) : 0;

        // Needs vs Wants (Guilt Tracker)
        const needsTotal = expenses.filter(e => e.spendType === "need" || !e.spendType).reduce((s, e) => s + (e.amount || 0), 0);
        const luhoTotal = expenses.filter(e => e.spendType === "luho").reduce((s, e) => s + (e.amount || 0), 0);
        const needsPct = totalExpense > 0 ? Math.round((needsTotal / totalExpense) * 100) : 0;
        const luhoPct = totalExpense > 0 ? Math.round((luhoTotal / totalExpense) * 100) : 0;

        // Category Grouping
        const catGroup = expenses.reduce((acc, e) => {
            const cat = e.category || "Iba pa";
            acc[cat] = (acc[cat] || 0) + (e.amount || 0);
            return acc;
        }, {});

        const catLabels = Object.keys(catGroup);
        const catAmounts = catLabels.map(k => catGroup[k]);
        const catColors = catLabels.map(cat => (window.CATEGORY_COLOR && window.CATEGORY_COLOR[cat]) || "#1F6F54");

        // Wallet Grouping
        const walletGroup = expenses.reduce((acc, e) => {
            const method = e.method || "Cash";
            acc[method] = (acc[method] || 0) + (e.amount || 0);
            return acc;
        }, {});
        const walletLabels = Object.keys(walletGroup);
        const walletAmounts = walletLabels.map(k => walletGroup[k]);

        // Daily Spend Trajectory (Timeline Curve)
        const dayMap = {};
        expenses.forEach(e => {
            const d = window.TipidCore ? window.TipidCore.entryDate(e) : new Date(e.date || e.createdAt);
            if (!d) return;
            const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            dayMap[key] = (dayMap[key] || 0) + (e.amount || 0);
        });
        const timelineLabels = Object.keys(dayMap);
        const timelineAmounts = timelineLabels.map(k => dayMap[k]);

        // Daily average burn
        const divisor = Math.max(timelineLabels.length, 1);
        const avgDaily = totalExpense > 0 ? (totalExpense / divisor) : 0;

        // Top category name
        let topCategory = "None";
        let maxCatAmount = 0;
        Object.entries(catGroup).forEach(([cat, amt]) => {
            if (amt > maxCatAmount) {
                maxCatAmount = amt;
                topCategory = window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[cat] || cat) : cat;
            }
        });

        // Top 5 largest transactions
        const topTransactions = [...expenses].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 5);

        return {
            totalExpense,
            totalIncome,
            net,
            savingsRate,
            needsTotal,
            luhoTotal,
            needsPct,
            luhoPct,
            catLabels,
            catAmounts,
            catColors,
            walletLabels,
            walletAmounts,
            timelineLabels,
            timelineAmounts,
            avgDaily,
            topCategory,
            topTransactions
        };
    }, [filteredEntries]);

    // Send high-level stats to parent hero banner
    useEffect(() => {
        if (typeof onStatsChange === "function") {
            onStatsChange({
                totalExpense: analytics.totalExpense,
                totalIncome: analytics.totalIncome,
                net: analytics.net,
                topCategory: analytics.topCategory,
                savingsRate: analytics.savingsRate
            });
        }
    }, [analytics, onStatsChange]);

    // Sorted categories for modern custom legend
    const sortedCategories = useMemo(() => {
        const total = analytics.totalExpense || 0;
        return analytics.catLabels
            .map((label, i) => ({
                label,
                displayLabel: window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[label] || label) : label,
                amount: analytics.catAmounts[i],
                color: analytics.catColors[i],
                pct: total > 0 ? (analytics.catAmounts[i] / total) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [analytics]);

    // 3. Render Chart.js
    useEffect(() => {
        if (!chartRef.current || typeof window.Chart !== 'function') return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        let config = {};

        // VIEW 1: DOUGHNUT CATEGORY DISTRIBUTION
        if (view === "category") {
            const hasData = analytics.catAmounts.length > 0 && analytics.catAmounts.some(v => v > 0);
            config = {
                type: 'doughnut',
                data: {
                    labels: hasData ? analytics.catLabels.map(l => (window.CATEGORY_DISPLAY && window.CATEGORY_DISPLAY[l]) || l) : ["No Expenses"],
                    datasets: [{
                        data: hasData ? analytics.catAmounts : [1],
                        backgroundColor: hasData ? analytics.catColors : ['rgba(128, 128, 128, 0.15)'],
                        borderWidth: 0,
                        hoverOffset: hasData ? 6 : 0,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: hasData, padding: 12, cornerRadius: 10 }
                    },
                    cutout: '74%'
                }
            };
        }
        // VIEW 2: TIMELINE SPENDING VELOCITY (AREA CURVE)
        else if (view === "trend") {
            config = {
                type: 'line',
                data: {
                    labels: analytics.timelineLabels.length > 0 ? analytics.timelineLabels : ["No logs"],
                    datasets: [{
                        label: 'Daily Outflow',
                        data: analytics.timelineAmounts.length > 0 ? analytics.timelineAmounts : [0],
                        borderColor: '#1F6F54',
                        backgroundColor: 'rgba(31, 111, 84, 0.15)',
                        fill: true,
                        tension: 0.38,
                        pointBackgroundColor: '#1F6F54',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        borderWidth: 2.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(128,128,128,0.1)' },
                            border: { display: false }
                        },
                        x: {
                            grid: { display: false },
                            border: { display: false }
                        }
                    }
                }
            };
        }
        // VIEW 3: INFLOW VS OUTFLOW (DUAL BAR CASH FLOW)
        else if (view === "flow") {
            config = {
                type: 'bar',
                data: {
                    labels: ['Total Inflow (Income)', 'Total Outflow (Expenses)', 'Net Surplus'],
                    datasets: [{
                        label: 'Amount',
                        data: [analytics.totalIncome, analytics.totalExpense, Math.max(0, analytics.net)],
                        backgroundColor: ['#059669', '#E11D48', '#1F6F54'],
                        borderRadius: 8,
                        barPercentage: 0.55
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(128,128,128,0.1)' },
                            border: { display: false }
                        },
                        x: {
                            grid: { display: false },
                            border: { display: false }
                        }
                    }
                }
            };
        }
        // VIEW 4: PAYMENT WALLET CHANNELS (HORIZONTAL BAR)
        else if (view === "wallet") {
            const hasData = analytics.walletAmounts.length > 0 && analytics.walletAmounts.some(v => v > 0);
            config = {
                type: 'bar',
                data: {
                    labels: hasData ? analytics.walletLabels : ["No Wallets"],
                    datasets: [{
                        label: 'Spent via Wallet',
                        data: hasData ? analytics.walletAmounts : [0],
                        backgroundColor: '#0284C7',
                        borderRadius: 6,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { color: 'rgba(128,128,128,0.1)' },
                            border: { display: false }
                        },
                        y: {
                            grid: { display: false },
                            border: { display: false }
                        }
                    }
                }
            };
        }

        if (view !== "needwant") {
            chartInstance.current = new window.Chart(ctx, config);
        }

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [view, analytics]);

    const filterNameMap = {
        thisWeek: "this week",
        thisMonth: "this month",
        thisYear: "this year",
        all: "all time"
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* --- MAIN CHART CONTROLS BENTO CARD --- */}
            <div className="bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-peso to-gold" />

                {/* Top Action Row: Title, Date Pills & Demo Mode Toggle */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-gold/10 dark:bg-gold/15 text-gold dark:text-[#E8C071] flex items-center justify-center shrink-0 border border-gold/20 shadow-xs">
                            <CHART_ICONS.BarFlow size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-[1.18rem] sm:text-[1.25rem] font-bold text-ink dark:text-paper leading-tight">
                                Cash Flow Analytics
                            </h3>
                            <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                Filtered by {filterNameMap[dateFilter] || "selected period"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Timeframe Segmented Control */}
                        <div role="group" aria-label="Timeframe" className="inline-flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-xl text-xs font-semibold">
                            {[
                                { key: "thisWeek", label: "Week" },
                                { key: "thisMonth", label: "Month" },
                                { key: "thisYear", label: "Year" },
                                { key: "all", label: "All" }
                            ].map(opt => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => setDateFilter(opt.key)}
                                    className={`tap-scale px-3 py-1.5 rounded-lg transition-all ${
                                        dateFilter === opt.key
                                            ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-bold"
                                            : "text-ink2/60 dark:text-paper/60 hover:text-ink"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4 Financial Health Vital Signs Bento Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/40 mb-1">
                            Savings Margin
                        </p>
                        <p className={`font-mono text-xl sm:text-2xl font-bold truncate ${analytics.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {analytics.net >= 0 ? `+${analytics.savingsRate}%` : 'Deficit'}
                        </p>
                        <p className="text-[10px] text-ink2/50 dark:text-paper/40 mt-0.5">
                            Retained margin
                        </p>
                    </div>

                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/40 mb-1">
                            Daily Velocity
                        </p>
                        <p className="font-mono text-xl sm:text-2xl font-bold text-ink dark:text-paper truncate">
                            ₱{peso(analytics.avgDaily)}
                        </p>
                        <p className="text-[10px] text-ink2/50 dark:text-paper/40 mt-0.5">
                            Average spend/day
                        </p>
                    </div>

                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/40 mb-1">
                            Top Outflow
                        </p>
                        <p className="font-mono text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 truncate">
                            {analytics.topCategory}
                        </p>
                        <p className="text-[10px] text-ink2/50 dark:text-paper/40 mt-0.5">
                            Highest category
                        </p>
                    </div>

                    <div className="bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/40 mb-1">
                            Essentials Ratio
                        </p>
                        <p className="font-mono text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 truncate">
                            {analytics.needsPct}%
                        </p>
                        <p className="text-[10px] text-ink2/50 dark:text-paper/40 mt-0.5">
                            Needs vs wants
                        </p>
                    </div>
                </div>

                {/* 5 Distinct Interactive Chart View Switcher Pills */}
                <div role="group" aria-label="Chart mode" className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 mb-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    <button
                        type="button"
                        onClick={() => setView("category")}
                        className={`tap-scale flex-1 min-w-[7.5rem] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            view === "category" ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs" : "text-ink2/60 dark:text-paper/50 hover:text-ink"
                        }`}
                    >
                        <CHART_ICONS.Doughnut size={14} />
                        <span>Categories</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setView("trend")}
                        className={`tap-scale flex-1 min-w-[7.5rem] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            view === "trend" ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs" : "text-ink2/60 dark:text-paper/50 hover:text-ink"
                        }`}
                    >
                        <CHART_ICONS.LineTrend size={14} />
                        <span>Timeline Curve</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setView("flow")}
                        className={`tap-scale flex-1 min-w-[7.5rem] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            view === "flow" ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs" : "text-ink2/60 dark:text-paper/50 hover:text-ink"
                        }`}
                    >
                        <CHART_ICONS.BarFlow size={14} />
                        <span>Cash Flow Bars</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setView("wallet")}
                        className={`tap-scale flex-1 min-w-[7.5rem] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            view === "wallet" ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs" : "text-ink2/60 dark:text-paper/50 hover:text-ink"
                        }`}
                    >
                        <CHART_ICONS.Wallet size={14} />
                        <span>Wallets</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setView("needwant")}
                        className={`tap-scale flex-1 min-w-[7.5rem] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            view === "needwant" ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs" : "text-ink2/60 dark:text-paper/50 hover:text-ink"
                        }`}
                    >
                        <CHART_ICONS.NeedWant size={14} />
                        <span>50/30/20 Rule</span>
                    </button>
                </div>

                {/* --- CHART DISPLAY CANVAS AREA --- */}
                <div className="relative w-full min-h-[260px] flex items-center justify-center">
                    {/* VIEW 1: DOUGHNUT + CUSTOM LEGEND */}
                    {view === "category" && (
                        <div className="w-full flex flex-col md:flex-row items-center gap-6 sm:gap-10">
                            <div className="relative w-52 h-52 sm:w-60 sm:h-60 shrink-0">
                                <canvas ref={chartRef} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                    <span className="text-[9px] font-mono uppercase font-bold text-ink2/50 dark:text-paper/40">Total Outflow</span>
                                    <span className="font-mono text-lg sm:text-xl font-bold text-ink dark:text-paper">₱{peso(analytics.totalExpense)}</span>
                                </div>
                            </div>

                            {/* Custom Apple-Style Progress Legend */}
                            <div className="w-full flex flex-col gap-2.5 min-w-0">
                                {sortedCategories.length > 0 ? (
                                    sortedCategories.map(c => (
                                        <div key={c.label} className="flex items-center gap-3 bg-black/[0.02] dark:bg-white/[0.02] p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: c.color }} />
                                            <span className="text-xs font-semibold text-ink dark:text-paper flex-1 truncate">{c.displayLabel || c.label}</span>
                                            <span className="text-[11px] font-mono text-ink2/50 dark:text-paper/40 w-8 text-right">{c.pct.toFixed(0)}%</span>
                                            <div className="w-16 sm:w-24 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden shrink-0">
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                                            </div>
                                            <span className="font-mono text-xs font-bold text-ink dark:text-paper w-20 text-right truncate">₱{peso(c.amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-ink2/50 dark:text-paper/40 text-xs font-medium">
                                        No expense records found for {filterNameMap[dateFilter]}.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VIEW 2: TIMELINE SPENDING VELOCITY */}
                    {view === "trend" && (
                        <div className="w-full h-64 sm:h-72">
                            <canvas ref={chartRef} />
                        </div>
                    )}

                    {/* VIEW 3: INFLOW VS OUTFLOW (DUAL BARS) */}
                    {view === "flow" && (
                        <div className="w-full h-64 sm:h-72">
                            <canvas ref={chartRef} />
                        </div>
                    )}

                    {/* VIEW 4: WALLET DISTRIBUTION */}
                    {view === "wallet" && (
                        <div className="w-full h-64 sm:h-72">
                            <canvas ref={chartRef} />
                        </div>
                    )}

                    {/* VIEW 5: GUILT TRACKER & 50/30/20 BENCHMARK */}
                    {view === "needwant" && (
                        <div className="w-full space-y-6">
                            <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span>Essential Needs vs Discretionary Wants</span>
                                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{analytics.luhoPct}% Luho</span>
                                </div>

                                <div className="h-3 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex">
                                    <div style={{ width: `${analytics.needsPct}%` }} className="bg-emerald-600 transition-all duration-700" />
                                    <div style={{ width: `${analytics.luhoPct}%` }} className="bg-rose-500 transition-all duration-700" />
                                </div>

                                <div className="flex items-center justify-between text-xs font-mono">
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Needs: ₱{peso(analytics.needsTotal)} ({analytics.needsPct}%)</span>
                                    <span className="text-rose-600 dark:text-rose-400 font-bold">Wants: ₱{peso(analytics.luhoTotal)} ({analytics.luhoPct}%)</span>
                                </div>
                            </div>

                            {/* 50/30/20 Ideal Guidance Card */}
                            <div className="grid grid-cols-3 gap-3 text-center text-xs">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="font-bold text-emerald-800 dark:text-emerald-300">50% Needs</p>
                                    <p className="text-[11px] text-ink2/60 dark:text-paper/50 mt-0.5">Bills, groceries & transit</p>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <p className="font-bold text-amber-800 dark:text-amber-300">30% Wants</p>
                                    <p className="text-[11px] text-ink2/60 dark:text-paper/50 mt-0.5">Dining out & leisure</p>
                                </div>
                                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                                    <p className="font-bold text-sky-800 dark:text-sky-300">20% Savings</p>
                                    <p className="text-[11px] text-ink2/60 dark:text-paper/50 mt-0.5">Emergency cushion</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================================== */}
            {/* 6. TOP 5 LARGEST TRANSACTIONS IN PERIOD                        */}
            {/* ============================================================== */}
            {analytics.topTransactions.length > 0 && (
                <div className="fade-up bg-white/70 dark:bg-ink2/30 backdrop-blur-xl rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-peso dark:text-pesoLight">
                                <CHART_ICONS.Zap size={16} />
                            </span>
                            <h3 className="font-display text-[1.1rem] font-semibold text-ink dark:text-paper tracking-tight">
                                Top Expenses This Period
                            </h3>
                        </div>
                        <span className="text-[11px] font-mono text-ink2/50 dark:text-paper/40">
                            Ranked by ticket size
                        </span>
                    </div>

                    <div className="divide-y divide-black/5 dark:divide-white/5">
                        {analytics.topTransactions.map((tx, idx) => (
                            <div key={tx.id || idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center font-mono font-bold text-xs text-ink2/70 dark:text-paper/70 shrink-0">
                                        #{idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-ink dark:text-paper truncate">
                                            {tx.desc || tx.category}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink2/60 dark:text-paper/50">
                                            <span>{window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[tx.category] || tx.category) : tx.category}</span>
                                            <span>•</span>
                                            <span className="font-mono">{tx.method || "Cash"}</span>
                                        </div>
                                    </div>
                                </div>

                                <span className="font-mono text-base font-bold text-rose-600 dark:text-rose-400 shrink-0">
                                    ₱{peso(tx.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
