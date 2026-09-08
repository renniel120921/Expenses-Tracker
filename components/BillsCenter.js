// components/BillsCenter.js

function StatIcon({ icon, tone }) {
    const tones = {
        peso: "bg-[#E6F3EF] text-[#1F6F54] dark:bg-[#1F6F54]/20 dark:text-[#52C8A1]",
        expense: "bg-[#FAEDE9] text-[#B5483B] dark:bg-[#B5483B]/20 dark:text-[#F38C80]",
        gold: "bg-[#FDF6E3] text-[#C9932E] dark:bg-[#C9932E]/20 dark:text-[#E8C071]",
    };
    return (
        <span aria-hidden="true" className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 shadow-sm border border-white/40 dark:border-white/5 ${tones[tone] || tones.peso}`}>
            {icon}
        </span>
    );
}

function SelectChevron() {
    return (
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink2/30 dark:text-paper/30 shrink-0 pointer-events-none">
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

function FieldWrap({ icon, children, className = "" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-white/80 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 shadow-sm ${className}`}>
            {icon}
            {children}
        </div>
    );
}

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
            const eased = 1 - Math.pow(1 - t, 4);
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

function formatDueDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

// FIX: Gumamit ng Math.round para mas tumpak ang araw at iwas timezone shifts
function getDueBadge(bill) {
    if (bill.status === "Paid" || bill.status === "Overdue") return null;
    const bDate = new Date(bill.dueDate);
    if (isNaN(bDate.getTime())) return null;
    bDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((bDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays > 3) return null;
    if (diffDays === 0) return { label: "Due Ngayon", tone: "text-[#B5483B] bg-[#FAEDE9] border-[#B5483B]/20 dark:text-[#F38C80] dark:bg-[#B5483B]/20 dark:border-[#F38C80]/30" };
    if (diffDays === 1) return { label: "Bukas", tone: "text-[#C9932E] bg-[#FDF6E3] border-[#C9932E]/20 dark:text-[#E8C071] dark:bg-[#C9932E]/20 dark:border-[#E8C071]/30" };
    return { label: `Sa loob ng ${diffDays} araw`, tone: "text-[#1F6F54] bg-[#E6F3EF] border-[#1F6F54]/20 dark:text-[#52C8A1] dark:bg-[#1F6F54]/20 dark:border-[#52C8A1]/30" };
}

const BillsCenterFallbackIcons = {
    Trash: ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    Pencil: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>,
    Calendar: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    Category: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.59 9.59a2 2 0 0 0 2.82 0l4.59-4.59a2 2 0 0 0 0-2.82Z"/><circle cx="7.5" cy="7.5" r="1"/></svg>,
    Wallet: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
    AlertCircle: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    Check: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>,
    Inbox: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></svg>,
    Loader: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}><path d="M12 2a10 10 0 0 1 10 10"/></svg>,
    Plus: ({ size = 16, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5v14M5 12h14"/></svg>
};

window.BillsCenter = function BillsCenter({ uid, bills = [], loading }) {
    const { useState, useEffect } = React;
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [category, setCategory] = useState("Kuryente");
    const [saving, setSaving] = useState(false);

    const Icons = { ...BillsCenterFallbackIcons, ...(window.Icons || {}) };

    const totalUnpaid = window.TipidCore.sumMoney(bills.filter(b => b.status === "Unpaid" || b.status === "Overdue").map(b => b.amount));
    const overdueCount = bills.filter(b => b.status === "Overdue").length;
    const paidCount = bills.filter(b => b.status === "Paid").length;
    const paidPct = bills.length > 0 ? Math.round((paidCount / bills.length) * 100) : 0;

    // --- FIX: EXACT DATE LOGIC IN NOTIFICATIONS ---
    useEffect(() => {
        if (!loading && bills.length > 0) {
            const notificationKey = window.TipidCore.storageKey(uid, 'bills_notified');
            const hasNotified = sessionStorage.getItem(notificationKey);
            if (hasNotified) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const overdue = [];

            bills.forEach(bill => {
                if (bill.status === "Paid") return;

                const bDate = new Date(bill.dueDate);
                bDate.setHours(0, 0, 0, 0);

                const diffDays = Math.round((bDate - today) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    overdue.push({ ...bill, diffDays });
                } else if (diffDays >= 0 && diffDays <= 3) {
                    upcoming.push({ ...bill, diffDays });
                }
            });

            if (overdue.length > 0 || upcoming.length > 0) {
                const lines = [];
                if (overdue.length) {
                    lines.push("Overdue:", ...overdue.map(b => `${b.title} — ₱${window.peso(b.amount)}`));
                }
                if (upcoming.length) {
                    if (lines.length) lines.push("");
                    lines.push("Paparating:", ...upcoming.map(b => {
                        const dayLabel = b.diffDays === 0 ? "Ngayong araw" : b.diffDays === 1 ? "Bukas" : `Sa loob ng ${b.diffDays} araw`;
                        return `${b.title} — ₱${window.peso(b.amount)} (${dayLabel})`;
                    }));
                }
                Swal.fire({
                    title: 'May Babayaran Ka',
                    text: lines.join("\n"),
                    confirmButtonText: 'Sige, Titingnan Ko',
                    confirmButtonColor: '#1F6F54',
                    customClass: { popup: 'tipid-swal' }
                });

                sessionStorage.setItem(notificationKey, 'true');
            }
        }
    }, [bills, loading, uid]);

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
            text: 'Hindi na ito maibabalik.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B5483B',
            cancelButtonColor: '#33443A',
            confirmButtonText: 'Oo, burahin',
            cancelButtonText: 'Kanselahin',
            customClass: { popup: 'tipid-swal' },
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                await window.TipidData.deleteBill(uid, billId);
            }
        });
    };

    return (
        <div className="space-y-6 sm:space-y-8 fade-up">

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

                {/* Total Unpaid */}
                <div className="relative overflow-hidden bg-white/70 dark:bg-ink2/30 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios transition-transform hover:-translate-y-1 duration-300 group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E8C071] to-[#C9932E]" />
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gold/10 rounded-full blur-xl group-hover:bg-gold/20 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <StatIcon tone="gold" icon={<Icons.Wallet size={16} />} />
                        <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-ink2/50 dark:text-paper/50">Total na Babayaran</p>
                    </div>
                    <AnimatedAmount value={totalUnpaid} className="relative z-10 font-mono text-[1.7rem] sm:text-3xl font-bold tracking-tight text-ink dark:text-paper" />
                </div>

                {/* Overdue */}
                <div className="relative overflow-hidden bg-white/70 dark:bg-ink2/30 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios transition-transform hover:-translate-y-1 duration-300 group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F38C80] to-[#B5483B]" />
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-expense/5 rounded-full blur-xl group-hover:bg-expense/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <StatIcon tone="expense" icon={<Icons.AlertCircle size={16} />} />
                        <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-[#B5483B] dark:text-[#F38C80]">Overdue Bills</p>
                    </div>
                    <p className="relative z-10 font-display text-[1.7rem] sm:text-3xl font-bold text-expense dark:text-[#F38C80]">
                        {overdueCount} <span className="text-[15px] font-body font-medium opacity-80">mga bill</span>
                    </p>
                </div>

                {/* Paid */}
                <div className="relative overflow-hidden bg-white/70 dark:bg-ink2/30 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios transition-transform hover:-translate-y-1 duration-300 group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2F8E6C] to-[#1F6F54]" />
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-peso/5 rounded-full blur-xl group-hover:bg-peso/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <StatIcon tone="peso" icon={<Icons.Check size={18} />} />
                        <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-[#1F6F54] dark:text-[#52C8A1]">Bayad na (Paid)</p>
                    </div>
                    <p className="relative z-10 font-display text-[1.7rem] sm:text-3xl font-bold text-peso dark:text-[#52C8A1]">
                        {paidCount} <span className="text-[15px] font-body font-medium opacity-80">naitala</span>
                    </p>
                </div>
            </div>

            {/* Add Bill Form */}
            <div className="bg-white/70 dark:bg-ink2/40 backdrop-blur-2xl rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios p-5 sm:p-7 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-pesoLight to-peso" />
                <div className="flex items-center gap-3 mb-6 mt-1">
                    <span className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#E6F3EF] to-[#D5EBE3] dark:from-[#1F6F54]/30 dark:to-[#1F6F54]/10 shadow-sm border border-white/40 dark:border-white/5 text-peso dark:text-pesoLight flex items-center justify-center shrink-0">
                        <Icons.Pencil size={18} />
                    </span>
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">Magdagdag ng Bill</h3>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">Itala ang iyong mga babayarin</p>
                    </div>
                </div>

                <form onSubmit={handleAddBill} className="flex flex-col gap-3 sm:gap-3.5 relative z-10">

                    <FieldWrap icon={<Icons.Pencil size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                        <label htmlFor="bill-title" className="sr-only">Pangalan ng bill</label>
                        <input
                            id="bill-title"
                            type="text"
                            placeholder="Pangalan ng Bill (Hal: Kuryente)"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-medium text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                        />
                    </FieldWrap>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-3.5">
                        <FieldWrap className="sm:w-[150px]" icon={<span className="text-ink2/40 dark:text-paper/40 font-mono text-[15px] shrink-0">₱</span>}>
                            <label htmlFor="bill-amount" className="sr-only">Halaga</label>
                            <input
                                id="bill-amount"
                                type="number"
                                step="0.01"
                                placeholder="Halaga"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-base font-mono font-bold text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25 placeholder:font-medium focus:outline-none"
                            />
                        </FieldWrap>

                        {/* Calendar Picker */}
                        <FieldWrap className="sm:w-[170px]" icon={<Icons.Calendar size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                            <label htmlFor="bill-due-date" className="sr-only">Due date</label>
                            <input
                                id="bill-due-date"
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] font-mono font-semibold text-ink dark:text-paper focus:outline-none appearance-none"
                            />
                        </FieldWrap>

                        {/* Category Select */}
                        <FieldWrap className="sm:w-[150px] relative" icon={<Icons.Category size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                            <label htmlFor="bill-category" className="sr-only">Kategorya</label>
                            <select
                                id="bill-category"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full min-w-0 bg-transparent py-3.5 text-[14px] font-medium text-ink dark:text-paper focus:outline-none appearance-none pr-2 cursor-pointer"
                            >
                                <option value="Bills" className="bg-paper dark:bg-ink dark:text-paper">Bills</option>
                                <option value="Kuryente" className="bg-paper dark:bg-ink dark:text-paper">Kuryente</option>
                                <option value="Tubig" className="bg-paper dark:bg-ink dark:text-paper">Tubig</option>
                                <option value="Internet" className="bg-paper dark:bg-ink dark:text-paper">Internet</option>
                                <option value="Rent / Bahay" className="bg-paper dark:bg-ink dark:text-paper">Rent / Bahay</option>
                                <option value="Credit Card" className="bg-paper dark:bg-ink dark:text-paper">Credit Card</option>
                                <option value="Utang/Loan" className="bg-paper dark:bg-ink dark:text-paper">Utang/Loan</option>
                                <option value="Iba pa" className="bg-paper dark:bg-ink dark:text-paper">Iba pa</option>
                            </select>
                            <SelectChevron />
                        </FieldWrap>

                        <button
                            type="submit"
                            disabled={saving}
                            aria-label={saving ? "Sinasave" : "Idagdag ang bill"}
                            className="bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/20 active:scale-95 disabled:opacity-60 text-white font-semibold rounded-[14px] px-6 py-3.5 text-[14px] transition-all duration-200 shrink-0 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
                        >
                            {saving ? <Icons.Loader size={18} className="spin" /> : <Icons.Plus size={18} />}
                            <span className="hidden sm:inline">{saving ? "Sinasave..." : "Idagdag"}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Bills List */}
            <div className="bg-white/70 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios overflow-hidden p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-6 rounded-full bg-peso dark:bg-pesoLight"></div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper">Listahan ng mga Bills</h3>
                    </div>
                    {!loading && bills.length > 0 && (
                        <span className="text-[11px] font-mono font-medium bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/5 px-3 py-1.5 rounded-lg text-ink2/60 dark:text-paper/50">
                            {paidCount}/{bills.length} bayad na
                        </span>
                    )}
                </div>

                {/* Modern Progress Bar */}
                {!loading && bills.length > 0 && (
                    <div className="mb-7 relative">
                        <div
                            role="progressbar"
                            aria-label="Porsyento ng mga bills na bayad na"
                            aria-valuenow={paidPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden shadow-inner"
                        >
                            <div className="h-full rounded-full bg-gradient-to-r from-pesoLight to-peso transition-all duration-1000 ease-out relative" style={{ width: `${paidPct}%` }}>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 w-full h-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div role="status" aria-label="Naglo-load ng mga bills" className="py-12 flex items-center justify-center text-ink2/40 dark:text-paper/30">
                        <Icons.Loader size={24} className="spin" />
                    </div>
                ) : bills.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-4 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                        <div aria-hidden="true" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-paperDim to-paperDim/50 dark:from-ink2/60 dark:to-ink2/20 border border-dashed border-line dark:border-white/15 flex items-center justify-center">
                            <Icons.Inbox size={26} className="text-ink2/30 dark:text-paper/25" />
                        </div>
                        <p className="text-[13px] font-medium text-ink2/60 dark:text-paper/50">Wala pang naka-set na bills.<br/>Magdagdag sa itaas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bills.map(bill => {
                            const isPaid = bill.status === "Paid";
                            const isOverdue = bill.status === "Overdue";
                            const dueBadge = getDueBadge(bill);

                            const rowAccent = isPaid
                                ? "bg-[#1F6F54] dark:bg-[#52C8A1]"
                                : isOverdue
                                    ? "bg-[#B5483B] dark:bg-[#F38C80]"
                                    : dueBadge
                                        ? "bg-[#C9932E] dark:bg-[#E8C071]"
                                        : "bg-ink2/15 dark:bg-paper/15";

                            return (
                                <div key={bill.id} className={`relative overflow-hidden group flex items-center justify-between gap-3 pl-5 pr-3.5 sm:pl-6 sm:pr-4 py-3.5 sm:py-4 bg-white/60 dark:bg-white/[0.03] rounded-2xl transition-all duration-300 border hover:shadow-sm ${isPaid ? 'border-black/5 dark:border-white/5 opacity-70 hover:opacity-100' : 'border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10'}`}>

                                    <div
                                        className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-[55%] w-[3px] rounded-full transition-opacity duration-300 ${rowAccent} opacity-30 group-hover:opacity-100`}
                                        aria-hidden="true"
                                    ></div>

                                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">

                                        {/* iOS Style Circular Checkbox */}
                                        <button
                                            onClick={() => toggleStatus(bill)}
                                            aria-pressed={isPaid}
                                            aria-label={isPaid ? `Markahan bilang hindi pa bayad: ${bill.title}` : `Markahan bilang bayad na: ${bill.title}`}
                                            title={isPaid ? "Markahan bilang hindi pa bayad" : "Markahan bilang bayad na"}
                                            className={`w-6 h-6 sm:w-[1.65rem] sm:h-[1.65rem] rounded-full flex items-center justify-center shrink-0 transition-all duration-300 active:scale-90 ${
                                                isPaid
                                                    ? 'bg-[#1F6F54] border-2 border-[#1F6F54] text-white shadow-sm'
                                                    : 'bg-white/50 dark:bg-transparent border-2 border-black/15 dark:border-white/20 hover:border-black/30 dark:hover:border-white/40'
                                            }`}
                                        >
                                            <Icons.Check size={14} className={`transition-opacity duration-300 ${isPaid ? 'opacity-100' : 'opacity-0'}`} />
                                        </button>

                                        <div className="min-w-0 pr-2">
                                            <p className={`font-semibold text-[14px] sm:text-[15px] leading-tight truncate transition-colors duration-300 ${isPaid ? 'line-through text-ink2/40 dark:text-paper/30' : 'text-ink dark:text-paper'}`}>
                                                {bill.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className={`text-[9px] sm:text-[10px] font-mono font-semibold tracking-wide px-2 py-0.5 rounded-md uppercase border ${isPaid ? 'bg-black/5 dark:bg-white/5 text-ink2/30 dark:text-paper/20 border-transparent' : 'bg-white dark:bg-black/20 text-ink2/70 dark:text-paper/70 border-black/5 dark:border-white/10'}`}>
                                                    {bill.category}
                                                </span>
                                                <span className={`text-[10px] sm:text-[11px] font-medium ${isPaid ? 'text-ink2/30 dark:text-paper/20' : 'text-ink2/50 dark:text-paper/40'}`}>
                                                    Due: {formatDueDate(bill.dueDate)}
                                                </span>
                                                {isOverdue && !isPaid && (
                                                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAEDE9] dark:bg-[#B5483B]/20 text-[#B5483B] dark:text-[#F38C80] border border-[#B5483B]/10 dark:border-[#F38C80]/20 uppercase">
                                                        Overdue
                                                    </span>
                                                )}
                                                {dueBadge && !isPaid && (
                                                    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${dueBadge.tone}`}>
                                                        {dueBadge.label}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                        <span className={`font-mono font-bold tabular-nums text-[15px] sm:text-[17px] tracking-tight transition-colors duration-300 ${isPaid ? 'text-ink2/30 dark:text-paper/20' : 'text-ink dark:text-paper'}`}>
                                            ₱{window.peso(bill.amount)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(bill.id)}
                                            aria-label={`Burahin ang bill: ${bill.title}`}
                                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200 p-2 rounded-full text-ink2/30 hover:text-expense hover:bg-expense/10 dark:text-paper/30 dark:hover:text-[#F38C80] dark:hover:bg-[#B5483B]/20 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40"
                                        >
                                            <Icons.Trash size={18} strokeWidth={2.2} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>
        </div>
    );
};
