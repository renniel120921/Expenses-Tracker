// components/DashboardSummary.js
//
// ASSUMPTIONS:
//   - React is available globally
//   - CATEGORIES, CATEGORY_COLOR, startOfMonth(), and peso() formatter exist
//   - window.TipidData.setBudget is async and throws on failure
//   - Icons.{TrendUp, TrendDown, Wallet, Pencil, Loader} exist on a global Icons object
//   - `bar-fill` is a CSS class defined elsewhere for width transitions
//   - `SmartSummary` is referenced by its exact global name elsewhere

/* ---------- Local premium motion ---------- */
function DashboardSummaryStyles() {
    return (
        <style>{`
            @keyframes editorPop {
                from { opacity: 0; transform: scale(0.96) translateY(-4px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            .editor-pop { animation: editorPop 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both; }

            @keyframes rowIn {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .summary-row-in { animation: rowIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }

            @keyframes budgetGlow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(181, 72, 59, 0.2); }
                50%      { box-shadow: 0 0 0 8px rgba(181, 72, 59, 0); }
            }
            .budget-glow { animation: budgetGlow 2.5s ease-out infinite; }

            .summary-card {
                transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.3s ease;
            }
            .summary-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 20px 40px -12px rgba(21, 35, 28, 0.15);
            }
            html.dark .summary-card:hover {
                box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5);
            }

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

/* ---------- Animated Amount ---------- */
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
            const eased = 1 - Math.pow(1 - t, 4); // Quartic ease out for a more premium snap
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

/* ---------- Pastel Icon Chip ---------- */
// Decorative by default: every call site in this file sits directly beside a text label
// that already says what the card is (Kita Ngayon, Gastos Ngayon, etc.), so the glyph
// itself is hidden from assistive tech to avoid a redundant announcement.
function IconChip({ icon, tone }) {
    const tones = {
        peso: "bg-[#E6F3EF] text-[#1F6F54] dark:bg-[#1F6F54]/20 dark:text-[#52C8A1]",
        expense: "bg-[#FAEDE9] text-[#B5483B] dark:bg-[#B5483B]/20 dark:text-[#F38C80]",
        gold: "bg-[#FDF6E3] text-[#C9932E] dark:bg-[#C9932E]/20 dark:text-[#E8C071]",
    };
    return (
        <span aria-hidden="true" className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 ${tones[tone] || tones.peso}`}>
            {icon}
        </span>
    );
}

/* ---------- Inline Glyphs ---------- */
function TrendGlyph({ up, size = 10 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            {up ? <path d="M6 18L18 6M18 6H9M18 6v9" /> : <path d="M6 6l12 12M18 18H9M18 18V9" />}
        </svg>
    );
}
function CheckGlyph({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    );
}
function XGlyph({ size = 14 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    );
}

/* ---------- Delta Chip (MoM change) ---------- */
function DeltaChip({ pct, invert = false }) {
    if (pct === null) return null;
    const positive = pct >= 0;
    const isGood = invert ? !positive : positive;
    // The arrow direction carries real meaning here (di gaya ng ibang icon sa file na pure
    // decoration), kaya isinasama sa aria-label — hindi pwedeng umasa lang sa kulay/anyo ng icon.
    const directionWord = positive ? "pagtaas" : "pagbaba";
    return (
        <span
            title="kumpara sa nakaraang buwan"
            aria-label={`${Math.abs(pct)}% na ${directionWord} kumpara sa nakaraang buwan`}
            className={`inline-flex items-center gap-1 text-[10.5px] font-mono font-bold px-2 py-1 rounded-lg shrink-0 transition-colors ${
                isGood
                    ? "text-[#1F6F54] bg-[#E6F3EF] dark:text-[#52C8A1] dark:bg-[#1F6F54]/20"
                    : "text-[#B5483B] bg-[#FAEDE9] dark:text-[#F38C80] dark:bg-[#B5483B]/20"
            }`}
        >
            <TrendGlyph up={positive} />
            {Math.abs(pct)}%
        </span>
    );
}

/* ---------- Budget Editor ---------- */
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
                className="inline-flex items-center gap-2 text-[12px] font-semibold text-peso dark:text-pesoLight px-2.5 py-1.5 -ml-2.5 rounded-xl hover:bg-peso/10 dark:hover:bg-pesoLight/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
            >
                <Icons.Pencil size={13} />
                {budget ? "Baguhin ang budget" : "Magtakda ng buwanang budget"}
            </button>
        );
    }
    return (
        <form onSubmit={save} className="editor-pop inline-flex items-center gap-2">
            <label htmlFor="tipid-budget-input" className="sr-only">Bagong halaga ng buwanang budget</label>
            <input
                id="tipid-budget-input"
                type="number" inputMode="decimal" autoFocus value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="₱0.00"
                className="w-28 bg-white/60 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 rounded-xl px-3 py-1.5 text-[13px] font-mono font-semibold text-ink dark:text-paper focus:outline-none focus:bg-white dark:focus:bg-ink focus:ring-2 focus:ring-peso/40 transition-all duration-200"
            />
            <button
                type="submit" disabled={saving} title="Save"
                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-peso/15 text-peso dark:bg-pesoLight/20 dark:text-pesoLight disabled:opacity-50 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
            >
                {saving ? <Icons.Loader size={14} className="spin" /> : <CheckGlyph size={14} />}
            </button>
            <button
                type="button" onClick={() => setEditing(false)} title="Cancel"
                className="w-8 h-8 inline-flex items-center justify-center rounded-xl text-ink2/50 dark:text-paper/40 hover:bg-black/5 dark:hover:bg-white/10 hover:text-ink2/80 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
            >
                <XGlyph size={14} />
            </button>
        </form>
    );
}

/* ---------- Smart Summary ---------- */
function SmartSummary({ uid, entries, budget }) {
    const { useMemo } = React;
    const monthStart = useMemo(() => window.startOfMonth(), []);

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

    // Heads-up visual warning at 85%
    const nearingBudget = budget != null && !overBudget && budgetPct !== null && budgetPct >= 85;

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
        thisMonth.filter(e => e.type !== "expense").forEach(e => {
            totals[e.category] = (totals[e.category] || 0) + (e.amount || 0);
        });
        return window.CATEGORIES
            .map(c => ({ label: c, amount: totals[c] || 0 }))
            .filter(c => c.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [thisMonth]);

    return (
        <div className="space-y-6 sm:space-y-8">
            <DashboardSummaryStyles />

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">

                {/* Income Card */}
                <div className="relative overflow-hidden summary-row-in summary-card bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-6" style={{ animationDelay: "0ms" }}>
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2F8E6C] to-[#1F6F54]" />
                    <div className="flex items-start justify-between gap-2.5 mb-4 sm:mb-5">
                        <div className="flex items-center gap-3">
                            <IconChip tone="peso" icon={<Icons.TrendUp size={16} />} />
                            <p className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider uppercase text-ink2/50 dark:text-paper/50">Kita Ngayon</p>
                        </div>
                        <DeltaChip pct={incomeDelta} />
                    </div>
                    <AnimatedAmount value={income} className="font-mono text-[1.7rem] sm:text-3xl font-bold tracking-tight text-ink dark:text-paper" />
                </div>

                {/* Expense Card */}
                <div className="relative overflow-hidden summary-row-in summary-card bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-6" style={{ animationDelay: "60ms" }}>
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F38C80] to-[#B5483B]" />
                    <div className="flex items-start justify-between gap-2.5 mb-4 sm:mb-5">
                        <div className="flex items-center gap-3">
                            <IconChip tone="expense" icon={<Icons.TrendDown size={16} />} />
                            <p className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider uppercase text-ink2/50 dark:text-paper/50">Gastos Ngayon</p>
                        </div>
                        <DeltaChip pct={spentDelta} invert />
                    </div>
                    <AnimatedAmount value={spent} className="font-mono text-[1.7rem] sm:text-3xl font-bold tracking-tight text-ink dark:text-paper" />
                </div>

                {/* Remaining / Budget Card — gains a quiet gold ring once nearingBudget kicks in,
                    so the escalation reads normal → nearing → over instead of jumping straight
                    from calm to full alarm. */}
                <div className={`relative overflow-hidden summary-row-in summary-card rounded-[1.75rem] border shadow-ios p-5 sm:p-6 backdrop-blur-2xl ${
                    overBudget
                        ? "bg-expense/10 border-expense/30 budget-glow"
                        : nearingBudget
                            ? "bg-white/60 dark:bg-ink2/30 border-white/60 dark:border-white/10 ring-1 ring-gold/25 dark:ring-[#E8C071]/25"
                            : "bg-white/60 dark:bg-ink2/30 border-white/60 dark:border-white/10"
                }`} style={{ animationDelay: "120ms" }}>
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${overBudget ? "from-[#F38C80] to-[#B5483B]" : "from-[#E8C071] to-[#C9932E]"}`} />

                    <div className="flex items-start gap-3 mb-4 sm:mb-5">
                        <IconChip tone={overBudget ? "expense" : "gold"} icon={<Icons.Wallet size={16} />} />
                        <p className={`text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider uppercase pt-3 ${overBudget ? "text-[#B5483B] dark:text-[#F38C80]" : "text-ink2/50 dark:text-paper/50"}`}>
                            {remainingLabel}
                        </p>
                    </div>

                    <AnimatedAmount value={remaining} className={`font-mono text-[1.7rem] sm:text-3xl font-bold tracking-tight ${overBudget ? "text-expense dark:text-[#F38C80]" : "text-ink dark:text-paper"}`} />

                    {budgetPct != null && (
                        <div className="mt-4 sm:mt-5">
                            <div
                                role="progressbar"
                                aria-label="Porsyento ng buwanang budget na nagastos na"
                                aria-valuenow={budgetPct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className="h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden"
                            >
                                <div
                                    className={`bar-fill h-full rounded-full ${overBudget ? "bg-expense" : nearingBudget ? "bg-gold" : "bg-peso"}`}
                                    style={{ width: `${budgetPct}%` }}
                                />
                            </div>
                            <p role="status" aria-live="polite" className={`text-[11px] mt-2 font-mono font-medium ${overBudget ? "text-expense dark:text-[#F38C80]" : nearingBudget ? "text-[#C9932E] dark:text-[#E8C071]" : "text-ink2/60 dark:text-paper/50"}`}>
                                {budgetPct}% ng budget nagastos na{nearingBudget ? " — dahan dahan lang" : ""}
                            </p>
                        </div>
                    )}

                    <div className="mt-3.5">
                        <BudgetEditor uid={uid} budget={budget} />
                    </div>
                </div>
            </div>

            {/* Breakdown Section */}
            <div className="summary-card bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-6 sm:p-8">
                <div className="flex items-end justify-between gap-3 mb-5 sm:mb-6 flex-wrap">
                    <p className="text-[11px] sm:text-xs font-mono tracking-[0.2em] font-semibold uppercase text-peso dark:text-pesoLight">Breakdown ng Gastos</p>
                    {byCategory.length > 0 && (
                        <p className="text-[11px] sm:text-xs text-ink2/50 dark:text-paper/40 font-mono font-medium">
                            <span className="font-bold text-ink2/70 dark:text-paper/70">{byCategory.length}</span> kategorya · ₱{window.peso(spent)}
                        </p>
                    )}
                </div>

                {byCategory.length === 0 ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-3 text-ink2/40 dark:text-paper/30">
                        <Icons.Wallet size={24} className="opacity-50" aria-hidden="true" />
                        <p className="text-[13px] font-medium text-center">Wala pang gastos ngayong buwan.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {byCategory.map((c, i) => {
                            const pct = spent ? Math.round((c.amount / spent) * 100) : 0;
                            return (
                                <div key={c.label} className="summary-row-in bg-white/40 dark:bg-white/[0.03] p-4 rounded-2xl hover:bg-white/70 dark:hover:bg-white/[0.06] transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                                    <div className="flex justify-between items-center text-sm mb-3">
                                        <span className="font-semibold text-[13.5px] sm:text-[15px] text-ink dark:text-paper flex items-center gap-2">
                                            {c.label}
                                            {i === 0 && (
                                                <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-[#C9932E] dark:text-[#E8C071] bg-[#FDF6E3] dark:bg-[#C9932E]/15 rounded-full px-2 py-0.5">
                                                    Pinakamalaki
                                                </span>
                                            )}
                                        </span>
                                        <span className="font-mono font-bold text-ink dark:text-paper text-sm sm:text-base">
                                            ₱{window.peso(c.amount)} <span className="text-[11px] font-medium text-ink2/40 dark:text-paper/40 ml-1">{pct}%</span>
                                        </span>
                                    </div>
                                    {/* Decorative — the amount and % just above already say this in text */}
                                    <div aria-hidden="true" className="h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="bar-fill h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${pct}%`, backgroundColor: window.CATEGORY_COLOR[c.label] || "#1F6F54" }}
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
