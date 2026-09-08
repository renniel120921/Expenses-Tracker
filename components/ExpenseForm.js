// components/ExpenseForm.js
//
// ASSUMPTIONS:
//   - CATEGORIES, METHODS are globals defined elsewhere and loaded before this file
//   - Icons.{Plus, Pencil, Category, Wallet, Loader, Check, ShoppingBag} exist on a global Icons object
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

function FieldWrap({ icon, children, className = "", ringClass = "focus-within:ring-peso/40" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-white/80 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20 rounded-[14px] px-3.5 focus-within:ring-2 ${ringClass} focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 shadow-sm ${className}`}>
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

function WarningGlyph({ size = 12 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
    );
}

window.AddEntryForm = function AddEntryForm({ uid, onAdded, entries = [], baseBalances = {} }) {
    const { useState, useMemo, useEffect } = React;

    const [type, setType] = useState("expense");
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState(window.CATEGORIES[0]);

    const availableMethods = window.METHODS || ["Cash"];
    const [method, setMethod] = useState(availableMethods[0] || "Cash");

    const [spendType, setSpendType] = useState("need");

    const [saving, setSaving] = useState(false);
    const [justAdded, setJustAdded] = useState(false);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (!availableMethods.includes(method)) {
            setMethod(availableMethods[0] || "Cash");
        }
    }, [availableMethods, method]);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 400);
    };

    // Kalkulahin ang real-time balance ng bawat wallet
    const walletBalances = useMemo(() => {
        return window.TipidCore.walletBalances(entries, baseBalances);
    }, [entries, baseBalances]);

    const currentBalance = walletBalances[method] || 0;
    let parsedAmount = 0;
    try { parsedAmount = amount === "" ? 0 : window.TipidCore.money(amount); } catch (_) { parsedAmount = 0; }
    const isExpense = type === "expense";

    // Live validation
    const matitira = isExpense ? (currentBalance - parsedAmount) : (currentBalance + parsedAmount);
    const insufficient = isExpense && window.TipidCore.toCentavos(parsedAmount, { allowZero: true }) > window.TipidCore.toCentavos(Math.max(currentBalance, 0), { allowZero: true });

    const isIncome = type === "income";
    const accent = isIncome
        ? {
            ring: "focus-within:ring-peso/40",
            iconBg: "bg-gradient-to-br from-[#E6F3EF] to-[#D5EBE3] dark:from-[#1F6F54]/30 dark:to-[#1F6F54]/10 border-white/40 dark:border-white/5",
            iconFg: "text-[#1F6F54] dark:text-[#52C8A1]",
        }
        : {
            ring: "focus-within:ring-expense/40",
            iconBg: "bg-gradient-to-br from-[#FAEDE9] to-[#F5DBD5] dark:from-[#B5483B]/30 dark:to-[#B5483B]/10 border-white/40 dark:border-white/5",
            iconFg: "text-[#B5483B] dark:text-[#F38C80]",
        };

    const submit = async (e) => {
        e.preventDefault();

        if (!desc.trim()) {
            triggerShake();
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Pakilagay kung ano ang binili o kinita mo.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }
        if (!parsedAmount || parsedAmount <= 0) {
            triggerShake();
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Pakilagay ang tamang halaga.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        if (insufficient) {
            triggerShake();
            return Swal.fire({
                icon: 'error',
                title: 'Kulang ang Balanse',
                text: `Hindi mo pwedeng gamitin ang ${method} dahil ₱${window.peso(currentBalance)} na lamang ang laman nito.`,
                confirmButtonColor: '#B5483B',
                customClass: { popup: 'tipid-swal' }
            });
        }

        setSaving(true);

        try {
            if (isIncome) {
                await window.TipidData.addIncome(uid, { desc: desc.trim(), amount: parsedAmount, method });
            } else {
                await window.TipidData.addExpense(uid, { desc: desc.trim(), amount: parsedAmount, category, method, spendType });
            }

            setDesc("");
            setAmount("");
            if (onAdded) onAdded();

            setJustAdded(true);
            setTimeout(() => setJustAdded(false), 900);

            Swal.fire({
                icon: 'success',
                title: isIncome ? 'Kita Naitala! 🎉' : 'Gastos Naitala! 💸',
                text: `Matagumpay na naidagdag ang ₱${window.peso(parsedAmount)} bilang ${isIncome ? 'kita' : 'gastos'}.`,
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
        <div className={`relative overflow-hidden bg-white/70 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios p-5 sm:p-7 mb-6 fade-up ${shake ? "shake-once" : ""}`}>
            <ExpenseFormStyles />

            <div className="absolute top-0 left-0 right-0 h-1.5">
                <div className={`perf-edge absolute inset-0 bg-gradient-to-r from-peso/80 via-pesoLight/80 to-gold/80 transition-opacity duration-500 ${isIncome ? "opacity-100" : "opacity-0"}`} />
                <div className={`perf-edge absolute inset-0 bg-gradient-to-r from-expense/80 via-[#F38C80]/70 to-gold/60 transition-opacity duration-500 ${isIncome ? "opacity-0" : "opacity-100"}`} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 mt-1">
                <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border transition-colors duration-300 ${accent.iconBg} ${accent.iconFg}`}>
                        <window.Icons.Plus size={18} />
                    </span>
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">Bagong Entry</h3>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">Itala ang bawat sentimo</p>
                    </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2">
                    <div className="relative grid grid-cols-2 bg-black/5 dark:bg-white/5 rounded-full p-1 text-[13px] font-medium shadow-inner w-[160px]">
                        <div
                            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.4,1)] ${
                                isIncome
                                    ? "translate-x-full bg-white dark:bg-ink2"
                                    : "translate-x-0 bg-white dark:bg-ink2"
                            }`}
                        />
                        <button
                            type="button"
                            onClick={() => setType("expense")}
                            className={`relative z-10 py-1.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/50 ${
                                !isIncome ? "text-expense dark:text-[#F38C80] font-semibold" : "text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Gastos
                        </button>
                        <button
                            type="button"
                            onClick={() => setType("income")}
                            className={`relative z-10 py-1.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${
                                isIncome ? "text-peso dark:text-[#52C8A1] font-semibold" : "text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Kita
                        </button>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-mono font-medium text-ink2/50 dark:text-paper/40 px-1 bg-black/5 dark:bg-white/5 rounded-md py-0.5">
                        Balanse ng {method}: <span className="text-ink dark:text-paper font-bold">₱{window.peso(currentBalance)}</span>
                    </span>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3.5">

                <FieldWrap icon={<window.Icons.Pencil size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />} ringClass={accent.ring}>
                    <input
                        type="text" value={desc} onChange={e => setDesc(e.target.value)}
                        placeholder={isIncome ? "Hal: Allowance galing kay Mama" : "Hal: Kape, Grab, Shopee Checkout"}
                        className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-medium text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                    />
                </FieldWrap>

                {!isIncome && (
                    <div className="flex gap-2.5">
                        <button type="button" onClick={() => setSpendType("need")} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[13px] font-bold transition-all ring-1 shadow-sm ${spendType === "need" ? 'bg-[#E6F3EF] ring-[#2F8E6C]/30 text-[#1F6F54] dark:bg-[#1F6F54]/20 dark:text-[#52C8A1]' : 'bg-white/80 dark:bg-black/20 ring-black/5 text-ink2/50 dark:text-paper/40 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            <window.Icons.Check size={16} strokeWidth={3}/> Need <span className="hidden sm:inline">(Kailangan)</span>
                        </button>
                        <button type="button" onClick={() => setSpendType("luho")} className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[13px] font-bold transition-all ring-1 shadow-sm ${spendType === "luho" ? 'bg-[#FAEDE9] ring-[#B5483B]/30 text-[#B5483B] dark:bg-[#B5483B]/20 dark:text-[#F38C80]' : 'bg-white/80 dark:bg-black/20 ring-black/5 text-ink2/50 dark:text-paper/40 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                            {window.Icons.ShoppingBag ? <window.Icons.ShoppingBag size={16} strokeWidth={2.5}/> : <window.Icons.Category size={16} strokeWidth={2.5} />} Want <span className="hidden sm:inline">(Luho)</span>
                        </button>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 mt-1">
                    <div className="flex flex-col gap-1.5 sm:w-[150px] shrink-0">
                        <FieldWrap icon={<span className="text-ink2/40 dark:text-paper/40 font-mono text-[15px] shrink-0">₱</span>} ringClass={insufficient ? "ring-expense/50 bg-expense/5" : accent.ring} className={insufficient ? "ring-expense/50 bg-expense/5 dark:bg-expense/10" : ""}>
                            <input
                                type="number" step="0.01" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className={`w-full min-w-0 bg-transparent py-3.5 text-base font-mono font-bold placeholder:font-medium focus:outline-none ${insufficient ? 'text-expense dark:text-[#F38C80] placeholder:text-expense/50' : 'text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25'}`}
                            />
                        </FieldWrap>
                        {(amount !== "") && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 transition-colors duration-200 ${insufficient ? "text-expense dark:text-[#F38C80] font-semibold animate-pulse" : "text-ink2/40 dark:text-paper/30 font-medium"}`}>
                                {insufficient && <WarningGlyph size={11} />}
                                {insufficient
                                    ? `Kulang ng ₱${window.peso(parsedAmount - currentBalance)}`
                                    : `Matitira: ₱${window.peso(matitira)}`}
                            </span>
                        )}
                    </div>

                    {!isIncome && (
                        <FieldWrap className="field-pop relative w-full sm:flex-1 h-[52px]" icon={<window.Icons.Category size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />} ringClass={accent.ring}>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full min-w-0 bg-transparent h-full text-[14px] font-medium text-ink dark:text-paper focus:outline-none appearance-none pr-2 cursor-pointer">
                                {window.CATEGORIES.map(c => <option key={c} value={c} className="bg-paper dark:bg-ink dark:text-paper">{c}</option>)}
                            </select>
                            <SelectChevron />
                        </FieldWrap>
                    )}

                    <FieldWrap className="relative w-full sm:flex-1 h-[52px]" icon={<window.Icons.Wallet size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />} ringClass={accent.ring}>
                        <select value={method} onChange={e => setMethod(e.target.value)} className="w-full min-w-0 bg-transparent h-full text-[14px] font-medium text-ink dark:text-paper focus:outline-none appearance-none pr-2 cursor-pointer">
                            {availableMethods.map(m => {
                                const bal = walletBalances[m] || 0;
                                const cantAfford = isExpense && (parsedAmount > bal);
                                return (
                                    <option key={m} value={m} disabled={cantAfford} className={`bg-paper dark:bg-ink ${cantAfford ? 'text-expense dark:text-[#F38C80]' : 'text-ink dark:text-paper'}`}>
                                        {m} {cantAfford ? `(Kulang: ₱${window.peso(bal)} lang)` : ""}
                                    </option>
                                );
                            })}
                        </select>
                        <SelectChevron />
                    </FieldWrap>

                    <button type="submit" disabled={saving || insufficient}
                        className={`font-semibold rounded-[14px] px-6 h-[52px] flex items-center justify-center gap-2 transition-all shrink-0 text-white disabled:opacity-50 active:scale-95 duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isIncome
                                ? "bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/20 focus-visible:ring-peso/50"
                                : "bg-gradient-to-r from-[#15231C] to-[#2C3E33] dark:from-peso dark:to-pesoDeep hover:shadow-lg focus-visible:ring-ink/50"
                        }`}>
                        <span key={saving ? "saving" : justAdded ? "added" : "idle"} className={justAdded ? "success-pop inline-flex" : "inline-flex"}>
                            {saving ? <window.Icons.Loader size={18} className="spin" /> : justAdded ? <CheckGlyph size={18} /> : <window.Icons.Plus size={18} strokeWidth={2.5} />}
                        </span>
                        <span className="hidden sm:inline whitespace-nowrap">{saving ? "Sinasave..." : justAdded ? "Nadagdag!" : "Idagdag"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
