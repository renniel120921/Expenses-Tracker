// components/ExpenseForm.js

function AddEntryForm({ uid, onAdded }) {
    const { useState } = React;

    const [type, setType] = useState("expense");
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [method, setMethod] = useState(METHODS[0]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

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
        } catch (err) {
            setError("Hindi na-save. Subukan ulit.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-line shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold text-ink">Magdagdag ng Entry</h2>
                <div className="inline-flex bg-paperDim rounded-full p-1 text-xs font-semibold">
                    <button type="button" onClick={() => setType("expense")}
                        className={`px-3.5 py-1.5 rounded-full transition-colors ${type === "expense" ? "bg-ink text-paper" : "text-ink2"}`}>
                        Gastos
                    </button>
                    <button type="button" onClick={() => setType("income")}
                        className={`px-3.5 py-1.5 rounded-full transition-colors ${type === "income" ? "bg-peso text-paper" : "text-ink2"}`}>
                        Kita
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 flex items-start gap-2 bg-expense/10 text-expense text-sm rounded-xl px-3.5 py-2.5">
                    <Icons.AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span>
                </div>
            )}

            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text" value={desc} onChange={e => setDesc(e.target.value)}
                    placeholder={type === "income" ? "e.g., Allowance" : "e.g., Breadboard, Pamasahe sa CCSFP"}
                    className="flex-1 min-w-0 bg-paperDim/60 border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-peso/40"
                />
                <input
                    type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="₱0.00"
                    className="sm:w-28 bg-paperDim/60 border border-line rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-peso/40"
                />
                {type === "expense" && (
                    <select value={category} onChange={e => setCategory(e.target.value)}
                        className="sm:w-36 bg-paperDim/60 border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-peso/40">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
                <select value={method} onChange={e => setMethod(e.target.value)}
                    className="sm:w-28 bg-paperDim/60 border border-line rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-peso/40">
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <button type="submit" disabled={saving}
                    className={`font-semibold rounded-xl px-6 py-3 text-sm flex items-center justify-center gap-2 transition-colors shrink-0 text-paper disabled:opacity-60 ${type === "income" ? "bg-peso hover:bg-pesoLight" : "bg-ink hover:bg-pesoDeep"}`}>
                    {saving ? <Icons.Loader size={16} className="spin" /> : <Icons.Plus size={16} />}
                    {saving ? "Sinasave..." : "Idagdag"}
                </button>
            </form>
        </div>
    );
}
