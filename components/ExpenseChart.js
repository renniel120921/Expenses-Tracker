// components/ExpenseChart.js
//
// ASSUMPTIONS (unchanged from the original — carried forward, not re-verified here):
//   - window.useState/useMemo/useEffect/useRef, window.Chart, window.CATEGORY_COLOR,
//     and a bare global `peso()` formatter are all set up elsewhere before this loads
//   - Icons.{Chart, Category, AlertCircle, Inbox} exist on a global Icons object
//   - `ExpenseChart` is referenced by its exact global name elsewhere, so it's unchanged
//   - `expense` and `gold` are real Tailwind color tokens in this project (confirmed by
//     their use in the original file — bg-expense, text-gold, etc.), so new markup below
//     uses those tokens directly instead of arbitrary hex values.

function ExpenseChartStyles() {
    return (
        <style>{`
            @keyframes legendRowIn {
                from { opacity: 0; transform: translateX(-4px); }
                to   { opacity: 1; transform: translateX(0); }
            }
            .legend-row { animation: legendRowIn 0.3s ease both; }

            /* Signature touch: a ruler/axis tick pattern instead of a flat bar —
               distinct from the perforated "receipt" edge used on the entry form,
               but drawn from the same gold-to-peso gradient family. */
            .tick-edge {
                -webkit-mask-image: repeating-linear-gradient(90deg, black 0 3px, transparent 3px 9px);
                mask-image: repeating-linear-gradient(90deg, black 0 3px, transparent 3px 9px);
            }

            @media (prefers-reduced-motion: reduce) {
                .legend-row { animation: none !important; }
            }
        `}</style>
    );
}

// Small inline glyph so the net indicator doesn't assume an up/down arrow
// exists on the shared Icons set.
function TrendGlyph({ up, size = 11 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {up ? <path d="M6 18L18 6M18 6H9M18 6v9" /> : <path d="M6 6l12 12M18 18H9M18 18V9" />}
        </svg>
    );
}

function ExpenseChart({ entries }) {
    const { useState, useMemo, useEffect, useRef } = window;
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

    // 2. Compute analytics based on FILTERED entries
    const analytics = useMemo(() => {
        const expenses = filteredEntries.filter(e => e.type === "expense");
        const incomes = filteredEntries.filter(e => e.type === "income");

        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);

        const catGroup = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});

        const catLabels = Object.keys(catGroup);
        const categories = catLabels.map(k => catGroup[k]);
        const catColors = catLabels.map(cat => window.CATEGORY_COLOR[cat] || "#D3DAD0");

        // Added purely for display (net chip below) — doesn't touch any existing field.
        const net = totalIncome - totalExpense;

        return { totalExpense, totalIncome, categories, catLabels, catColors, net };
    }, [filteredEntries]);

    // Category breakdown re-shaped for the custom legend: joined by index into
    // one array per category and sorted biggest-first, like a real ledger line-up.
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
                    datasets: [{ data: analytics.categories, backgroundColor: analytics.catColors, borderWidth: 0, hoverOffset: 6, borderRadius: 4 }]
                },
                // Legend is now rendered as custom HTML below (with amounts + share
                // bars), so Chart.js doesn't need to draw its own anymore.
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }
            };
        } else {
            config = {
                type: 'bar',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{
                        label: 'Amount', data: [analytics.totalIncome, analytics.totalExpense], backgroundColor: ['#2F8E6C', '#B5483B'], borderRadius: 8, barPercentage: 0.55
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E9EDE6' } }, x: { grid: { display: false } } } }
            };
        }

        chartInstance.current = new window.Chart(ctx, config);

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [view, analytics, filteredEntries]);

    // NOTE: previously this component returned `null` here whenever
    // `entries.length === 0`, which hid the ENTIRE card (header, toggles,
    // canvas — everything) and left a big empty gap between the section
    // eyebrow above and the divider below, with nothing to fill it.
    // The card already has a proper compact empty state further down
    // (Icons.Inbox + "Walang data sa panahong ito.") for when
    // filteredEntries is empty — removing the early return here lets that
    // existing empty state actually render instead of the whole card
    // vanishing.

    const filterLabel = { thisMonth: "ngayong buwan", lastMonth: "nakaraang buwan", all: "lahat ng oras" }[dateFilter];
    const DATE_FILTERS = [
        { key: "thisMonth", label: "This Month" },
        { key: "lastMonth", label: "Last Month" },
        { key: "all", label: "All Time" },
    ];

    return (
        <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/20 backdrop-blur-xl rounded-[1.75rem] border border-line/40 dark:border-line/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_16px_32px_-18px_rgba(21,35,28,0.22)] p-6 sm:p-8 mb-6 fade-up">
            <ExpenseChartStyles />
            <div className="tick-edge absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold to-peso" />

            {/* Header with Date Filter */}
            <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-gold/10 dark:bg-gold/20 text-gold flex items-center justify-center shrink-0">
                        <Icons.Chart size={15} />
                    </span>
                    <div>
                        <h2 className="font-semibold text-lg text-ink dark:text-paper tracking-tight leading-tight">Analytics</h2>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/40">Batay sa {filterLabel}</p>
                    </div>
                </div>

                {/* Segmented control instead of a native <select>, to match the
                    Category / Cash Flow toggle below and keep both selectors
                    reading as the same kind of control. */}
                <div className="flex items-center gap-0.5 bg-paperDim dark:bg-ink2/40 p-1 rounded-xl text-[11px] font-medium">
                    {DATE_FILTERS.map(opt => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => setDateFilter(opt.key)}
                            className={`px-2.5 py-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${
                                dateFilter === opt.key ? 'bg-white dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink2/80'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick income/expense/net stat chips — useful at a glance, especially in Cash Flow view where the chart legend is hidden */}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-pesoLight"></span>
                    <span className="text-ink2/60 dark:text-paper/50">Kita</span>
                    <span className="font-mono font-semibold text-ink dark:text-paper">₱{peso(analytics.totalIncome)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-expense"></span>
                    <span className="text-ink2/60 dark:text-paper/50">Gastos</span>
                    <span className="font-mono font-semibold text-ink dark:text-paper">₱{peso(analytics.totalExpense)}</span>
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${analytics.net >= 0 ? "bg-peso/10 text-peso dark:bg-pesoLight/15 dark:text-pesoLight" : "bg-expense/10 text-expense"}`}>
                    <TrendGlyph up={analytics.net >= 0} />
                    <span className="font-mono font-semibold">₱{peso(Math.abs(analytics.net))}</span>
                    <span className="opacity-70">{analytics.net >= 0 ? "natitira" : "kulang"}</span>
                </span>
            </div>

            {/* View Toggles */}
            <div className="flex items-center bg-paperDim dark:bg-ink2/40 p-1 rounded-2xl mb-6">
                <button onClick={() => setView("category")} className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase py-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${view === "category" ? 'bg-white dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink2/80'}`}>
                    <Icons.Category size={12} /> Categories
                </button>
                <button onClick={() => setView("flow")} className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase py-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${view === "flow" ? 'bg-white dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink2/80'}`}>
                    <Icons.Chart size={12} /> Cash Flow
                </button>
            </div>

            {/* Chart area */}
            <div className="relative w-full">
                {!chartLoaded && (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
                        <Icons.AlertCircle size={18} className="text-expense" />
                        <p className="text-xs text-expense font-medium">Chart library failed to load. Please refresh the page.</p>
                    </div>
                )}

                {chartLoaded && filteredEntries.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
                        <Icons.Inbox size={20} className="text-ink2/30 dark:text-paper/25" />
                        <p className="text-sm text-ink2/50 dark:text-paper/40">Walang data sa panahong ito.</p>
                    </div>
                )}

                {chartLoaded && filteredEntries.length > 0 && view === "category" && !hasCategoryData && (
                    <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
                        <Icons.Inbox size={20} className="text-ink2/30 dark:text-paper/25" />
                        <p className="text-sm text-ink2/50 dark:text-paper/40">Walang gastos na naitala sa panahong ito.</p>
                    </div>
                )}

                {chartLoaded && filteredEntries.length > 0 && view === "category" && hasCategoryData && (
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                        <div className="relative h-48 w-48 shrink-0">
                            <canvas ref={chartRef}></canvas>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-mono uppercase tracking-wide text-ink2/50 dark:text-paper/40">Kabuuang Gastos</span>
                                <span className="font-mono text-base font-semibold text-ink dark:text-paper">₱{peso(analytics.totalExpense)}</span>
                            </div>
                        </div>

                        {/* Custom legend: category, share-of-total bar, and amount — replaces
                            Chart.js's built-in canvas-drawn legend so labels use the app's
                            own type and the proportions are legible at a glance. */}
                        <div className="w-full flex flex-col gap-2.5 min-w-0">
                            {sortedCategories.map((c, i) => (
                                <div key={c.label} className="legend-row flex items-center gap-2.5" style={{ animationDelay: `${i * 40}ms` }}>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
                                    <span className="text-xs text-ink2/70 dark:text-paper/60 flex-1 min-w-0 truncate">{c.label}</span>
                                    <div className="hidden sm:block w-16 h-1.5 rounded-full bg-paperDim dark:bg-ink2/50 overflow-hidden shrink-0">
                                        <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }}></div>
                                    </div>
                                    <span className="text-xs font-mono font-medium text-ink dark:text-paper w-16 text-right shrink-0">₱{peso(c.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {chartLoaded && filteredEntries.length > 0 && view === "flow" && (
                    <div className="h-64 w-full">
                        <canvas ref={chartRef}></canvas>
                    </div>
                )}
            </div>
        </div>
    );
}
