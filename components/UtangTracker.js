// components/UtangTracker.js

// FIX: FieldWrap moved OUTSIDE of UtangTracker so it's not redefined on every
// render. When a component function is declared inside another component's
// body, React sees a *new* component type on every re-render (even if the
// code looks identical), so it unmounts and remounts the DOM nodes inside it
// — including the <input>. That's what was stealing focus / closing the
// keyboard after every keystroke, since Firestore's subscribeUtang() updates
// trigger a re-render of UtangTracker while you type.
function FieldWrap({ icon, children, className = "" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-white/60 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 ${className}`}>
            {icon}
            {children}
        </div>
    );
}

window.UtangTracker = function UtangTracker({ uid, utangList = [], loading }) {
    const { useState, useMemo, useRef } = React;

    // ---- form state ----
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [direction, setDirection] = useState("owed_to_me"); // owed_to_me | i_owe
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ---- filter tabs ----
    const [filter, setFilter] = useState("all"); // all | owed_to_me | i_owe | settled

    // Ref to lock focus and prevent typing disruption during real-time syncs
    const inputRef = useRef(null);

    const handleAdd = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!name.trim() || !amt || amt <= 0 || !uid || !window.TipidData) return;

        try {
            setSubmitting(true);
            await window.TipidData.addUtang(uid, {
                name: name.trim(),
                amount: amt,
                direction,
                dueDate: dueDate || null,
                notes: notes.trim(),
            });
            setName("");
            setAmount("");
            setDueDate("");
            setNotes("");
            Swal.fire({
                icon: "success",
                title: "Na-log na ang utang",
                timer: 1400,
                showConfirmButton: false,
                customClass: { popup: "tipid-swal" }
            });
        } catch (err) {
            console.error("Failed to add utang:", err);
            Swal.fire({
                icon: "error",
                title: "Hindi na-save",
                text: "Subukan ulit mamaya.",
                confirmButtonColor: "#1F6F54",
                customClass: { popup: "tipid-swal" }
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettle = async (item) => {
        if (!uid || !window.TipidData) return;
        const result = await Swal.fire({
            icon: "question",
            title: item.direction === "i_owe" ? "Bayad na ba?" : "Nabayaran ka na ba?",
            text: `₱${window.peso(item.amount)} — ${item.name}`,
            showCancelButton: true,
            confirmButtonText: "Oo, tapos na",
            cancelButtonText: "Hindi pa",
            confirmButtonColor: "#1F6F54",
            cancelButtonColor: "#B5483B",
            customClass: { popup: "tipid-swal" }
        });
        if (!result.isConfirmed) return;
        try {
            await window.TipidData.settleUtang(uid, item.id);
        } catch (err) {
            console.error("Failed to settle utang:", err);
        }
    };

    const handleReopen = async (item) => {
        if (!uid || !window.TipidData) return;
        try {
            await window.TipidData.reopenUtang(uid, item.id);
        } catch (err) {
            console.error("Failed to reopen utang:", err);
        }
    };

    const handleDelete = async (item) => {
        if (!uid || !window.TipidData) return;
        const result = await Swal.fire({
            icon: "warning",
            title: "Alisin ang record na ito?",
            text: `${item.name} — ₱${window.peso(item.amount)}`,
            showCancelButton: true,
            confirmButtonText: "Alisin",
            cancelButtonText: "Kanselahin",
            confirmButtonColor: "#B5483B",
            cancelButtonColor: "#33443A",
            customClass: { popup: "tipid-swal" }
        });
        if (!result.isConfirmed) return;
        try {
            await window.TipidData.deleteUtang(uid, item.id);
        } catch (err) {
            console.error("Failed to delete utang:", err);
        }
    };

    // ---- derived totals (unpaid only) ----
    const totals = useMemo(() => {
        const unpaid = utangList.filter(u => u.status !== "Paid");
        const owedToMe = window.TipidCore.sumMoney(unpaid.filter(u => u.direction !== "i_owe").map(u => u.amount));
        const iOwe = window.TipidCore.sumMoney(unpaid.filter(u => u.direction === "i_owe").map(u => u.amount));
        return { owedToMe, iOwe, net: owedToMe - iOwe };
    }, [utangList]);

    const todayStr = window.TipidCore.manilaDateKey();

    const filteredList = useMemo(() => {
        let list = utangList;
        if (filter === "owed_to_me") list = list.filter(u => u.direction !== "i_owe" && u.status !== "Paid");
        else if (filter === "i_owe") list = list.filter(u => u.direction === "i_owe" && u.status !== "Paid");
        else if (filter === "settled") list = list.filter(u => u.status === "Paid");
        else list = list.filter(u => u.status !== "Paid");
        return list;
    }, [utangList, filter]);

    const FILTERS = [
        { id: "all", label: "Lahat" },
        { id: "owed_to_me", label: "Sa Akin" },
        { id: "i_owe", label: "Inutang Ko" },
        { id: "settled", label: "Bayad Na" },
    ];

    return (
        <div className="space-y-6 sm:space-y-8">

            {/* Summary card */}
            <div className="relative bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-peso to-pesoLight rounded-t-[1.75rem]" />

                <div className="flex items-center gap-3 mb-6 mt-1">
                    <div className="w-10 h-10 rounded-[14px] bg-[#E6F3EF] dark:bg-[#1F6F54]/20 flex items-center justify-center text-[#1F6F54] dark:text-[#52C8A1] shrink-0">
                        <window.Icons.Wallet size={19} strokeWidth={2.3} />
                    </div>
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">Buod ng Utang</h3>
                        <span className="text-[11px] font-mono text-ink2/50 dark:text-paper/40">{loading ? "Loading..." : `${utangList.filter(u => u.status !== "Paid").length} pending`}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-[#E6F3EF] to-[#D5EBE3] dark:from-[#1F6F54]/20 dark:to-[#1F6F54]/10 p-5 rounded-2xl border border-[#1F6F54]/10 dark:border-[#52C8A1]/20">
                        <p className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#1F6F54] dark:text-[#52C8A1] mb-1.5">Pinagkakautangan sa Akin</p>
                        <p className="font-mono text-2xl font-bold tracking-tight text-[#1F6F54] dark:text-[#52C8A1]">₱{window.peso(totals.owedToMe)}</p>
                    </div>
                    <div className="bg-[#FAEDE9] dark:bg-[#B5483B]/15 p-5 rounded-2xl border border-[#B5483B]/10 dark:border-[#F38C80]/20">
                        <p className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#B5483B] dark:text-[#F38C80] mb-1.5">Inutang Ko</p>
                        <p className="font-mono text-2xl font-bold tracking-tight text-[#B5483B] dark:text-[#F38C80]">₱{window.peso(totals.iOwe)}</p>
                    </div>
                    <div className="bg-white/60 dark:bg-black/20 p-5 rounded-2xl border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-mono uppercase font-semibold tracking-wider text-ink2/60 dark:text-paper/50 mb-1.5">Net</p>
                        <p className={`font-mono text-2xl font-bold tracking-tight ${totals.net < 0 ? 'text-[#B5483B] dark:text-[#F38C80]' : 'text-ink dark:text-paper'}`}>
                            {totals.net < 0 ? '-' : ''}₱{window.peso(Math.abs(totals.net))}
                        </p>
                    </div>
                </div>
            </div>

            {/* Add + list card */}
            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7">
                <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper mb-5">Mag-log ng Utang</h3>

                <form onSubmit={handleAdd} className="flex flex-col gap-3.5 mb-7">
                    {/* Direction toggle */}
                    <div className="flex gap-2 p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-[14px]">
                        <button
                            type="button"
                            onClick={() => setDirection("owed_to_me")}
                            className={`flex-1 text-[12.5px] font-semibold px-3 py-2.5 rounded-[10px] transition-all duration-200 ${
                                direction === "owed_to_me"
                                    ? "bg-white dark:bg-ink2 text-[#1F6F54] dark:text-[#52C8A1] shadow-sm"
                                    : "text-ink2/50 dark:text-paper/40"
                            }`}
                        >
                            May Utang sa Akin
                        </button>
                        <button
                            type="button"
                            onClick={() => setDirection("i_owe")}
                            className={`flex-1 text-[12.5px] font-semibold px-3 py-2.5 rounded-[10px] transition-all duration-200 ${
                                direction === "i_owe"
                                    ? "bg-white dark:bg-ink2 text-[#B5483B] dark:text-[#F38C80] shadow-sm"
                                    : "text-ink2/50 dark:text-paper/40"
                            }`}
                        >
                            May Inutang Ako
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3.5">
                        <FieldWrap className="sm:flex-1" icon={<span className="text-ink2/40 dark:text-paper/40 shrink-0"><window.Icons.Pencil size={15} strokeWidth={2.3} /></span>}>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Pangalan"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                            />
                        </FieldWrap>
                        <FieldWrap className="sm:flex-1" icon={<span className="text-ink2/40 dark:text-paper/40 font-mono text-[14px] shrink-0">₱</span>}>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Halaga"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] font-mono font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                            />
                        </FieldWrap>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3.5">
                        <FieldWrap className="sm:flex-1" icon={<span className="text-ink2/40 dark:text-paper/40 shrink-0"><window.Icons.Calendar size={15} strokeWidth={2.3} /></span>}>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] font-mono text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none appearance-none"
                            />
                        </FieldWrap>
                        <FieldWrap className="sm:flex-1" icon={<span className="text-ink2/40 dark:text-paper/40 shrink-0"><window.Icons.Category size={15} strokeWidth={2.3} /></span>}>
                            <input
                                type="text"
                                placeholder="Note (opsyonal)"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                            />
                        </FieldWrap>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !name.trim() || !amount}
                        className="bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/20 active:scale-[0.98] disabled:opacity-60 disabled:hover:shadow-none text-white text-[14px] font-semibold rounded-[14px] px-6 py-3.5 transition-all duration-200 w-full flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
                    >
                        {submitting ? (
                            <window.Icons.Loader size={16} className="spin" />
                        ) : (
                            <>
                                <window.Icons.Plus size={16} strokeWidth={2.5} />
                                I-log ang Utang
                            </>
                        )}
                    </button>
                </form>

                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-full border transition-all duration-150 ${
                                filter === f.id
                                    ? "bg-ink dark:bg-paper text-paper dark:text-ink border-transparent"
                                    : "bg-black/[0.02] dark:bg-white/[0.04] border-black/5 dark:border-white/5 text-ink2/60 dark:text-paper/50 hover:bg-black/5 dark:hover:bg-white/[0.08]"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-2.5 animate-pulse">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="h-[64px] rounded-2xl bg-black/5 dark:bg-white/5" />
                        ))}
                    </div>
                ) : filteredList.length > 0 ? (
                    <ul className="space-y-2.5">
                        {filteredList.map(item => {
                            const isOwedToMe = item.direction !== "i_owe";
                            const isPaid = item.status === "Paid";
                            const isOverdue = !isPaid && item.dueDate && item.dueDate < todayStr;
                            return (
                                <li key={item.id} className={`group flex items-center gap-3 border rounded-2xl px-4 sm:px-5 py-3.5 transition-all duration-200 ${
                                    isPaid
                                        ? "bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.03] dark:border-white/[0.02] opacity-60"
                                        : "bg-white/40 dark:bg-white/[0.03] hover:bg-white/70 dark:hover:bg-white/[0.08] border-black/[0.03] dark:border-white/[0.02]"
                                }`}>
                                    <div
                                        className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${
                                            isOwedToMe
                                                ? "bg-[#E6F3EF] text-[#1F6F54] dark:bg-[#1F6F54]/20 dark:text-[#52C8A1]"
                                                : "bg-[#FAEDE9] text-[#B5483B] dark:bg-[#B5483B]/20 dark:text-[#F38C80]"
                                        }`}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" className="w-[17px] h-[17px]" strokeWidth="2.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                            {isOwedToMe ? <path d="M12 5v14m0 0-5-5m5 5 5-5" /> : <path d="M12 19V5m0 0-5 5m5-5 5 5" />}
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-ink dark:text-paper truncate block">
                                            <span className="font-mono font-bold text-[14px] sm:text-[15px]">₱{window.peso(item.amount)}</span>
                                            <span className="text-[13px] font-medium text-ink2/60 dark:text-paper/50 ml-1.5">— {item.name}</span>
                                        </span>
                                        {(item.dueDate || item.notes) && (
                                            <span className={`text-[11px] font-mono mt-0.5 flex items-center gap-1.5 ${isOverdue ? "text-[#B5483B] dark:text-[#F38C80] font-semibold" : "text-ink2/45 dark:text-paper/35"}`}>
                                                {item.dueDate && (isOverdue ? "Overdue: " : "Due: ") + item.dueDate}
                                                {item.dueDate && item.notes && " · "}
                                                {item.notes}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {isPaid ? (
                                            <button
                                                onClick={() => handleReopen(item)}
                                                className="text-[10.5px] font-mono font-semibold uppercase tracking-wide text-ink2/50 dark:text-paper/40 hover:text-ink dark:hover:text-paper bg-black/5 dark:bg-white/10 px-2.5 py-1.5 rounded-full transition-colors duration-150"
                                            >
                                                Buksan Ulit
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSettle(item)}
                                                aria-label="Markahan bilang bayad"
                                                className="text-[#1F6F54] dark:text-[#52C8A1] p-1.5 rounded-full hover:bg-[#1F6F54]/10 dark:hover:bg-[#52C8A1]/20 transition-all duration-200 active:scale-90"
                                            >
                                                <window.Icons.Check size={17} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item)}
                                            aria-label="Alisin"
                                            className="text-ink2/30 hover:text-expense dark:text-paper/30 dark:hover:text-[#F38C80] p-1.5 rounded-full hover:bg-expense/10 dark:hover:bg-[#B5483B]/20 transition-all duration-200 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 active:scale-90"
                                        >
                                            <window.Icons.Trash size={16} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl bg-white/40 dark:bg-black/10 border border-dashed border-black/10 dark:border-white/10">
                        <div className="w-12 h-12 rounded-[14px] bg-black/5 dark:bg-white/5 flex items-center justify-center text-ink2/30 dark:text-paper/20 mb-3">
                            <window.Icons.Inbox size={22} strokeWidth={2} />
                        </div>
                        <p className="text-[13px] font-semibold text-ink2/70 dark:text-paper/60">Walang record dito</p>
                        <p className="text-[11.5px] text-ink2/50 dark:text-paper/40 mt-1">I-log ang unang utang mo sa itaas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
