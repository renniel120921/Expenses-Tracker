// components/DashboardSummary.js
//
// ASSUMPTIONS (unchanged from the original — carried forward, not re-verified here):
//   - React (not window-aliased hooks, unlike ExpenseChart.js) is available globally
//   - CATEGORIES, CATEGORY_COLOR, startOfMonth(), and a bare global peso() formatter exist
//   - window.TipidData.setBudget is async and throws on failure
//   - Icons.{TrendUp, TrendDown, Wallet, Pencil, Loader} exist on a global Icons object,
//     and a global `.spin` CSS class animates Icons.Loader (same pattern as ExpenseForm.js)
//   - `bar-fill` is a CSS class defined elsewhere (likely a width-transition helper) —
//     kept on every progress-fill div, including the new ones, for consistency
//   - `SmartSummary` is referenced by its exact global name elsewhere, so it's unchanged

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
            .summary-card:hover { transform: translateY(-3px); box-shadow: 0 16px 34px -14px rgba(21, 35, 28, 0.2); }

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

/* ---------- Small reusable icon chip used in each summary card header ---------- */
function IconChip({ icon, tone }) {
    const tones = {
        peso: "bg-peso/10 text-peso dark:bg-pesoLight/15 dark:text-pesoLight",
        expense: "bg-expense/10 text-expense dark:bg-expense/20 dark:text-expense",
        gold: "bg-gold/10 text-gold dark:bg-gold/20 dark:text-gold",
    };
    return (
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tones[tone] || tones.peso}`}>
            {icon}
        </span>
    );
}

/* ---------- Small inline glyphs (self-contained, don't assume the shared Icons
   set has these specific marks) ---------- */
function TrendGlyph({ up, size = 9 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            {up ? <path d="M6 18L18 6M18 6H9M18 6v9" /> : <path d="M6 6l12 12M18 18H9M18 18V9" />}
        </svg>
    );
}
function CheckGlyph({ size = 13 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    );
}
function XGlyph({ size = 13 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    );
}

// Month-over-month change chip. Renders nothing when there's no prior-month
// data to compare against, rather than showing a misleading ±∞%.
function DeltaChip({ pct, invert = false }) {
    if (pct === null) return null;
    const positive = pct >= 0;
    const isGood = invert ? !positive : positive;
    return (
        <span
            title="kumpara sa nakaraang buwan"
            className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                isGood ? "text-peso bg-peso/10 dark:text-pesoLight dark:bg-pesoLight/15" : "text-expense bg-expense/10"
            }`}
        >
            <TrendGlyph up={positive} />
            {Math.abs(pct)}%
        </span>
    );
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
            <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-peso dark:text-pesoLight px-2 py-1 -ml-2 rounded-lg hover:bg-peso/10 dark:hover:bg-pesoLight/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
            >
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
                className="w-28 bg-paper dark:bg-ink2/50 border border-line dark:border-line/20 rounded-xl px-2.5 py-1.5 text-xs font-mono text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-peso/40 transition-shadow duration-200"
            />
            <button
                type="submit" disabled={saving} title="Save"
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-peso/10 text-peso dark:bg-pesoLight/15 dark:text-pesoLight disabled:opacity-50 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
            >
                {saving ? <Icons.Loader size={13} className="spin" /> : <CheckGlyph size={13} />}
            </button>
            <button
                type="button" onClick={() => setEditing(false)} title="Cancel"
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-ink2/50 dark:text-paper/40 hover:bg-paperDim dark:hover:bg-ink2/50 hover:text-ink2/80 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
            >
                <XGlyph size={13} />
            </button>
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
    const budgetPct = budget ? Math.min(100, Math.round((spent / budget) * 100)) : null;
    // Extra warning tier below full overBudget — a heads-up at 85%+ spent,
    // purely visual, doesn't touch remaining/overBudget/budgetPct above.
    const nearingBudget = budget != null && !overBudget && budgetPct !== null && budgetPct >= 85;

    // Last month's totals, for the "vs last month" chips only — computed the
    // same way `thisMonth` is, just against the prior month's date range.
    const { incomeDelta, spentDelta } = useMemo(() => {
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const lastMonthEntries = entries.filter(e => {
            let entryTime = e.createdAt || e.timestamp;
            if (entryTime && typeof entryTime.toDate === "function") {
                entryTime = entryTime.toDate();
            } else if (typeof entryTime === "string" || typeof entryTime === "number") {
                entryTime = new Date(entryTime);
            }
            // Entries with no timestamp are treated as "this month" above, so
            // they're deliberately excluded here to avoid double-counting.
            if (!entryTime) return false;
            return entryTime >= lastMonthStart && entryTime <= lastMonthEnd;
        });

        const lastIncome = lastMonthEntries.filter(e => e.type === "income").reduce((s, e) => s + (e.amount || 0), 0);
        const lastSpent = lastMonthEntries.filter(e => e.type !== "income").reduce((s, e) => s + (e.amount || 0), 0);
        const pctDelta = (curr, prev) => (prev ? Math.round(((curr - prev) / prev) * 100) : null);

        return { incomeDelta: pctDelta(income, lastIncome), spentDelta: pctDelta(spent, lastSpent) };
    }, [entries, income, spent]);

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

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
                <div className="relative overflow-hidden summary-row-in summary-card bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.75rem] border border-line/40 dark:border-line/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] p-6 sm:p-7" style={{ animationDelay: "0ms" }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-peso to-pesoLight" />
                    <div className="flex items-center justify-between gap-2.5 mb-4">
                        <div className="flex items-center gap-2.5">
                            <IconChip tone="peso" icon={<Icons.TrendUp size={14} />} />
                            <p className="text-xs font-mono tracking-[0.15em] uppercase text-ink2/60 dark:text-paper/50">Kita ngayong buwan</p>
                        </div>
                        <DeltaChip pct={incomeDelta} />
                    </div>
                    <AnimatedAmount value={income} className="font-mono text-2xl sm:text-[1.7rem] font-semibold text-ink dark:text-paper" />
                </div>

                <div className="relative overflow-hidden summary-row-in summary-card bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.75rem] border border-line/40 dark:border-line/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] p-6 sm:p-7" style={{ animationDelay: "60ms" }}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-expense to-expense/60" />
                    <div className="flex items-center justify-between gap-2.5 mb-4">
                        <div className="flex items-center gap-2.5">
                            <IconChip tone="expense" icon={<Icons.TrendDown size={14} />} />
                            <p className="text-xs font-mono tracking-[0.15em] uppercase text-ink2/60 dark:text-paper/50">Gastos ngayong buwan</p>
                        </div>
                        <DeltaChip pct={spentDelta} invert />
                    </div>
                    <AnimatedAmount value={spent} className="font-mono text-2xl sm:text-[1.7rem] font-semibold text-ink dark:text-paper" />
                </div>

                <div className={`relative overflow-hidden summary-row-in summary-card rounded-[1.75rem] border shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] p-6 sm:p-7 backdrop-blur-xl ${overBudget ? "bg-expense/10 border-expense/30 budget-glow" : "bg-white/80 dark:bg-ink2/25 border-line/40 dark:border-line/10"}`} style={{ animationDelay: "120ms" }}>
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${overBudget ? "from-expense to-expense/60" : "from-gold to-peso"}`} />
                    <div className="flex items-center gap-2.5 mb-4">
                        <IconChip tone={overBudget ? "expense" : "gold"} icon={<Icons.Wallet size={14} />} />
                        <p className={`text-xs font-mono tracking-[0.15em] uppercase ${overBudget ? "text-expense" : "text-ink2/60 dark:text-paper/50"}`}>
                            {remainingLabel}
                        </p>
                    </div>
                    <AnimatedAmount value={remaining} className={`font-mono text-2xl sm:text-[1.7rem] font-semibold ${overBudget ? "text-expense" : "text-ink dark:text-paper"}`} />

                    {budgetPct != null && (
                        <div className="mt-4">
                            <div className="h-1.5 bg-paperDim dark:bg-ink2/50 rounded-full overflow-hidden">
                                <div
                                    className={`bar-fill h-full rounded-full ${overBudget ? "bg-expense" : nearingBudget ? "bg-gold" : "bg-peso"}`}
                                    style={{ width: `${budgetPct}%` }}
                                />
                            </div>
                            <p className={`text-[11px] mt-1.5 font-mono ${overBudget ? "text-expense" : nearingBudget ? "text-gold" : "text-ink2/50 dark:text-paper/40"}`}>
                                {budgetPct}% ng budget nagastos na{nearingBudget ? " — malapit na" : ""}
                            </p>
                        </div>
                    )}

                    <div className="mt-3.5">
                        <BudgetEditor uid={uid} budget={budget} />
                    </div>
                </div>
            </div>

            <div className="summary-card bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.75rem] border border-line/40 dark:border-line/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] p-6 sm:p-8">
                <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
                    <p className="text-xs font-mono tracking-[0.2em] uppercase text-peso dark:text-pesoLight">Breakdown ng Gastos</p>
                    {byCategory.length > 0 && (
                        <p className="text-[11px] text-ink2/45 dark:text-paper/35 font-mono">{byCategory.length} kategorya · ₱{peso(spent)}</p>
                    )}
                </div>
                {byCategory.length === 0 ? (
                    <p className="text-sm text-ink2/60 dark:text-paper/50 italic">Wala pang gastos ngayong buwan.</p>
                ) : (
                    <div className="space-y-4">
                        {byCategory.map((c, i) => {
                            const pct = spent ? Math.round((c.amount / spent) * 100) : 0;
                            return (
                                <div key={c.label} className="summary-row-in" style={{ animationDelay: `${i * 60}ms` }}>
                                    <div className="flex justify-between items-baseline text-sm mb-1.5">
                                        <span className="font-medium text-ink dark:text-paper flex items-center gap-2">
                                            {c.label}
                                            {i === 0 && (
                                                <span className="text-[9px] font-mono font-semibold tracking-wide uppercase text-gold bg-gold/10 rounded-full px-1.5 py-0.5">
                                                    Pinakamalaki
                                                </span>
                                            )}
                                        </span>
                                        <span className="font-mono text-ink2 dark:text-paper/80">
                                            ₱{peso(c.amount)} <span className="text-ink2/40 dark:text-paper/35">· {pct}%</span>
                                        </span>
                                    </div>
                                    <div className="h-2 bg-paperDim dark:bg-ink2/50 rounded-full overflow-hidden">
                                        <div
                                            className="bar-fill h-full rounded-full"
                                            style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLOR[c.label] || "#1F6F54" }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
