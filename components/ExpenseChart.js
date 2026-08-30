// components/ExpenseChart.js
//
// ASSUMPTIONS:
//   - window.useState/useMemo/useEffect/useRef, window.Chart, window.CATEGORY_COLOR,
//     and a bare global `peso()` formatter are all set up elsewhere before this loads
//   - Icons.{Chart, Category, AlertCircle, Inbox} exist on a global Icons object
//   - `ExpenseChart` is referenced by its exact global name elsewhere
//   - `expense` and `gold` are real Tailwind color tokens in this project.

function ExpenseChartStyles() {
    return (
        <style>{`
            @keyframes legendRowIn {
                from { opacity: 0; transform: translateX(-8px); }
                to   { opacity: 1; transform: translateX(0); }
            }
            .legend-row { animation: legendRowIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }

            /* Modernized ruler/axis tick pattern for the top edge */
            .tick-edge {
                -webkit-mask-image: repeating-linear-gradient(90deg, black 0 4px, transparent 4px 10px);
                mask-image: repeating-linear-gradient(90deg, black 0 4px, transparent 4px 10px);
            }

            /* Quiet "just recalculated" pulse for totals when the filter/view changes */
            @keyframes statPop {
                from { opacity: 0; transform: scale(0.97) translateY(2px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            .stat-pop { animation: statPop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }

            @media (prefers-reduced-motion: reduce) {
                .legend-row, .stat-pop { animation: none !important; }
            }
        `}</style>
    );
}

function TrendGlyph({ up, size = 12 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {up ? <path d="M6 18L18 6M18 6H9M18 6v9" /> : <path d="M6 6l12 12M18 18H9M18 18V9" />}
        </svg>
    );
}

window.ExpenseChart = function ExpenseChart({ entries }) {
    const { useState, useMemo, useEffect, useRef } = window;
    const peso = window.peso; // Ensure we grab the global formatter

    const [view, setView] = useState("category"); // 'category', 'flow'
    const [dateFilter, setDateFilter] = useState("thisMonth"); // 'all', 'thisMonth', 'lastMonth'

    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [chartLoaded, setChartLoaded] = useState(true);

    // 1. Improved Filter supporting both numeric timestamps and date strings
    const filteredEntries = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

        return entries.filter(e => {
            if (dateFilter === "all") return true;

            // Safe date parsing (handles numbers, strings, or Firestore timestamps)
            let entryTime = e.timestamp;
            if (typeof entryTime === 'string' || entryTime instanceof String) {
                entryTime = new Date(entryTime).getTime();
            } else if (entryTime && typeof entryTime.toMillis === 'function') {
                entryTime = entryTime.toMillis();
            }

            if (!entryTime || isNaN(entryTime)) return true; // fallback kung walang date

            if (dateFilter === "thisMonth") return entryTime >= startOfThisMonth;
            if (dateFilter === "lastMonth") return entryTime >= startOfLastMonth && entryTime <= endOfLastMonth;

            return true;
        });
    }, [entries, dateFilter]);

    // 2. Compute analytics based on FILTERED entries (Added Guilt Tracker Logic)
    const analytics = useMemo(() => {
        const expenses = filteredEntries.filter(e => e.type === "expense");
        const incomes = filteredEntries.filter(e => e.type === "income");

        const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount)||0), 0);
        const totalIncome = incomes.reduce((sum, e) => sum + (Number(e.amount)||0), 0);

        // Guilt Tracker Computation
        // Kung lumang data na walang spendType, ituturing itong "need" para hindi masira ang chart
        const needsTotal = expenses.filter(e => e.spendType === "need" || !e.spendType).reduce((sum, e) => sum + (Number(e.amount)||0), 0);
        const luhoTotal = expenses.filter(e => e.spendType === "luho").reduce((sum, e) => sum + (Number(e.amount)||0), 0);
        const luhoPct = totalExpense > 0 ? Math.round((luhoTotal / totalExpense) * 100) : 0;

        const catGroup = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + (Number(e.amount)||0);
            return acc;
        }, {});

        const catLabels = Object.keys(catGroup);
        const categories = catLabels.map(k => catGroup[k]);
        const catColors = catLabels.map(cat => window.CATEGORY_COLOR[cat] || "#D3DAD0");

        const net = totalIncome - totalExpense;

        return { totalExpense, totalIncome, categories, catLabels, catColors, net, needsTotal, luhoTotal, luhoPct };
    }, [filteredEntries]);

    // Category breakdown re-shaped for the custom legend
    const sortedCategories = useMemo(() => {
        const total = analytics.totalExpense || 0;
        return analytics.catLabels
            .map((label, i) => ({
                label,
                amount: analytics.categories[i],
                color: analytics.catColors[i],
                pct: total > 0 ? (analytics.categories[i] / total) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [analytics]);

    const hasCategoryData = analytics.catLabels.length > 0;

    // Plain-language chart description for screen readers
    const chartSummary = useMemo(() => {
        if (view === "category") {
            if (!hasCategoryData) return "Walang gastos na naitala sa napiling panahon.";
            const top = sortedCategories.slice(0, 3)
                .map(c => `${c.label} ₱${peso(c.amount)}, ${c.pct.toFixed(0)} porsyento`)
                .join("; ");
            return `Doughnut chart ng gastos ayon sa kategorya. Kabuuang gastos: ₱${peso(analytics.totalExpense)}. Pangunahing kategorya: ${top}.`;
        }
        return `Bar chart ng cash flow. Kita: ₱${peso(analytics.totalIncome)}. Gastos: ₱${peso(analytics.totalExpense)}. ${analytics.net >= 0 ? "Natitira" : "Kulang"}: ₱${peso(Math.abs(analytics.net))}.`;
    }, [view, hasCategoryData, sortedCategories, analytics, peso]);

    // 3. Render Chart
    useEffect(() => {
        if (!chartRef.current || filteredEntries.length === 0) return;

        if (typeof window.Chart !== 'function') {
            console.error("Chart.js library is not loaded yet.");
            setChartLoaded(false);
            return;
        }
        setChartLoaded(true);

        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext('2d');
        let config = {};

        if (view === "category") {
            config = {
                type: 'doughnut',
                data: {
                    labels: analytics.catLabels,
                    datasets: [{
                        data: analytics.categories,
                        backgroundColor: analytics.catColors,
                        borderWidth: 0,
                        hoverOffset: 8,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { padding: 12, cornerRadius: 8 } },
                    cutout: '76%'
                }
            };
        } else {
            config = {
                type: 'bar',
                data: {
                    labels: ['Kita', 'Gastos'],
                    datasets: [{
                        label: 'Halaga',
                        data: [analytics.totalIncome, analytics.totalExpense],
                        backgroundColor: ['#2F8E6C', '#B5483B'],
                        borderRadius: 8,
                        barPercentage: 0.55
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(150,150,150,0.1)' } },
                        x: { border: { display: false }, grid: { display: false } }
                    }
                }
            };
        }

        chartInstance.current = new window.Chart(ctx, config);

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [view, analytics, filteredEntries]);

    const filterLabel = { thisMonth: "ngayong buwan", lastMonth: "nakaraang buwan", all: "lahat ng oras" }[dateFilter];

    return (
        <div className="relative overflow-hidden bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 mb-6 fade-up">
            <ExpenseChartStyles />
            <div className="tick-edge absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold/80 via-[#F3A536]/80 to-peso/80" />

            {/* Header & Main Date Filters */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-[14px] bg-gold/10 dark:bg-gold/15 text-gold dark:text-[#F3A536] flex items-center justify-center shrink-0">
                        <window.Icons.Chart size={18} />
                    </span>
                    <div>
                        <h2 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper tracking-tight leading-tight">Analytics</h2>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">Batay sa {filterLabel}</p>
                    </div>
                </div>

                {/* iOS-Style Segmented Date Control */}
                <div role="group" aria-label="Saklaw ng petsa" className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-full text-[12px] font-medium w-full sm:w-auto">
                    {[
                        { key: "thisMonth", label: "This Month" },
                        { key: "lastMonth", label: "Last Month" },
                        { key: "all", label: "All Time" }
                    ].map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            aria-pressed={dateFilter === opt.key}
                            onClick={() => setDateFilter(opt.key)}
                            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${
                                dateFilter === opt.key
                                    ? 'bg-white dark:bg-ink2 text-ink dark:text-paper shadow-sm font-semibold'
                                    : 'text-ink2/60 dark:text-paper/60 hover:text-ink dark:hover:text-paper'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* NEW: GUILT TRACKER BAR */}
            {chartLoaded && filteredEntries.length > 0 && analytics.totalExpense > 0 && (
                <div key={`guilt-${dateFilter}`} className="stat-pop mb-6 bg-white/40 dark:bg-black/10 rounded-[1.25rem] p-4 sm:p-5 border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 mb-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-ink/70 dark:text-paper/70">Guilt Tracker</span>
                            </div>
                            <h3 className="font-display text-[1.1rem] font-semibold text-ink dark:text-paper leading-none">Need vs Luho</h3>
                        </div>
                        <div className="text-right">
                            <span className="font-mono text-2xl font-bold text-[#B5483B] dark:text-[#F38C80] leading-none block mb-0.5">{analytics.luhoPct}%</span>
                            <p className="text-[10px] font-medium text-ink2/60 dark:text-paper/50">napunta sa Luho</p>
                        </div>
                    </div>

                    <div className="h-2 w-full rounded-full bg-[#1F6F54] dark:bg-[#52C8A1] overflow-hidden flex">
                        <div className="h-full bg-[#B5483B] dark:bg-[#F38C80] transition-all duration-1000 ease-out" style={{ width: `${analytics.luhoPct}%` }}></div>
                    </div>

                    <div className="flex justify-between mt-2.5 text-[11px] font-mono font-medium">
                        <span className="text-[#B5483B] dark:text-[#F38C80]">Luho: ₱{peso(analytics.luhoTotal)}</span>
                        <span className="text-[#1F6F54] dark:text-[#52C8A1]">Need: ₱{peso(analytics.needsTotal)}</span>
                    </div>
                </div>
            )}

            {/* Quick Stat Chips — pop softly whenever the date filter changes */}
            <div key={`stats-${dateFilter}`} className="stat-pop flex items-center gap-2.5 sm:gap-4 mb-6 flex-wrap">
                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#E6F3EF] dark:bg-[#1F6F54]/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2F8E6C]"></span>
                    <span className="text-[11px] font-medium text-[#1F6F54] dark:text-[#52C8A1]">Kita:</span>
                    <span className="font-mono text-xs font-bold text-[#1F6F54] dark:text-[#52C8A1]">₱{peso(analytics.totalIncome)}</span>
                </div>

                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FAEDE9] dark:bg-[#B5483B]/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B5483B]"></span>
                    <span className="text-[11px] font-medium text-[#B5483B] dark:text-[#F38C80]">Gastos:</span>
                    <span className="font-mono text-xs font-bold text-[#B5483B] dark:text-[#F38C80]">₱{peso(analytics.totalExpense)}</span>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${
                    analytics.net >= 0
                        ? "bg-black/5 dark:bg-white/10 text-ink dark:text-paper"
                        : "bg-expense/10 dark:bg-expense/20 text-expense dark:text-[#F38C80]"
                }`}>
                    <TrendGlyph up={analytics.net >= 0} />
                    <span className="font-mono text-xs font-bold">₱{peso(Math.abs(analytics.net))}</span>
                    <span className="text-[10px] font-medium opacity-70">{analytics.net >= 0 ? "natitira" : "kulang"}</span>
                </div>
            </div>

            {/* View Toggles (Category vs Cash Flow) */}
            <div role="group" aria-label="Uri ng tsart" className="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-[14px] mb-6">
                <button
                    onClick={() => setView("category")}
                    aria-pressed={view === "category"}
                    className={`flex-1 inline-flex items-center justify-center gap-2 text-[12px] font-semibold py-2.5 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${
                        view === "category" ? 'bg-white dark:bg-ink2 text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper'
                    }`}
                >
                    <window.Icons.Category size={14} /> Kategorya
                </button>
                <button
                    onClick={() => setView("flow")}
                    aria-pressed={view === "flow"}
                    className={`flex-1 inline-flex items-center justify-center gap-2 text-[12px] font-semibold py-2.5 rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${
                        view === "flow" ? 'bg-white dark:bg-ink2 text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper'
                    }`}
                >
                    <window.Icons.Chart size={14} /> Cash Flow
                </button>
            </div>

            {/* Chart Area */}
            <div className="relative w-full">
                {/* Screen-reader-only data summary */}
                <p className="sr-only" aria-live="polite">{chartSummary}</p>

                {!chartLoaded && (
                    <div className="h-56 flex flex-col items-center justify-center gap-3 text-center bg-white/40 dark:bg-black/10 rounded-2xl">
                        <window.Icons.AlertCircle size={22} className="text-expense" />
                        <p className="text-[13px] text-expense font-medium">Hindi ma-load ang chart library.<br/>Paki-refresh ang pahina.</p>
                    </div>
                )}

                {chartLoaded && filteredEntries.length === 0 && (
                    <div className="h-56 flex flex-col items-center justify-center gap-4 text-center bg-white/40 dark:bg-black/10 rounded-2xl">
                        <div className="relative flex items-center justify-center w-14 h-14">
                            <div className="absolute inset-0 bg-peso/10 dark:bg-pesoLight/10 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                            <span className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-paperDim to-paperDim/50 dark:from-ink2/60 dark:to-ink2/20 border border-dashed border-line dark:border-white/15 flex items-center justify-center">
                                <window.Icons.Inbox size={24} className="text-peso/60 dark:text-pesoLight/60" />
                            </span>
                        </div>
                        <p className="text-[13px] font-medium text-ink2/60 dark:text-paper/50">Walang data sa panahong ito.</p>
                    </div>
                )}

                {chartLoaded && filteredEntries.length > 0 && view === "category" && !hasCategoryData && (
                    <div className="h-56 flex flex-col items-center justify-center gap-4 text-center bg-white/40 dark:bg-black/10 rounded-2xl">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-paperDim to-paperDim/50 dark:from-ink2/60 dark:to-ink2/20 border border-dashed border-line dark:border-white/15 flex items-center justify-center">
                            <window.Icons.Inbox size={24} className="text-ink2/40 dark:text-paper/30" />
                        </div>
                        <p className="text-[13px] font-medium text-ink2/60 dark:text-paper/50">Walang gastos na naitala sa panahong ito.</p>
                    </div>
                )}

                {chartLoaded && filteredEntries.length > 0 && view === "category" && hasCategoryData && (
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                        {/* Doughnut Chart */}
                        <div className="relative h-48 w-48 sm:h-52 sm:w-52 shrink-0 drop-shadow-md">
                            <canvas ref={chartRef} role="img" aria-label={chartSummary}></canvas>
                            <div key={`center-${dateFilter}-${analytics.totalExpense}`} aria-hidden="true" className="stat-pop absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                                <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.1em] text-ink2/50 dark:text-paper/50 mb-0.5">Kabuuang Gastos</span>
                                <span className="font-mono text-lg font-bold text-ink dark:text-paper">₱{peso(analytics.totalExpense)}</span>
                            </div>
                        </div>

                        {/* Modernized Custom Legend */}
                        <div className="w-full flex flex-col gap-3 min-w-0">
                            {sortedCategories.map((c, i) => (
                                <div key={c.label} className="legend-row flex items-center gap-3 bg-white/40 dark:bg-white/[0.03] p-2 rounded-xl transition-colors hover:bg-white/60 dark:hover:bg-white/10" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.color }}></div>
                                    <span className="text-[13px] font-medium text-ink2/80 dark:text-paper/80 flex-1 min-w-0 truncate">{c.label}</span>

                                    <span className="text-[10px] font-mono text-ink2/40 dark:text-paper/40 w-7 text-right shrink-0">{c.pct.toFixed(0)}%</span>

                                    <div className="w-12 sm:w-20 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden shrink-0">
                                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${c.pct}%`, backgroundColor: c.color }}></div>
                                    </div>

                                    <span className="text-[13px] font-mono font-bold text-ink dark:text-paper w-16 sm:w-20 text-right shrink-0 truncate">₱{peso(c.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {chartLoaded && filteredEntries.length > 0 && view === "flow" && (
                    <div className="h-60 w-full pt-2">
                        <canvas ref={chartRef} role="img" aria-label={chartSummary}></canvas>
                    </div>
                )}
            </div>
        </div>
    );
}
