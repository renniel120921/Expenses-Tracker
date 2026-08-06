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

            @media (prefers-reduced-motion: reduce) {
                .form-banner-in, .field-pop, .success-pop { animation: none !important; transition: none !important; }
            }
        `}</style>
    );
}

function FieldWrap({ icon, children, className = "" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-paperDim/60 dark:bg-ink2/40 border border-line dark:border-line/20 rounded-2xl px-3.5 focus-within:ring-2 focus-within:ring-peso/40 focus-within:border-peso/40 transition-all duration-200 ${className}`}>
            {icon}
            {children}
        </div>
    );
}

// Tinatanggap na natin ang "entries" para mabilang ang balanse
function AddEntryForm({ uid, onAdded, entries = [] }) {
    const { useState } = React;

    const [type, setType] = useState("expense");
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [method, setMethod] = useState(METHODS[0]);
    const [saving, setSaving] = useState(false);
    const [justAdded, setJustAdded] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount);

        // SweetAlert para sa empty inputs
        if (!desc.trim()) {
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Pakilagay kung ano ang binili o kinita mo.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }
        if (!amt || amt <= 0) {
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Pakilagay ang tamang halaga.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        // LOGIC: I-block kung mas malaki ang Gastos kaysa sa Kita
        if (type === "expense") {
            const totalIncome = entries.filter(e => e.type === "income").reduce((sum, curr) => sum + curr.amount, 0);
            const totalExpense = entries.filter(e => e.type === "expense").reduce((sum, curr) => sum + curr.amount, 0);
            const currentBalance = totalIncome - totalExpense;

            if (amt > currentBalance) {
                return Swal.fire({
                    icon: 'error',
                    title: 'Balanse ay Hindi Sapat',
                    text: `Hindi mo pwedeng ilagay ang gastos na ₱${window.peso(amt)} dahil ₱${window.peso(currentBalance)} na lamang ang natitira mong pera. Mag-log muna ng kita.`,
                    confirmButtonColor: '#B5483B',
                    customClass: { popup: 'tipid-swal' }
                });
            }
        }

        setSaving(true);

        try {
            if (type === "income") {
                await window.TipidData.addIncome(uid, { desc: desc.trim(), amount: amt, method });
            } else {
                await window.TipidData.addExpense(uid, { desc: desc.trim(), amount: amt, category, method });
            }

            setDesc("");
            setAmount("");
            if (onAdded) onAdded();

            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 900);

            // SweetAlert para sa Success Addition
            Swal.fire({
                icon: 'success',
                title: type === 'income' ? 'Kita Naitala! 🎉' : 'Gastos Naitala! 💸',
                text: `Matagumpay na naidagdag ang ₱${window.peso(amt)} bilang ${type === 'income' ? 'kita' : 'gastos'}.`,
                confirmButtonColor: '#1F6F54',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'tipid-swal' }
            });

        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Hindi nai-save ang data sa server. Subukan ulit.', confirmButtonColor: '#B5483B', customClass: { popup: 'tipid-swal' }});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/20 backdrop-blur-xl rounded-[1.75rem] border border-line/40 dark:border-line/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_16px_32px_-18px_rgba(21,35,28,0.22)] p-6 sm:p-8 mb-6 fade-up">
            <ExpenseFormStyles />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pesoDeep to-peso" />

            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0">
                        <Icons.Plus size={16} />
                    </span>
                    <div>
                        <h2 className="font-display text-xl font-semibold text-ink dark:text-paper leading-tight">Magdagdag ng Entry</h2>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/40">Itala ang bawat sentimo</p>
                    </div>
                </div>

                {/* Pure CSS Grid toggle switch */}
                <div className="relative grid grid-cols-2 bg-paperDim dark:bg-ink2/50 rounded-full p-1 text-xs font-semibold shadow-inner w-[144px]">
                    <div
                        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.4,1)] ${
                            type === "income" ? "translate-x-full bg-peso" : "translate-x-0 bg-ink dark:bg-paper"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setType("expense")}
                        className={`relative z-10 py-1.5 transition-colors duration-200 ${
                            type === "expense" ? "text-paper dark:text-ink" : "text-ink2 dark:text-paper/60 hover:text-ink dark:hover:text-paper"
                        }`}
                    >
                        Gastos
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("income")}
                        className={`relative z-10 py-1.5 transition-colors duration-200 ${
                            type === "income" ? "text-paper" : "text-ink2 dark:text-paper/60 hover:text-ink dark:hover:text-paper"
                        }`}
                    >
                        Kita
                    </button>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
                <FieldWrap className="flex-1 min-w-0" icon={<Icons.Pencil size={15} className="text-ink2/40 dark:text-paper/35 shrink-0" />}>
                    <input
                        type="text" value={desc} onChange={e => setDesc(e.target.value)}
                        placeholder={type === "income" ? "e.g., Allowance" : "e.g., Pamasahe sa Jeep"}
                        className="w-full min-w-0 bg-transparent py-3.5 text-sm text-ink dark:text-paper placeholder:text-ink2/40 dark:placeholder:text-paper/40 focus:outline-none"
                    />
                </FieldWrap>

                <FieldWrap className="sm:w-32" icon={<span className="text-ink2/40 dark:text-paper/35 font-mono text-sm shrink-0">₱</span>}>
                    <input
                        type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full min-w-0 bg-transparent py-3.5 text-sm font-mono text-ink dark:text-paper placeholder:text-ink2/40 dark:placeholder:text-paper/40 focus:outline-none"
                    />
                </FieldWrap>

                {type === "expense" && (
                    <FieldWrap className="field-pop sm:w-40" icon={<Icons.Category size={14} className="text-ink2/40 dark:text-paper/35 shrink-0" />}>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full min-w-0 bg-transparent py-3.5 text-sm text-ink dark:text-paper focus:outline-none">
                            {CATEGORIES.map(c => <option key={c} value={c} className="dark:bg-ink dark:text-paper">{c}</option>)}
                        </select>
                    </FieldWrap>
                )}

                <FieldWrap className="sm:w-32" icon={<Icons.Wallet size={14} className="text-ink2/40 dark:text-paper/35 shrink-0" />}>
                    <select value={method} onChange={e => setMethod(e.target.value)} className="w-full min-w-0 bg-transparent py-3.5 text-sm text-ink dark:text-paper focus:outline-none">
                        {METHODS.map(m => <option key={m} value={m} className="dark:bg-ink dark:text-paper">{m}</option>)}
                    </select>
                </FieldWrap>

                <button type="submit" disabled={saving}
                    className={`font-semibold rounded-2xl px-6 py-3.5 text-sm flex items-center justify-center gap-2 transition-all shrink-0 text-paper disabled:opacity-60 active:scale-95 duration-200 shadow-[0_10px_24px_-10px_rgba(18,61,46,0.5)] ${type === "income" ? "bg-peso hover:bg-pesoLight" : "bg-ink dark:bg-peso hover:bg-pesoDeep"}`}>
                    <span key={saving ? "saving" : justAdded ? "added" : "idle"} className={justAdded ? "success-pop inline-flex" : "inline-flex"}>
                        {saving ? <Icons.Loader size={16} className="spin" /> : justAdded ? <Icons.Plus size={16} /> : <Icons.Plus size={16} />}
                    </span>
                    {saving ? "Sinasave..." : justAdded ? "Nadagdag!" : "Idagdag"}
                </button>
            </form>
        </div>
    );
}
