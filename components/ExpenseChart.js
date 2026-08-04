// components/ExpenseChart.js

function ExpenseChart({ entries }) {
    const { useMemo } = React;
    const monthStart = useMemo(() => startOfMonth(), []);

    // Filter only expenses for the current month
    const thisMonth = useMemo(
        () => entries.filter(e => !e.createdAt || (e.createdAt.toDate() >= monthStart && e.type !== "income")),
        [entries, monthStart]
    );

    const spent = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);

    // Group by category
    const byCategory = useMemo(() => {
        const totals = {};
        thisMonth.forEach(e => {
            totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
        });
        return CATEGORIES
            .map(c => ({ label: c, amount: totals[c] || 0 }))
            .filter(c => c.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [thisMonth]);

    // Map categories to specific hex codes for SVG rendering
    const CHART_COLORS = {
        Pagkain: "#1F6F54",
        Pamasahe: "#33443A",
        Bills: "#C9932E",
        Load: "#123D2E",
        Ipon: "#2F8E6C",
        "Project Components": "#15231C",
        "Iba pa": "#B5483B",
    };

    if (spent === 0) return null; // Hide chart if there are no expenses yet

    let cumulativePercent = 0;

    return (
        <div className="bg-white rounded-2xl border border-line shadow-sm p-7">
            <p className="text-xs font-mono tracking-[0.2em] uppercase text-peso mb-6 text-center sm:text-left">
                Pagsusuri ng Gastos
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-evenly gap-8">
                {/* SVG Donut Chart */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                        {byCategory.map((c) => {
                            const percent = (c.amount / spent) * 100;
                            const offset = 100 - cumulativePercent;
                            cumulativePercent += percent;

                            return (
                                <circle
                                    key={c.label}
                                    cx="18" cy="18" r="15.91549430918954"
                                    fill="transparent"
                                    stroke={CHART_COLORS[c.label] || "#1F6F54"}
                                    strokeWidth="4.5"
                                    strokeDasharray={`${percent} ${100 - percent}`}
                                    strokeDashoffset={offset}
                                    className="transition-all duration-1000 ease-out"
                                />
                            );
                        })}
                    </svg>

                    {/* Center Text inside Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-ink2/70 uppercase tracking-widest font-semibold">Total</span>
                        <span className="text-lg font-bold text-ink font-mono">₱{peso(spent)}</span>
                    </div>
                </div>

                {/* Chart Legend */}
                <div className="space-y-3">
                    {byCategory.map(c => (
                        <div key={c.label} className="flex items-center gap-3 text-sm">
                            <span
                                className="w-3.5 h-3.5 rounded-full shadow-sm"
                                style={{ backgroundColor: CHART_COLORS[c.label] || "#1F6F54" }}
                            ></span>
                            <span className="font-medium text-ink w-28 truncate">{c.label}</span>
                            <span className="font-mono text-ink2 font-semibold">{(c.amount / spent * 100).toFixed(0)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
