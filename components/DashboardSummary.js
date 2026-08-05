// components/DashboardSummary.js

/* ---------- Local premium motion (scoped keyframes for this component) ---------- */
function DashboardSummaryStyles() {
    return (
        <style>{`
            @keyframes editorPop {
                from { opacity: 0; transform: scale(0.94) translateY(-2px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            .editor-pop { animation: editorPop 0.25s cubic-bezier(0.34, 1.4, 0.64, 1) both; }

            @keyframes rowIn {
                from { opacity: 0; transform: translateY(6px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .summary-row-in { animation: rowIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both; }

            @keyframes budgetGlow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(181, 72, 59, 0.18); }
                50%      { box-shadow: 0 0 0 6px rgba(181, 72, 59, 0); }
            }
            .budget-glow { animation: budgetGlow 2.2s ease-out infinite; }

            .summary-card { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease; }
            .summary-card:hover { transform: translateY(-2px); box-shadow: 0 12px 30px -12px rgba(21, 35, 28, 0.18); }

            @media (prefers-reduced-motion: reduce) {
                .editor-pop, .summary-row-in, .budget-glow, .summary-card {
                    animation: none !important;
                    transition: none !important;
                }
                .summary-card:hover { transform: none !important; }
            }
        `}</style>
    );
}

/* ---------- Small helper: count the peso figure up/down instead of snapping ---------- */
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

        const duration = 500;
        const start = performance.now();
        cancelAnimationFrame(rafRef.current);

        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeValue]);

    return <span className={className}>₱{peso(display)}</span>;
}

/* ---------- Editable monthly budget ---------- */
function BudgetEditor({ uid, budget }) {
    const { useState, useEffect } = React;
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(budget ?? "");
    const [saving, setSaving] = useState(false);

    useEffect(() => { setValue(budget ?? ""); }, [budget]);

    const save = async (e) => {
        e.preventDefault();
        const amt = parseFloat(value);
        if (!amt || amt <= 0) return;
        setSaving(true);
        try {
            await window.TipidData.setBudget(uid, amt);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-peso hover:underline transition-colors duration-200">
                <Icons.Pencil size={12} />
                {budget ? "Baguhin ang budget" : "Magtakda ng buwanang budget"}
            </button>
        );
    }
    return (
        <form onSubmit={save} className="editor-pop inline-flex items-center gap-2">
            <input
                type="number" inputMode="decimal" autoFocus value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="₱0.00"
                className="w-28 bg-paper dark:bg-ink2/50 border border-line dark:border-line/20 rounded-lg px-2.5 py-1.5 text-xs font-mono text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-peso/40 transition-shadow duration-200"
            />
            <button type="submit" disabled={saving} className="text-xs font-semibold text-peso disabled:opacity-50 active:scale-95 transition-transform duration-150">
                {saving ? "..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink2/50 dark:text-paper/40 hover:text-ink2/80 dark:hover:text-paper/70 transition-colors duration-200">Cancel</button>
        </form>
    );
}

/* ---------- Smart summary: income / expenses / remaining ---------- */
function SmartSummary({ uid, entries, budget }) {
    const { useMemo } = React;
    const monthStart = useMemo(() => startOfMonth(), []);

    const thisMonth = useMemo(
        () => entries.filter(e => {
            let entryTime = e.createdAt || e.timestamp;
            if (entryTime && typeof entryTime.toDate === "function") {
                entryTime = entryTime.toDate();
            } else if (typeof entryTime === "string" || typeof entryTime === "number") {
                entryTime = new Date(entryTime);
            }
            return !entryTime || entryTime >= monthStart;
        }),
        [entries, monthStart]
    );

    const income = thisMonth.filter(e => e.type === "income").reduce((s, e) => s + (e.amount || 0), 0);
    const spent = thisMonth.filter(e => e.type !== "income").reduce((s, e) => s + (e.amount || 0), 0);
    const remaining = budget != null ? budget - spent : income - spent;
    const remainingLabel = budget != null ? "Natitirang Budget" : "Natitira (Kita − Gastos)";
    const overBudget = budget != null && remaining < 0;

    const byCategory = useMemo(() => {
        const totals = {};
        thisMonth.filter(e => e.type !== "income").forEach(e => {
            totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
        });
        return CATEGORIES
            .map(c => ({ label: c, amount: totals[c] || 0 }))
            .filter(c => c.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [thisMonth]);

    return (
        <div className="space-y-6">
            <DashboardSummaryStyles />

            <div className="grid sm:grid-cols-3 gap-4">
                <div className="summary-card bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.5rem] border border-line/40 dark:border-line/10 shadow-sm p-6">
                    <p className="text-xs font-mono tracking-[0.15em] uppercase text-peso mb-2 flex items-center gap-1.5">
                        <Icons.TrendUp size={13} /> Kita ngayong buwan
                    </p>
                    <AnimatedAmount value={income} className="font-mono text-2xl font-semibold text-ink dark:text-paper" />
                </div>
                <div className="summary-card bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.5rem] border border-line/40 dark:border-line/10 shadow-sm p-6">
                    <p className="text-xs font-mono tracking-[0.15em] uppercase text-expense mb-2 flex items-center gap-1.5">
                        <Icons.TrendDown size={13} /> Gastos ngayong buwan
                    </p>
                    <AnimatedAmount value={spent} className="font-mono text-2xl font-semibold text-ink dark:text-paper" />
                </div>
                <div className={`summary-card rounded-[1.5rem] border shadow-sm p-6 backdrop-blur-xl ${overBudget ? "bg-expense/10 border-expense/30 budget-glow" : "bg-white/80 dark:bg-ink2/25 border-line/40 dark:border-line/10"}`}>
                    <p className={`text-xs font-mono tracking-[0.15em] uppercase mb-2 flex items-center gap-1.5 ${overBudget ? "text-expense" : "text-peso"}`}>
                        <Icons.Wallet size={13} /> {remainingLabel}
                    </p>
                    <AnimatedAmount value={remaining} className={`font-mono text-2xl font-semibold ${overBudget ? "text-expense" : "text-ink dark:text-paper"}`} />
                    <div className="mt-2">
                        <BudgetEditor uid={uid} budget={budget} />
                    </div>
                </div>
            </div>

            <div className="summary-card bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.5rem] border border-line/40 dark:border-line/10 shadow-sm p-7">
                <p className="text-xs font-mono tracking-[0.2em] uppercase text-peso mb-4">Breakdown ng Gastos</p>
                {byCategory.length === 0 ? (
                    <p className="text-sm text-ink2/60 dark:text-paper/50 italic">Wala pang gastos ngayong buwan.</p>
                ) : (
                    <div className="space-y-3.5">
                        {byCategory.map((c, i) => (
                            <div key={c.label} className="summary-row-in" style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-ink dark:text-paper">{c.label}</span>
                                    <span className="font-mono text-ink2 dark:text-paper/80">₱{peso(c.amount)}</span>
                                </div>
                                <div className="h-2 bg-paperDim dark:bg-ink2/50 rounded-full overflow-hidden">
                                    <div className={`bar-fill h-full rounded-full ${CATEGORY_COLOR[c.label] || "bg-peso"}`}
                                         style={{ width: spent ? `${(c.amount / spent) * 100}%` : "0%" }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
