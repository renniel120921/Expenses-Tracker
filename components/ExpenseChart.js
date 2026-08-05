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
                    datasets: [{ data: analytics.categories, backgroundColor: analytics.catColors, borderWidth: 0, hoverOffset: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter' } } } }, cutout: '75%' }
            };
        } else {
            config = {
                type: 'bar',
                data: {
                    labels: ['Income', 'Expense'],
                    datasets: [{
                        label: 'Amount', data: [analytics.totalIncome, analytics.totalExpense], backgroundColor: ['#2F8E6C', '#B5483B'], borderRadius: 6, barPercentage: 0.6
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E9EDE6' } }, x: { grid: { display: false } } } }
            };
        }

        chartInstance.current = new window.Chart(ctx, config);

        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [view, analytics, filteredEntries]);

    if (entries.length === 0) return null;

    return (
        <div className="bg-white/80 dark:bg-ink2/20 backdrop-blur-xl rounded-[1.5rem] border border-line/40 dark:border-line/10 shadow-sm p-6 sm:p-7 mb-6 fade-up">

            {/* Header with Date Filter */}
            <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-lg text-ink dark:text-paper tracking-tight">Analytics</h2>
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-xs font-medium text-ink2 dark:text-paper bg-paperDim dark:bg-ink2/50 px-2.5 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-peso cursor-pointer"
                >
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            {/* View Toggles */}
            <div className="flex items-center bg-paperDim dark:bg-ink2/40 p-1 rounded-xl mb-6">
                <button onClick={() => setView("category")} className={`flex-1 text-[11px] font-semibold uppercase py-2 rounded-lg transition-all ${view === "category" ? 'bg-white dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink2/80'}`}>Categories</button>
                <button onClick={() => setView("flow")} className={`flex-1 text-[11px] font-semibold uppercase py-2 rounded-lg transition-all ${view === "flow" ? 'bg-white dark:bg-ink text-ink dark:text-paper shadow-sm' : 'text-ink2/50 dark:text-paper/50 hover:text-ink2/80'}`}>Cash Flow</button>
            </div>

            {/* Chart Canvas */}
            <div className="relative h-64 w-full flex items-center justify-center">
                {!chartLoaded && <p className="text-xs text-expense font-medium text-center">Chart library failed to load. Please refresh the page.</p>}
                {filteredEntries.length === 0 && chartLoaded ? (
                    <p className="text-sm text-ink2/50">Walang data sa panahong ito.</p>
                ) : (
                    <canvas ref={chartRef} className={!chartLoaded ? "hidden" : ""}></canvas>
                )}
            </div>
        </div>
    );
}
