// components/ExpenseForm.js
//
// ASSUMPTIONS:
//   - CATEGORIES, METHODS are globals defined elsewhere and loaded before this file
//   - Icons.{Plus, Pencil, Category, Wallet, Loader} exist on a global Icons object
//   - window.peso(n) formats a number as a peso-formatted string (no ₱ sign)
//   - window.TipidData.addIncome / addExpense are async and throw on failure
//   - Swal (SweetAlert2) and a `.spin` CSS class are available globally
//   - `AddEntryForm` is referenced by its exact global name elsewhere.

function ExpenseFormStyles() {
    return (
        <style>{`
            @keyframes formBannerIn {
                from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .form-banner-in { animation: formBannerIn 0.35s cubic-bezier(0.34, 1.2, 0.4, 1) both; }

            @keyframes fieldPop {
                from { opacity: 0; transform: scale(0.96); }
                to   { opacity: 1; transform: scale(1); }
            }
            .field-pop { animation: fieldPop 0.3s cubic-bezier(0.34, 1.4, 0.64, 1) both; }

            @keyframes successPop {
                0%   { transform: scale(1); }
                40%  { transform: scale(1.15); }
                100% { transform: scale(1); }
            }
            .success-pop { animation: successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

            /* Quiet shake on validation failure */
            @keyframes fieldShake {
                0%, 100% { transform: translateX(0); }
                20%      { transform: translateX(-4px); }
                40%      { transform: translateX(4px); }
                60%      { transform: translateX(-3px); }
                80%      { transform: translateX(3px); }
            }
            .shake-once { animation: fieldShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

            /* Signature perforated "ticket tear" edge, modernized for the glass theme */
            .perf-edge {
                -webkit-mask-image: radial-gradient(circle at 7px 3px, transparent 3px, black 3.5px);
                mask-image: radial-gradient(circle at 7px 3px, transparent 3px, black 3.5px);
                -webkit-mask-size: 14px 6px;
                mask-size: 14px 6px;
                -webkit-mask-repeat: repeat-x;
                mask-repeat: repeat-x;
            }

            @media (prefers-reduced-motion: reduce) {
                .form-banner-in, .field-pop, .success-pop, .shake-once { animation: none !important; transition: none !important; }
            }
        `}</style>
    );
}

function FieldWrap({ icon, children, className = "" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-white/60 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 ${className}`}>
            {icon}
            {children}
        </div>
    );
}

function CheckGlyph({ size = 16 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    );
}

function SelectChevron() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink2/30 dark:text-paper/30 shrink-0 pointer-events-none">
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

function AddEntryForm({ uid, onAdded, entries = [] }) {
    const { useState, useMemo } = React;

    const [type, setType] = useState("expense");
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [method, setMethod] = useState(METHODS[0]);
    const [saving, setSaving] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const [shake, setShake] = useState(false);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 400);
    };

    const currentBalance = useMemo(() => {
        const totalIncome = entries.filter(e => e.type === "income").reduce((sum, curr) => sum + curr.amount, 0);
        const totalExpense = entries.filter(e => e.type === "expense").reduce((sum, curr) => sum + curr.amount, 0);
        return totalIncome - totalExpense;
    }, [entries]);

    const parsedAmount = parseFloat(amount);
    const willExceedBalance = type === "expense" && !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount > currentBalance;

    const submit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount);

        if (!desc.trim()) {
            triggerShake();
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Pakilagay kung ano ang binili o kinita mo.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }
        if (!amt || amt <= 0) {
            triggerShake();
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Pakilagay ang tamang halaga.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        if (type === "expense" && amt > currentBalance) {
            triggerShake();
            return Swal.fire({
                icon: 'error',
                title: 'Balanse ay Hindi Sapat',
                html: `Hindi mo pwedeng ilagay ang gastos na <b>₱${window.peso(amt)}</b> dahil <b>₱${window.peso(currentBalance)}</b> na lamang ang natitira mong pera.<br><br>Mag-log muna ng kita.`,
                confirmButtonColor: '#B5483B',
                customClass: { popup: 'tipid-swal' }
            });
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
            triggerShake();
            Swal.fire({ icon: 'error', title: 'Error', text: 'Hindi nai-save ang data sa server. Subukan ulit.', confirmButtonColor: '#B5483B', customClass: { popup: 'tipid-swal' }});
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`relative overflow-hidden bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 mb-6 fade-up ${shake ? "shake-once" : ""}`}>
            <ExpenseFormStyles />

            {/* Modernized Perforated Edge */}
            <div className="perf-edge absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-peso/80 via-pesoLight/80 to-gold/80" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">

                {/* Header Context */}
                <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-[14px] bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0">
                        <Icons.Plus size={18} />
                    </span>
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">Bagong Entry</h3>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">Itala ang bawat sentimo</p>
                    </div>
                </div>

                {/* Controls & Context */}
                <div className="flex flex-col items-start sm:items-end gap-2">
                    {/* Premium Segmented Control */}
                    <div className="relative grid grid-cols-2 bg-black/5 dark:bg-white/5 rounded-full p-1 text-[13px] font-medium shadow-inner w-[160px]">
                        <div
                            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.4,1)] ${
                                type === "income"
                                    ? "translate-x-full bg-white dark:bg-ink2"
                                    : "translate-x-0 bg-white dark:bg-ink2"
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={`relative z-10 py-1.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/50 ${
                                type === "expense" ? "text-expense dark:text-[#F38C80] font-semibold" : "text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Gastos
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("income")}
                            className={`relative z-10 py-1.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${
                                type === "income" ? "text-peso dark:text-[#52C8A1] font-semibold" : "text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Kita
                        </button>
                    </div>

                    {/* Balance Hint */}
                    <span className="text-[10px] sm:text-[11px] font-mono text-ink2/50 dark:text-paper/40 px-1">
                        Balanse: <span className="text-ink dark:text-paper font-semibold">₱{window.peso(currentBalance)}</span>
                    </span>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3 sm:gap-3.5">

                {/* Description Input */}
                <FieldWrap icon={<Icons.Pencil size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                    <input
                        type="text" value={desc} onChange={e => setDesc(e.target.value)}
                        placeholder={type === "income" ? "Hal: Allowance galing kay Mama" : "Hal: Pamasahe sa Jeep"}
                        className="w-full min-w-0 bg-transparent py-3.5 text-[15px] text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                    />
                </FieldWrap>

                {/* Amount, Category, Method, Button Row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5">

                    {/* Amount Input Area */}
                    <div className="flex flex-col gap-1.5 sm:w-[150px]">
                        <FieldWrap icon={<span className="text-ink2/40 dark:text-paper/40 font-mono text-[15px] shrink-0">₱</span>}>
                            <input
                                type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full min-w-0 bg-transparent py-3.5 text-base font-mono font-bold text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25 placeholder:font-medium focus:outline-none"
                            />
                        </FieldWrap>
                        {type === "expense" && (
                            <span className={`text-[10px] font-mono px-1.5 transition-colors duration-200 ${willExceedBalance ? "text-expense dark:text-[#F38C80] font-semibold" : "text-ink2/40 dark:text-paper/30"}`}>
                                {willExceedBalance
                                    ? `Kulang ng ₱${window.peso(parsedAmount - currentBalance)}`
                                    : `Matitira: ₱${window.peso(currentBalance - (isNaN(parsedAmount) ? 0 : parsedAmount))}`}
                            </span>
                        )}
                    </div>

                    {/* Category Select (Only for Gastos) */}
                    {type === "expense" && (
                        <FieldWrap className="field-pop sm:w-[170px] relative" icon={<Icons.Category size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper focus:outline-none appearance-none pr-2">
                                {CATEGORIES.map(c => <option key={c} value={c} className="bg-paper dark:bg-ink dark:text-paper">{c}</option>)}
                            </select>
                            <SelectChevron />
                        </FieldWrap>
                    )}

                    {/* Method Select */}
                    <FieldWrap className="sm:w-[130px] relative" icon={<Icons.Wallet size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                        <select value={method} onChange={e => setMethod(e.target.value)} className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper focus:outline-none appearance-none pr-2">
                            {METHODS.map(m => <option key={m} value={m} className="bg-paper dark:bg-ink dark:text-paper">{m}</option>)}
                        </select>
                        <SelectChevron />
                    </FieldWrap>

                    {/* Submit Button */}
                    <button type="submit" disabled={saving}
                        className={`font-semibold rounded-[14px] px-6 py-3.5 text-[14px] flex items-center justify-center gap-2 transition-all shrink-0 text-white disabled:opacity-60 active:scale-95 duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            type === "income"
                                ? "bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/20 focus-visible:ring-peso/50"
                                : "bg-gradient-to-r from-[#2C3E33] to-ink dark:from-peso dark:to-pesoDeep hover:shadow-lg focus-visible:ring-ink/50"
                        }`}>
                        <span key={saving ? "saving" : justAdded ? "added" : "idle"} className={justAdded ? "success-pop inline-flex" : "inline-flex"}>
                            {saving ? <Icons.Loader size={18} className="spin" /> : justAdded ? <CheckGlyph size={18} /> : <Icons.Plus size={18} />}
                        </span>
                        <span className="hidden sm:inline">{saving ? "Sinasave..." : justAdded ? "Nadagdag!" : "Idagdag"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
