// components/DashboardSummary.js

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
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-peso hover:underline">
                <Icons.Pencil size={12} />
                {budget ? "Baguhin ang budget" : "Magtakda ng buwanang budget"}
            </button>
        );
    }
    return (
        <form onSubmit={save} className="inline-flex items-center gap-2">
            <input
                type="number" inputMode="decimal" autoFocus value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="₱0.00"
                className="w-28 bg-white border border-line rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-peso/40"
            />
            <button type="submit" disabled={saving} className="text-xs font-semibold text-peso disabled:opacity-50">
                {saving ? "..." : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-ink2/50">Cancel</button>
        </form>
    );
}

/* ---------- Smart summary: income / expenses / remaining ---------- */
function SmartSummary({ uid, entries, budget }) {
    const { useMemo } = React;
    const monthStart = useMemo(() => startOfMonth(), []);

    const thisMonth = useMemo(
        () => entries.filter(e => !e.createdAt || e.createdAt.toDate() >= monthStart),
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
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-line shadow-sm p-6">
                    <p className="text-xs font-mono tracking-[0.15em] uppercase text-peso mb-2 flex items-center gap-1.5">
                        <Icons.TrendUp size={13} /> Kita ngayong buwan
                    </p>
                    <p className="font-mono text-2xl font-semibold text-ink">₱{peso(income)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-line shadow-sm p-6">
                    <p className="text-xs font-mono tracking-[0.15em] uppercase text-expense mb-2 flex items-center gap-1.5">
                        <Icons.TrendDown size={13} /> Gastos ngayong buwan
                    </p>
                    <p className="font-mono text-2xl font-semibold text-ink">₱{peso(spent)}</p>
                </div>
                <div className={`rounded-2xl border shadow-sm p-6 ${overBudget ? "bg-expense/10 border-expense/30" : "bg-white border-line"}`}>
                    <p className={`text-xs font-mono tracking-[0.15em] uppercase mb-2 flex items-center gap-1.5 ${overBudget ? "text-expense" : "text-peso"}`}>
                        <Icons.Wallet size={13} /> {remainingLabel}
                    </p>
                    <p className={`font-mono text-2xl font-semibold ${overBudget ? "text-expense" : "text-ink"}`}>₱{peso(remaining)}</p>
                    <div className="mt-2">
                        <BudgetEditor uid={uid} budget={budget} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-line shadow-sm p-7">
                <p className="text-xs font-mono tracking-[0.2em] uppercase text-peso mb-4">Breakdown ng Gastos</p>
                {byCategory.length === 0 ? (
                    <p className="text-sm text-ink2/60 italic">Wala pang gastos ngayong buwan.</p>
                ) : (
                    <div className="space-y-3.5">
                        {byCategory.map(c => (
                            <div key={c.label}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-ink">{c.label}</span>
                                    <span className="font-mono text-ink2">₱{peso(c.amount)}</span>
                                </div>
                                <div className="h-2 bg-paperDim rounded-full overflow-hidden">
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
