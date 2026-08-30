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

// ringClass lets the parent theme the focus glow per active type (Gastos = terracotta, Kita = green)
// so the whole form visibly "agrees" with the segmented control, not just the submit button.
function FieldWrap({ icon, children, className = "", ringClass = "focus-within:ring-peso/40" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-white/60 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20 rounded-[14px] px-3.5 focus-within:ring-2 ${ringClass} focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 ${className}`}>
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

// Small inline warning glyph for the "kulang ang balanse" hint — no new Icons.* dependency needed.
function WarningGlyph({ size = 12 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
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

    // Single source of truth for "what color is this form right now" — reused by the header icon,
    // the ticket-edge, the card ring, and every field's focus glow so switching Gastos/Kita reads
    // as one cohesive shift instead of just the pill sliding.
    const isIncome = type === "income";
    const accent = isIncome
        ? {
            ring: "focus-within:ring-peso/40",
            iconBg: "bg-peso/10 dark:bg-pesoLight/15",
            iconFg: "text-peso dark:text-pesoLight",
            cardRing: "ring-peso/15 dark:ring-pesoLight/20",
        }
        : {
            ring: "focus-within:ring-expense/40",
            iconBg: "bg-expense/10 dark:bg-[#F38C80]/15",
            iconFg: "text-expense dark:text-[#F38C80]",
            cardRing: "ring-expense/15 dark:ring-[#F38C80]/20",
        };

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
        <div className={`relative overflow-hidden bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] ring-1 ${accent.cardRing} border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 mb-6 fade-up transition-[box-shadow,--tw-ring-color] duration-300 ${shake ? "shake-once" : ""}`}>
            <ExpenseFormStyles />

            {/* Modernized Perforated Edge — crossfades between Gastos/Kita colorways instead of snapping,
                since a gradient's stops can't be transitioned directly. */}
            <div className="absolute top-0 left-0 right-0 h-1.5">
                <div className={`perf-edge absolute inset-0 bg-gradient-to-r from-peso/80 via-pesoLight/80 to-gold/80 transition-opacity duration-500 ${isIncome ? "opacity-100" : "opacity-0"}`} />
                <div className={`perf-edge absolute inset-0 bg-gradient-to-r from-expense/80 via-[#F38C80]/70 to-gold/60 transition-opacity duration-500 ${isIncome ? "opacity-0" : "opacity-100"}`} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">

                {/* Header Context */}
                <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 transition-colors duration-300 ${accent.iconBg} ${accent.iconFg}`}>
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
                    <div role="group" aria-label="Uri ng entry" className="relative grid grid-cols-2 bg-black/5 dark:bg-white/5 rounded-full p-1 text-[13px] font-medium shadow-inner w-[160px]">
                        <div
                            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.2,0.4,1)] ${
                                isIncome
                                    ? "translate-x-full bg-white dark:bg-ink2"
                                    : "translate-x-0 bg-white dark:bg-ink2"
                            }`}
                        />
                        <button
                            type="button"
                            aria-pressed={type === "expense"}
                            onClick={() => setType("expense")}
                            className={`relative z-10 py-1.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/50 ${
                                type === "expense" ? "text-expense dark:text-[#F38C80] font-semibold" : "text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Gastos
                        </button>
                        <button
                            type="button"
                            aria-pressed={isIncome}
                            onClick={() => setType("income")}
                            className={`relative z-10 py-1.5 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 ${
                                isIncome ? "text-peso dark:text-[#52C8A1] font-semibold" : "text-ink2/50 dark:text-paper/50 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Kita
                        </button>
                    </div>

                    {/* Balance Hint */}
                    <span className="text-[10px] sm:text-[11px] font-mono text-ink2/50 dark:text-paper/40 px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/5">
                        Balanse: <span className="text-ink dark:text-paper font-semibold">₱{window.peso(currentBalance)}</span>
                    </span>
                </div>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3 sm:gap-3.5">

                {/* Description Input */}
                <FieldWrap ringClass={accent.ring} icon={<Icons.Pencil size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                    <label htmlFor="tipid-desc" className="sr-only">Paglalarawan ng entry</label>
                    <input
                        id="tipid-desc"
                        type="text" value={desc} onChange={e => setDesc(e.target.value)}
                        placeholder={isIncome ? "Hal: Allowance galing kay Mama" : "Hal: Pamasahe sa Jeep"}
                        className="w-full min-w-0 bg-transparent py-3.5 text-[15px] text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                    />
                </FieldWrap>

                {/* Amount, Category, Method, Button Row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5">

                    {/* Amount Input Area */}
                    <div className="flex flex-col gap-1.5 sm:w-[150px]">
                        <FieldWrap ringClass={accent.ring} icon={<span className="text-ink2/40 dark:text-paper/40 font-mono text-[15px] shrink-0">₱</span>}>
                            <label htmlFor="tipid-amount" className="sr-only">Halaga</label>
                            <input
                                id="tipid-amount"
                                type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full min-w-0 bg-transparent py-3.5 text-base font-mono font-bold text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25 placeholder:font-medium focus:outline-none"
                            />
                        </FieldWrap>
                        {type === "expense" && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 transition-colors duration-200 ${willExceedBalance ? "text-expense dark:text-[#F38C80] font-semibold" : "text-ink2/40 dark:text-paper/30"}`}>
                                {willExceedBalance && <WarningGlyph size={11} />}
                                {willExceedBalance
                                    ? `Kulang ng ₱${window.peso(parsedAmount - currentBalance)}`
                                    : `Matitira: ₱${window.peso(currentBalance - (isNaN(parsedAmount) ? 0 : parsedAmount))}`}
                            </span>
                        )}
                    </div>

                    {/* Category Select (Only for Gastos) */}
                    {type === "expense" && (
                        <FieldWrap ringClass={accent.ring} className="field-pop sm:w-[170px] relative" icon={<Icons.Category size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                            <label htmlFor="tipid-category" className="sr-only">Kategorya</label>
                            <select id="tipid-category" value={category} onChange={e => setCategory(e.target.value)} className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper focus:outline-none appearance-none pr-2">
                                {CATEGORIES.map(c => <option key={c} value={c} className="bg-paper dark:bg-ink dark:text-paper">{c}</option>)}
                            </select>
                            <SelectChevron />
                        </FieldWrap>
                    )}

                    {/* Method Select */}
                    <FieldWrap ringClass={accent.ring} className="sm:w-[130px] relative" icon={<Icons.Wallet size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                        <label htmlFor="tipid-method" className="sr-only">Paraan ng bayad</label>
                        <select id="tipid-method" value={method} onChange={e => setMethod(e.target.value)} className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper focus:outline-none appearance-none pr-2">
                            {METHODS.map(m => <option key={m} value={m} className="bg-paper dark:bg-ink dark:text-paper">{m}</option>)}
                        </select>
                        <SelectChevron />
                    </FieldWrap>

                    {/* Submit Button */}
                    <button type="submit" disabled={saving}
                        aria-label={saving ? "Sinasave" : (isIncome ? "Idagdag ang kita" : "Idagdag ang gastos")}
                        className={`font-semibold rounded-[14px] px-6 py-3.5 text-[14px] flex items-center justify-center gap-2 transition-all shrink-0 text-white disabled:opacity-60 active:scale-95 duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isIncome
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
