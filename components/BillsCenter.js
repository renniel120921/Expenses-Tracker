function StatIcon({ icon, tone }) {
    const tones = {
        peso: "bg-peso/10 text-peso dark:bg-pesoLight/15 dark:text-pesoLight",
        expense: "bg-expense/10 text-expense dark:bg-expense/20 dark:text-expense",
        gold: "bg-gold/10 text-gold dark:bg-gold/20 dark:text-gold",
    };
    return <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${tones[tone] || tones.peso}`}>{icon}</span>;
}

function SelectChevron() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink2/40 dark:text-paper/35 shrink-0 pointer-events-none">
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

function FieldWrap({ icon, children, className = "" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-peso/40 focus-within:border-peso/40 transition-all duration-200 ${className}`}>
            {icon}
            {children}
        </div>
    );
}

function formatDueDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // fallback kung hindi ma-parse
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Same 3-day "paparating" window as the reminder popup effect below — purely
// a per-row hint for display, doesn't touch bill.status or that effect.
function getDueBadge(bill) {
    if (bill.status === "Paid" || bill.status === "Overdue") return null;
    const bDate = new Date(bill.dueDate);
    if (isNaN(bDate.getTime())) return null;
    bDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((bDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays > 3) return null;
    if (diffDays === 0) return { label: "Due Ngayon", tone: "text-gold bg-gold/10" };
    if (diffDays === 1) return { label: "Bukas", tone: "text-gold bg-gold/10" };
    return { label: `Sa loob ng ${diffDays} araw`, tone: "text-ink2/60 dark:text-paper/50 bg-paperDim dark:bg-ink2/50" };
}

// Local fallback icon set. Kept OUTSIDE the component so it isn't
// recreated (and re-diffed) on every render.
const BillsCenterFallbackIcons = {
    Trash: ({ size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    ),
    Pencil: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
    ),
    Calendar: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    ),
    Category: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.59 9.59a2 2 0 0 0 2.82 0l4.59-4.59a2 2 0 0 0 0-2.82Z"/><circle cx="7.5" cy="7.5" r="1"/></svg>
    ),
    Wallet: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
    ),
    AlertCircle: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ),
    Check: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
    ),
    Inbox: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></svg>
    ),
    Loader: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}><path d="M12 2a10 10 0 0 1 10 10"/></svg>
    ),
};

window.BillsCenter = function BillsCenter({ uid, bills = [], loading }) {
    const { useState, useEffect } = React;
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [category, setCategory] = useState("Bills");
    const [saving, setSaving] = useState(false);

    // Resolve global Icons safely. IMPORTANT: merge instead of a straight
    // `window.Icons || fallback`, since window.Icons can exist globally
    // (set by another script) but be missing one of the specific icons
    // this component needs (e.g. Category, AlertCircle, Wallet, Check,
    // Inbox, Loader). A missing key renders as `undefined` and React
    // throws "Element type is invalid" (minified error #130). Merging
    // guarantees every icon used below always resolves to something.
    const Icons = { ...BillsCenterFallbackIcons, ...(window.Icons || {}) };

    // Summary calculations
    const totalUnpaid = bills.filter(b => b.status === "Unpaid" || b.status === "Overdue").reduce((acc, curr) => acc + curr.amount, 0);
    const overdueCount = bills.filter(b => b.status === "Overdue").length;
    const paidCount = bills.filter(b => b.status === "Paid").length;

    // --- IN-APP NOTIFICATION LOGIC ---
    useEffect(() => {
        if (!loading && bills.length > 0) {
            // I-check kung na-notify na ang user sa session na ito para hindi ma-spam
            const hasNotified = sessionStorage.getItem('tipid_bills_notified');
            if (hasNotified) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const overdue = [];

            bills.forEach(bill => {
                if (bill.status === "Paid") return; // Huwag isama ang bayad na

                const bDate = new Date(bill.dueDate);
                bDate.setHours(0, 0, 0, 0);

                const diffTime = bDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    overdue.push(bill);
                } else if (diffDays >= 0 && diffDays <= 3) {
                    // Mga bills na due ngayon hanggang sa susunod na 3 araw
                    upcoming.push(bill);
                }
            });

            if (overdue.length > 0 || upcoming.length > 0) {
                let htmlMsg = `<div class="text-left text-sm space-y-4 mt-2">`;

                if (overdue.length > 0) {
                    htmlMsg += `<div>
                        <strong style="color: #B5483B;">⚠️ Overdue Na:</strong>
                        <ul class="list-disc ml-5 mt-1 text-gray-700">`;
                    overdue.forEach(b => {
                        htmlMsg += `<li>${b.title} — <b>₱${window.peso(b.amount)}</b></li>`;
                    });
                    htmlMsg += `</ul></div>`;
                }

                if (upcoming.length > 0) {
                    htmlMsg += `<div>
                        <strong style="color: #1F6F54;">📅 Paparating (Next 3 Days):</strong>
                        <ul class="list-disc ml-5 mt-1 text-gray-700">`;
                    upcoming.forEach(b => {
                        htmlMsg += `<li>${b.title} — <b>₱${window.peso(b.amount)}</b></li>`;
                    });
                    htmlMsg += `</ul></div>`;
                }

                htmlMsg += `</div>`;

                Swal.fire({
                    title: 'Paalala sa Bayarin!',
                    html: htmlMsg,
                    icon: 'info',
                    confirmButtonText: 'Sige, Titingnan Ko',
                    confirmButtonColor: '#1F6F54',
                    customClass: { popup: 'tipid-swal' }
                });

                // I-save sa session storage para hindi na lumabas ulit hangga't hindi nire-restart ang app
                sessionStorage.setItem('tipid_bills_notified', 'true');
            }
        }
    }, [bills, loading]);

    const handleAddBill = async (e) => {
        e.preventDefault();
        if (!title.trim() || !amount || !dueDate) {
            return Swal.fire({
                icon: 'warning',
                title: 'Kulang ang Detalye',
                text: 'Pakilagay ang pangalan ng bill, halaga, at due date.',
                confirmButtonColor: '#1F6F54',
                customClass: { popup: 'tipid-swal' }
            });
        }

        setSaving(true);
        try {
            await window.TipidData.addBill(uid, {
                title: title.trim(),
                amount: parseFloat(amount),
                dueDate,
                category
            });

            setTitle("");
            setAmount("");
            setDueDate("");

            Swal.fire({
                icon: 'success',
                title: 'Naidagdag na! 📅',
                text: 'Matagumpay na naitala ang iyong bill.',
                confirmButtonColor: '#1F6F54',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'tipid-swal' }
            });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Hindi ma-save ang bill. Subukan ulit.', confirmButtonColor: '#B5483B', customClass: { popup: 'tipid-swal' }});
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (bill) => {
        const nextStatus = bill.status === "Paid" ? "Unpaid" : "Paid";
        try {
            await window.TipidData.updateBillStatus(uid, bill.id, nextStatus);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (billId) => {
        Swal.fire({
            title: 'Burahin ang Bill na ito?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B5483B',
            cancelButtonColor: '#33443A',
            confirmButtonText: 'Oo, burahin',
            cancelButtonText: 'Kanselahin',
            customClass: { popup: 'tipid-swal' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await window.TipidData.deleteBill(uid, billId);
            }
        });
    };

    return (
        <div className="space-y-6 fade-up">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative overflow-hidden bg-white/85 dark:bg-ink2/30 backdrop-blur-xl p-5 sm:p-6 rounded-[1.75rem] border border-line/50 dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)]">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold to-peso" />
                    <div className="flex items-center gap-2 mb-1.5">
                        <StatIcon tone="gold" icon={<Icons.Wallet size={13} />} />
                        <p className="text-xs font-mono uppercase tracking-wider text-ink2/60 dark:text-paper/50">Total na Babayaran</p>
                    </div>
                    <p className="font-display text-2xl font-semibold text-ink dark:text-paper">₱{window.peso(totalUnpaid)}</p>
                </div>
                <div className="relative overflow-hidden bg-white/85 dark:bg-ink2/30 backdrop-blur-xl p-5 sm:p-6 rounded-[1.75rem] border border-line/50 dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)]">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-expense to-expense/60" />
                    <div className="flex items-center gap-2 mb-1.5">
                        <StatIcon tone="expense" icon={<Icons.AlertCircle size={13} />} />
                        <p className="text-xs font-mono uppercase tracking-wider text-expense">Overdue Bills</p>
                    </div>
                    <p className="font-display text-2xl font-semibold text-expense">{overdueCount} <span className="text-sm font-body font-normal">mga bill</span></p>
                </div>
                <div className="relative overflow-hidden bg-white/85 dark:bg-ink2/30 backdrop-blur-xl p-5 sm:p-6 rounded-[1.75rem] border border-line/50 dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)]">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-peso to-pesoLight" />
                    <div className="flex items-center gap-2 mb-1.5">
                        <StatIcon tone="peso" icon={<Icons.Check size={13} />} />
                        <p className="text-xs font-mono uppercase tracking-wider text-peso dark:text-pesoLight">Bayad na (Paid)</p>
                    </div>
                    <p className="font-display text-2xl font-semibold text-peso dark:text-pesoLight">{paidCount} <span className="text-sm font-body font-normal">naitala</span></p>
                </div>
            </div>

            {/* Add Bill Form */}
            <div className="bg-white/85 dark:bg-ink2/30 backdrop-blur-xl rounded-[1.75rem] border border-line/50 dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] p-6 sm:p-7">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink dark:text-paper">Magdagdag ng Bill</h3>
                <form onSubmit={handleAddBill} className="flex flex-col gap-3.5">
                    <FieldWrap icon={<Icons.Pencil size={15} className="text-ink2/40 dark:text-paper/35 shrink-0" />}>
                        <input
                            type="text"
                            placeholder="Pangalan ng Bill (e.g. Kuryente)"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full min-w-0 bg-transparent py-3 text-sm font-medium text-ink dark:text-paper placeholder:text-ink2/40 dark:placeholder:text-paper/30 focus:outline-none"
                        />
                    </FieldWrap>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <FieldWrap icon={<span className="text-ink2/40 dark:text-paper/35 font-mono text-sm shrink-0">₱</span>}>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Halaga"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3 text-sm font-mono font-medium text-ink dark:text-paper placeholder:text-ink2/40 dark:placeholder:text-paper/30 focus:outline-none"
                            />
                        </FieldWrap>

                        {/* Hito ang Calendar Picker (Native HTML5 Date Input) */}
                        <FieldWrap icon={<Icons.Calendar size={14} className="text-ink2/40 dark:text-paper/35 shrink-0" />}>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3 text-sm font-mono font-medium text-ink dark:text-paper focus:outline-none"
                            />
                        </FieldWrap>

                        <FieldWrap className="relative" icon={<Icons.Category size={14} className="text-ink2/40 dark:text-paper/35 shrink-0" />}>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3 text-sm text-ink dark:text-paper focus:outline-none appearance-none pr-1"
                            >
                                <option value="Bills" className="dark:bg-ink dark:text-paper">Bills</option>
                                <option value="Kuryente" className="dark:bg-ink dark:text-paper">Kuryente</option>
                                <option value="Tubig" className="dark:bg-ink dark:text-paper">Tubig</option>
                                <option value="Internet" className="dark:bg-ink dark:text-paper">Internet</option>
                                <option value="Rent / Bahay" className="dark:bg-ink dark:text-paper">Rent / Bahay</option>
                                <option value="Iba pa" className="dark:bg-ink dark:text-paper">Iba pa</option>
                            </select>
                            <SelectChevron />
                        </FieldWrap>

                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-peso hover:bg-pesoLight active:scale-95 disabled:opacity-60 text-paper font-semibold rounded-2xl px-4 py-3 text-sm transition-all duration-200 shadow-[0_10px_22px_-10px_rgba(18,61,46,0.55)] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50 focus-visible:ring-offset-2"
                        >
                            {saving && <Icons.Loader size={14} className="spin" />}
                            {saving ? "Sine-save..." : "I-save ang Bill"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Bills List */}
            <div className="bg-white/85 dark:bg-ink2/30 backdrop-blur-xl rounded-[1.75rem] border border-line/50 dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.04),0_14px_28px_-16px_rgba(21,35,28,0.18)] overflow-hidden p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                    <h3 className="font-display text-lg font-semibold text-ink dark:text-paper">Listahan ng mga Bills</h3>
                    {!loading && bills.length > 0 && (
                        <span className="text-[11px] font-mono text-ink2/50 dark:text-paper/40">{paidCount}/{bills.length} bayad na</span>
                    )}
                </div>
                {!loading && bills.length > 0 && (
                    <div className="h-1.5 bg-paperDim dark:bg-ink2/50 rounded-full overflow-hidden mb-5">
                        <div className="bar-fill h-full rounded-full bg-peso" style={{ width: `${Math.round((paidCount / bills.length) * 100)}%` }} />
                    </div>
                )}

                {loading ? (
                    <p className="text-sm text-ink2/50 dark:text-paper/40 py-8 text-center">Naglo-load ng bills...</p>
                ) : bills.length === 0 ? (
                    <div className="py-12 text-center text-ink2/50 dark:text-paper/40 flex flex-col items-center gap-2">
                        <Icons.Inbox size={20} className="text-ink2/30 dark:text-paper/25" />
                        <p className="text-sm">Wala pang naka-set na bills. Magdagdag sa itaas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bills.map(bill => {
                            const isPaid = bill.status === "Paid";
                            const isOverdue = bill.status === "Overdue";
                            const dueBadge = getDueBadge(bill);
                            return (
                                <div key={bill.id} className="flex items-center justify-between gap-3 p-4 bg-paper/40 dark:bg-ink2/40 rounded-2xl border border-line/40 dark:border-white/5 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_10px_24px_-14px_rgba(21,35,28,0.25)] hover:-translate-y-0.5">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <button
                                            onClick={() => toggleStatus(bill)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
                                                isPaid ? 'bg-peso border-peso text-white' : 'border-line dark:border-paper/40'
                                            }`}
                                            title="Mark as Paid"
                                        >
                                            {isPaid && <span className="text-xs font-bold">✓</span>}
                                        </button>
                                        <div className="min-w-0">
                                            <p className={`font-semibold text-sm md:text-base truncate ${isPaid ? 'line-through text-ink2/50 dark:text-paper/40' : 'text-ink dark:text-paper'}`}>
                                                {bill.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-paperDim dark:bg-ink2/50 uppercase text-ink2/70 dark:text-paper/60">
                                                    {bill.category}
                                                </span>
                                                <span className="text-[11px] font-mono text-ink2/60 dark:text-paper/50">
                                                    Due: {formatDueDate(bill.dueDate)}
                                                </span>
                                                {isOverdue && !isPaid && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-expense/10 text-expense uppercase">
                                                        Overdue
                                                    </span>
                                                )}
                                                {dueBadge && (
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase ${dueBadge.tone}`}>
                                                        {dueBadge.label}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-mono font-semibold text-sm md:text-base text-ink dark:text-paper">
                                            ₱{window.peso(bill.amount)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(bill.id)}
                                            className="text-ink2/40 hover:text-expense hover:bg-expense/10 active:scale-90 transition-all duration-200 p-1.5 rounded-full"
                                        >
                                            <Icons.Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
