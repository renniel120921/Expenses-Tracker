// components/ExpenseForm.js

function ExpenseFormStyles() {
    return (
        <style>{`
            @keyframes formBannerIn {
                from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .form-banner-in { animation: formBannerIn 0.35s cubic-bezier(0.34, 1.2, 0.4, 1) both; }

            @keyframes fieldPop {
                from { opacity: 0; transform: scale(0.92); }
                to   { opacity: 1; transform: scale(1); }
            }
            .field-pop { animation: fieldPop 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both; }

            @keyframes successPop {
                0%   { transform: scale(1); }
                40%  { transform: scale(1.15); }
                100% { transform: scale(1); }
            }
            .success-pop { animation: successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

            .segment-pill { transition: left 0.3s cubic-bezier(0.34, 1.3, 0.4, 1), width 0.3s cubic-bezier(0.34, 1.3, 0.4, 1); }

            @media (prefers-reduced-motion: reduce) {
                .form-banner-in, .field-pop, .success-pop, .segment-pill { animation: none !important; transition: none !important; }
            }
        `}</style>
    );
}

function AddEntryForm({ uid, onAdded }) {
    const { useState, useRef, useLayoutEffect, useCallback } = React;

    const [type, setType] = useState("expense");
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [method, setMethod] = useState(METHODS[0]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [justAdded, setJustAdded] = useState(false);

    // --- Sliding pill behind the active segment (Gastos / Kita) ---
    const segmentRefs = useRef({});
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

    const measurePill = useCallback(() => {
        const el = segmentRefs.current[type];
        if (el) setPillStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }, [type]);

    useLayoutEffect(() => {
        measurePill();
        window.addEventListener("resize", measurePill);
        return () => window.removeEventListener("resize", measurePill);
    }, [measurePill]);

    const submit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount);

        if (!desc.trim()) return setError("Ilagay kung ano ito.");
        if (!amt || amt <= 0) return setError("Ilagay ang halaga.");

        setError("");
        setSaving(true);

        try {
            if (type === "income") {
                await window.TipidData.addIncome(uid, { desc: desc.trim(), amount: amt, method });
            } else {
                await window.TipidData.addExpense(uid, { desc: desc.trim(), amount: amt, category, method });
            }

            // Reset form on success
            setDesc("");
            setAmount("");
            if (onAdded) onAdded();

            // Brief success flash on the submit button, purely cosmetic
            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 900);
        } catch (err) {
            setError("Hindi na-save. Subukan ulit.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white/80 dark:bg-ink2/20 backdrop-blur-xl rounded-[1.5rem] border border-line/40 dark:border-line/10 shadow-sm p-6 sm:p-7 mb-6 fade-up">
            <ExpenseFormStyles />

            <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold text-ink dark:text-paper">Magdagdag ng Entry</h2>
                <div className="relative inline-flex bg-paperDim dark:bg-ink2/50 rounded-full p-1 text-xs font-semibold">
                    <div
                        className="segment-pill absolute top-1 bottom-1 rounded-full bg-ink dark:bg-paper"
                        style={{
                            left: pillStyle.left,
                            width: pillStyle.width,
                            opacity: type === "income" ? 0 : 1,
                        }}
                    />
                    <div
                        className="segment-pill absolute top-1 bottom-1 rounded-full bg-peso"
                        style={{
                            left: pillStyle.left,
                            width: pillStyle.width,
                            opacity: type === "income" ? 1 : 0,
                        }}
                    />
                    <button
                        type="button"
                        ref={(el) => (segmentRefs.current.expense = el)}
                        onClick={() => setType("expense")}
                        className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 ${type === "expense" ? "text-paper dark:text-ink" : "text-ink2 dark:text-paper/60"}`}>
                        Gastos
                    </button>
                    <button
                        type="button"
                        ref={(el) => (segmentRefs.current.income = el)}
                        onClick={() => setType("income")}
                        className={`relative z-10 px-3.5 py-1.5 rounded-full transition-colors duration-200 ${type === "income" ? "text-paper" : "text-ink2 dark:text-paper/60"}`}>
                        Kita
                    </button>
                </div>
            </div>

            {error && (
                <div className="form-banner-in mb-4 flex items-start gap-2 bg-expense/10 text-expense text-sm rounded-xl px-3.5 py-2.5">
                    <Icons.AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span>
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text" value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder={type === "income" ? "e.g., Allowance" : "e.g., Breadboard, Pamasahe sa CCSFP"}
                    className="flex-1 min-w-0 bg-paperDim/60 dark:bg-ink2/40 border border-line dark:border-line/20 rounded-xl px-4 py-3 text-sm text-ink dark:text-paper placeholder:text-ink2/40 dark:placeholder:text-paper/40 focus:outline-none focus:ring-2 focus:ring-peso/40 transition-shadow duration-200"
                />
                <input
                    type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="₱0.00"
                    className="sm:w-28 bg-paperDim/60 dark:bg-ink2/40 border border-line dark:border-line/20 rounded-xl px-4 py-3 text-sm font-mono text-ink dark:text-paper placeholder:text-ink2/40 dark:placeholder:text-paper/40 focus:outline-none focus:ring-2 focus:ring-peso/40 transition-shadow duration-200"
                />
                {type === "expense" && (
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="field-pop sm:w-36 bg-paperDim/60 dark:bg-ink2/40 border border-line dark:border-line/20 rounded-xl px-4 py-3 text-sm text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-peso/40 transition-shadow duration-200">
                        {CATEGORIES.map(c => <option key={c} value={c} className="dark:bg-ink dark:text-paper">{c}</option>)}
                    </select>
                )}
                <select value={method} onChange={e => setMethod(e.target.value)}
                    className="sm:w-28 bg-paperDim/60 dark:bg-ink2/40 border border-line dark:border-line/20 rounded-xl px-4 py-3 text-sm text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-peso/40 transition-shadow duration-200">
                    {METHODS.map(m => <option key={m} value={m} className="dark:bg-ink dark:text-paper">{m}</option>)}
                </select>
                <button type="submit" disabled={saving}
                    className={`font-semibold rounded-xl px-6 py-3 text-sm flex items-center justify-center gap-2 transition-colors shrink-0 text-paper disabled:opacity-60 active:scale-95 duration-200 ${type === "income" ? "bg-peso hover:bg-pesoLight" : "bg-ink dark:bg-peso hover:bg-pesoDeep"}`}>
                    <span key={saving ? "saving" : justAdded ? "added" : "idle"} className={justAdded ? "success-pop inline-flex" : "inline-flex"}>
                        {saving ? <Icons.Loader size={16} className="spin" /> : justAdded ? <Icons.Plus size={16} /> : <Icons.Plus size={16} />}
                    </span>
                    {saving ? "Sinasave..." : justAdded ? "Nadagdag!" : "Idagdag"}
                </button>
            </form>
        </div>
    );
}
