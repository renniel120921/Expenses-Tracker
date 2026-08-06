// components/ExpenseChart.js

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

        return { totalExpense, totalIncome, categories, catLabels, catColors };
    }, [filteredEntries]);

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
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter' }, boxWidth: 10, padding: 14 } } }, cutout: '75%' }
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

    return (
        <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/20 backdrop-blur-xl rounded-[1.75rem] border border-line/40 dark:border-line/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_16px_32px_-18px_rgba(21,35,28,0.22)] p-6 sm:p-8 mb-6 fade-up">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold to-peso" />

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
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-xs font-medium text-ink2 dark:text-paper bg-paperDim dark:bg-ink2/50 px-3 py-2 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-peso/40 cursor-pointer transition-shadow duration-200"
                >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            {/* Quick income/expense stat chips — useful at a glance, especially in Cash Flow view where the chart legend is hidden */}
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
            </div>

            {/* View Toggles */}
            <div className="flex items-center bg-paperDim dark:bg-ink2/40 p-1 rounded-2xl mb-6">
                <button onClick={() => setView("category")} className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase py-2.5 rounded-xl transition-all duration-200 ${view === "category" ? 'bg-white dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink2/80'}`}>
                    <Icons.Category size={12} /> Categories
                </button>
                <button onClick={() => setView("flow")} className={`flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase py-2.5 rounded-xl transition-all duration-200 ${view === "flow" ? 'bg-white dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink2/80'}`}>
                    <Icons.Chart size={12} /> Cash Flow
                </button>
            </div>

            {/* Chart Canvas */}
            <div className="relative h-64 w-full flex items-center justify-center">
                {!chartLoaded && (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Icons.AlertCircle size={18} className="text-expense" />
                        <p className="text-xs text-expense font-medium">Chart library failed to load. Please refresh the page.</p>
                    </div>
                )}
                {filteredEntries.length === 0 && chartLoaded ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Icons.Inbox size={20} className="text-ink2/30 dark:text-paper/25" />
                        <p className="text-sm text-ink2/50 dark:text-paper/40">Walang data sa panahong ito.</p>
                    </div>
                ) : (
                    <React.Fragment>
                        <canvas ref={chartRef} className={!chartLoaded ? "hidden" : ""}></canvas>
                        {view === "category" && chartLoaded && filteredEntries.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-[10px] font-mono uppercase tracking-wide text-ink2/50 dark:text-paper/40">Kabuuang Gastos</span>
                                <span className="font-mono text-lg font-semibold text-ink dark:text-paper">₱{peso(analytics.totalExpense)}</span>
                            </div>
                        )}
                    </React.Fragment>
                )}
            </div>
        </div>
    );
}
