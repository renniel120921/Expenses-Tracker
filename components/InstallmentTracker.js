// components/InstallmentTracker.js

// ---- date helpers ---------------------------------------------------

function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

function formatDatePH(date) {
    if (!date) return "—";
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

// Legacy items (added before this update) won't have `startDate`. Fall back
// to the item's id, which is a Date.now() timestamp, so old entries still
// get a sensible start date instead of breaking.
function resolveStartDate(item) {
    if (item.startDate) return new Date(item.startDate);
    const fromId = Number(item.id);
    return isNaN(fromId) ? new Date() : new Date(fromId);
}

// Same bank/e-wallet catalog used on the main dashboard (dashboard.html's
// window.SUPPORTED_WALLETS), so a hulugan can be tagged with the actual
// card/wallet the user pays it from. Duplicated here — rather than relying
// on window.SUPPORTED_WALLETS existing already — because this page can be
// opened directly and never loads dashboard.html's inline script.
const WALLET_META = window.SUPPORTED_WALLETS || [
    { id: "Cash", name: "Cash", type: "cash", color: "from-[#1F6F54] to-[#123D2E]", text: "CASH", font: "font-display tracking-[0.15em]", textStyle: "text-white" },
    { id: "GCash", name: "GCash", type: "ewallet", color: "from-[#0052FE] to-[#004ADB]", text: "GCash", font: "font-sans italic font-extrabold tracking-tighter", textStyle: "text-white" },
    { id: "Maya", name: "Maya", type: "ewallet", color: "from-[#0A0A0A] via-[#171717] to-[#242424]", text: "maya", font: "font-sans font-black tracking-widest lowercase", textStyle: "text-white" },
    { id: "ShopeePay", name: "ShopeePay", type: "ewallet", color: "from-[#EE4D2D] to-[#D8390F]", text: "ShopeePay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "GrabPay", name: "GrabPay", type: "ewallet", color: "from-[#00B14F] to-[#009344]", text: "GrabPay", font: "font-sans font-extrabold tracking-tight", textStyle: "text-white" },
    { id: "Atome", name: "Atome Card", type: "credit", color: "from-[#FFDE00] to-[#D4B300]", text: "atome", font: "font-sans font-black lowercase tracking-widest", textStyle: "text-[#111]" },
    { id: "MariBank", name: "MariBank", type: "digital", color: "from-[#EE4D2D] to-[#D8390F]", text: "MariBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "SeaBank", name: "SeaBank", type: "digital", color: "from-[#FF6E00] to-[#E65A00]", text: "SeaBank", font: "font-sans font-bold", textStyle: "text-white" },
    { id: "GoTyme", name: "GoTyme Bank", type: "digital", color: "from-[#0052FF] to-[#00238A]", text: "GoTyme", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "Tonik", name: "Tonik Bank", type: "digital", color: "from-[#FF4D85] to-[#E6004F]", text: "tonik", font: "font-sans font-black lowercase tracking-tight", textStyle: "text-white" },
    { id: "UNO", name: "UNO Digital Bank", type: "digital", color: "from-[#E63946] to-[#8E0000]", text: "UNO", font: "font-sans font-black tracking-[0.2em] uppercase", textStyle: "text-white" },
    { id: "UnionDigital", name: "UnionDigital Bank", type: "digital", color: "from-[#FF6B00] to-[#C24700]", text: "UnionDigital", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "CIMB", name: "CIMB Bank", type: "digital", color: "from-[#E3000F] to-[#8E0000]", text: "CIMB", font: "font-sans font-black tracking-widest", textStyle: "text-white" },
    { id: "DiskarTech", name: "DiskarTech", type: "ewallet", color: "from-[#00A5E3] to-[#0067C7]", text: "DiskarTech", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "BDO", name: "BDO Unibank", type: "bank", color: "from-[#002A86] to-[#00133D]", text: "BDO", font: "font-sans font-black tracking-[0.15em]", textStyle: "text-white" },
    { id: "BPI", name: "BPI", type: "bank", color: "from-[#B30000] to-[#5C0000]", text: "BPI", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "Metrobank", name: "Metrobank", type: "bank", color: "from-[#0033A0] to-[#001444]", text: "Metrobank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "PNB", name: "PNB", type: "bank", color: "from-[#004A99] to-[#001D44]", text: "PNB", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "SecurityBank", name: "Security Bank", type: "bank", color: "from-[#005EB8] to-[#002C56]", text: "SecurityBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "UnionBank", name: "UnionBank", type: "bank", color: "from-[#EA5B0C] to-[#8A2E00]", text: "UnionBank", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "RCBC", name: "RCBC", type: "bank", color: "from-[#003DA5] to-[#001444]", text: "RCBC", font: "font-sans font-black tracking-[0.2em]", textStyle: "text-white" },
    { id: "ChinaBank", name: "China Bank", type: "bank", color: "from-[#C8102E] to-[#6E0000]", text: "China Bank", font: "font-serif font-bold", textStyle: "text-white" },
    { id: "EastWest", name: "EastWest Bank", type: "bank", color: "from-[#4B145E] to-[#1F0527]", text: "EastWest", font: "font-sans font-bold tracking-tight", textStyle: "text-white" },
    { id: "LandBank", name: "Land Bank", type: "bank", color: "from-[#005B33] to-[#00281A]", text: "LANDBANK", font: "font-sans font-black tracking-tight", textStyle: "text-white" },
    { id: "PayPal", name: "PayPal", type: "ewallet", color: "from-[#003087] to-[#0067B4]", text: "PayPal", font: "font-sans italic font-bold tracking-tight", textStyle: "text-white" },
];

function walletMeta(id) {
    return WALLET_META.find(w => w.id === id) || { id, name: id, type: "bank", text: id, font: "font-sans font-bold tracking-tight", textStyle: "text-white", color: "from-ink2 to-ink" };
}

// A small, realistic-looking mini "card" for picking which wallet funds a
// hulugan — same brand colors/typography as the real card on the dashboard,
// just shrunk down into a chip you can tap.
function MiniWalletChip({ id, meta, active, onClick }) {
    const showChip = meta.type === "bank" || meta.type === "credit";
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`relative shrink-0 w-[6.5rem] h-[3.75rem] rounded-[12px] bg-gradient-to-br ${meta.color} p-2.5 flex flex-col justify-between overflow-hidden text-left transition-all duration-200 ${
                active ? 'ring-2 ring-peso ring-offset-2 ring-offset-white dark:ring-offset-ink2 shadow-md scale-[1.02]' : 'ring-1 ring-black/5 dark:ring-white/10 opacity-75 hover:opacity-100 shadow-sm'
            }`}
        >
            <span className="absolute -right-4 -top-5 w-14 h-14 bg-white/15 rounded-full blur-md pointer-events-none" />
            {showChip ? (
                <span className="w-4 h-3 rounded-[3px] bg-gradient-to-br from-[#E6D070] to-[#947A26] shadow-inner shrink-0" />
            ) : (
                <span className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
            )}
            <span className={`relative z-10 ${meta.font} text-[12px] leading-none ${meta.textStyle} truncate drop-shadow-sm`}>
                {meta.text}
            </span>
            {active && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center z-10 shadow">
                    <window.Icons.Check size={9} className="text-peso" strokeWidth={3.5} />
                </span>
            )}
        </button>
    );
}

window.InstallmentTracker = function InstallmentTracker({ uid }) {
    const { useState, useEffect } = React;

    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem(`tipid_installments_${uid}`);
        return saved ? JSON.parse(saved) : [];
    });

    // The user's actual configured wallets/cards — the same "wallets" map
    // the dashboard reads from Firestore. This is what populates "Bayad
    // Gamit" below, so the field always reflects whatever banks/e-wallets
    // the user has already set up, instead of a generic hardcoded list.
    const [walletIds, setWalletIds] = useState(["Cash"]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (window.FirestoreAPI && window.db) {
                    const { doc, getDoc } = window.FirestoreAPI;
                    const snap = await getDoc(doc(window.db, "users", uid));
                    if (!cancelled && snap.exists() && snap.data().wallets) {
                        const ids = Object.keys(snap.data().wallets);
                        setWalletIds(ids.includes("Cash") ? ids : ["Cash", ...ids]);
                    }
                }
            } catch (err) {
                // Keep the Cash-only fallback — this field is a convenience
                // tag on the hulugan, the rest of the tracker doesn't depend on it.
            }
        })();
        return () => { cancelled = true; };
    }, [uid]);

    const [name, setName] = useState("");
    const [platform, setPlatform] = useState("SPayLater");
    const [srp, setSrp] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [terms, setTerms] = useState("");
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    // If the previously-picked method disappears (or on first load once
    // wallets arrive), fall back to the first available one.
    useEffect(() => {
        if (!walletIds.includes(paymentMethod)) setPaymentMethod(walletIds[0] || "Cash");
    }, [walletIds]);

    useEffect(() => {
        localStorage.setItem(`tipid_installments_${uid}`, JSON.stringify(items));
    }, [items, uid]);

    const platforms = ["SPayLater", "LazPayLater", "Home Credit", "Billease", "Motorcycle", "Iba pa"];

    const handleAdd = (e) => {
        e.preventDefault();
        const amt = parseFloat(totalAmount);
        const t = parseInt(terms);
        const srpVal = srp.trim() === "" ? null : parseFloat(srp);

        if (!name.trim() || isNaN(amt) || amt <= 0 || isNaN(t) || t <= 0) {
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Kumpletuhin ang detalye ng hulugan.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        if (srpVal !== null && (isNaN(srpVal) || srpVal <= 0)) {
            return Swal.fire({ icon: 'warning', title: 'Mali ang Presyo', text: 'Paki-check ang cash price ng item.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        const newItem = {
            id: Date.now().toString(),
            name: name.trim(),
            platform,
            paymentMethod,          // which card/e-wallet actually funds the monthly payment
            srp: srpVal,            // original cash price, optional — used to surface markup/interest
            totalAmount: amt,       // total amount actually being paid (post-markup)
            terms: t,
            paidMonths: 0,
            monthly: amt / t,
            startDate,              // date of first payment / purchase date — drives due date math
        };

        setItems([newItem, ...items]);
        setName("");
        setSrp("");
        setTotalAmount("");
        setTerms("");
        setStartDate(new Date().toISOString().split("T")[0]);

        Swal.fire({ icon: 'success', title: 'Naidagdag!', text: 'Nai-log na ang bagong hulugan.', confirmButtonColor: '#1F6F54', timer: 1500, showConfirmButton: false, customClass: { popup: 'tipid-swal' } });
    };

    const handlePay = (id) => {
        setItems(items.map(item => {
            if (item.id === id && item.paidMonths < item.terms) {
                return { ...item, paidMonths: item.paidMonths + 1 };
            }
            return item;
        }));
        Swal.fire({
            icon: 'success',
            title: 'Nice!',
            text: 'Nabawasan na ang hulugan mo. Lapit na matapos!',
            confirmButtonColor: '#1F6F54',
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'tipid-swal' }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Burahin ito?',
            text: 'Mawawala ang record ng hulugan na ito.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B5483B',
            cancelButtonColor: '#33443A',
            confirmButtonText: 'Oo, burahin',
            cancelButtonText: 'Kanselahin',
            customClass: { popup: 'tipid-swal' },
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                setItems(items.filter(item => item.id !== id));
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* ADD FORM */}
            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 fade-up">
                <div className="flex items-center gap-3 mb-6">
                    <span className="w-10 h-10 rounded-[14px] bg-gold/10 dark:bg-gold/15 text-gold flex items-center justify-center shrink-0">
                        <window.Icons.Plus size={18} />
                    </span>
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">Bagong Hulugan</h3>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">I-track ang progress para gumaan ang pakiramdam</p>
                    </div>
                </div>

                <form onSubmit={handleAdd} className="flex flex-col gap-5">

                    {/* Item + provider */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-mono font-bold text-ink2/45 dark:text-paper/40 uppercase tracking-widest px-1">Ano ang Hinuhulugan</p>
                        <div className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                            <window.Icons.Pencil size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Hal: iPhone 15 Pro, PC Build" className="w-full bg-transparent py-3.5 text-[14px] focus:outline-none text-ink dark:text-paper" />
                        </div>
                        <div className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all relative">
                            <window.Icons.Wallet size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                            <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-transparent py-3.5 text-[14px] focus:outline-none text-ink dark:text-paper appearance-none">
                                {platforms.map(p => <option key={p} value={p} className="bg-paper dark:bg-ink">{p}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-mono font-bold text-ink2/45 dark:text-paper/40 uppercase tracking-widest px-1">Presyo</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                <span className="text-ink2/40 dark:text-paper/40 font-mono text-[15px] shrink-0">₱</span>
                                <input type="number" step="0.01" value={srp} onChange={e => setSrp(e.target.value)} placeholder="Presyo Cash / SRP (opsyonal)" className="w-full bg-transparent py-3.5 text-[14px] font-mono focus:outline-none text-ink dark:text-paper" />
                            </div>
                            <div className="flex-1 flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                <span className="text-ink2/40 dark:text-paper/40 font-mono text-[15px] shrink-0">₱</span>
                                <input type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Kabuuang Babayaran" className="w-full bg-transparent py-3.5 text-[14px] font-mono focus:outline-none text-ink dark:text-paper" />
                            </div>
                        </div>
                        <p className="text-[10.5px] text-ink2/45 dark:text-paper/40 pl-1">Ilagay ang Presyo Cash kung gusto mong makita kung magkano ang dagdag/interest ng hulugan.</p>
                    </div>

                    {/* Terms + start date */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-mono font-bold text-ink2/45 dark:text-paper/40 uppercase tracking-widest px-1">Ilang Buwan at Simula</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                <window.Icons.Calendar size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                                <input type="number" value={terms} onChange={e => setTerms(e.target.value)} placeholder="Ilang Buwan? (Terms)" className="w-full bg-transparent py-3.5 text-[14px] focus:outline-none text-ink dark:text-paper" />
                            </div>
                            <div className="flex-1 flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                                <window.Icons.Calendar size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-transparent py-3.5 text-[14px] font-mono focus:outline-none text-ink dark:text-paper" />
                            </div>
                        </div>
                        <p className="text-[10.5px] text-ink2/45 dark:text-paper/40 pl-1">Petsa ng unang bayad — dito babatayan ang susunod na due date at kung kailan matatapos.</p>
                    </div>

                    {/* Payment method — pulled from the user's actual bank cards / e-wallets */}
                    <div className="flex flex-col gap-3">
                        <style>{`
                            .hulugan-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                            .hulugan-scroll::-webkit-scrollbar { display: none; }
                        `}</style>
                        <p className="text-[10px] font-mono font-bold text-ink2/45 dark:text-paper/40 uppercase tracking-widest px-1">Bayad Gamit</p>
                        <div className="hulugan-scroll flex overflow-x-auto gap-2.5 pb-1 -mx-1 px-1">
                            {walletIds.map(id => {
                                const meta = walletMeta(id);
                                return (
                                    <MiniWalletChip key={id} id={id} meta={meta} active={paymentMethod === id} onClick={() => setPaymentMethod(id)} />
                                );
                            })}
                        </div>
                        <p className="text-[10.5px] text-ink2/45 dark:text-paper/40 pl-1">Ito ang wallet o card na gagamitin mo pambayad ng buwanang hulugan.</p>
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-peso to-pesoLight text-white py-3.5 rounded-[14px] font-semibold text-[14px] shadow-md hover:shadow-lg transition-all active:scale-95 mt-1">
                        I-save ang Hulugan
                    </button>
                </form>
            </div>

            {/* LIST SECTION */}
            <div className="space-y-4 fade-up" style={{ animationDelay: '60ms' }}>
                {items.length === 0 ? (
                    <div className="py-10 text-center flex flex-col items-center bg-white/40 dark:bg-black/10 rounded-2xl">
                        <div className="w-14 h-14 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ink2/30 dark:text-paper/30 mb-3">
                            <window.Icons.Check size={24} />
                        </div>
                        <p className="text-[13px] font-medium text-ink2/50 dark:text-paper/50">Wala kang aktibong hulugan. Congrats!</p>
                    </div>
                ) : (
                    items.map(item => {
                        const pct = (item.paidMonths / item.terms) * 100;
                        const isDone = item.paidMonths >= item.terms;

                        const startD = resolveStartDate(item);
                        const completionDate = addMonths(startD, item.terms);
                        const nextDueDate = isDone ? null : addMonths(startD, item.paidMonths + 1);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isOverdue = !isDone && nextDueDate && nextDueDate < today;

                        // Legacy items saved before this update may still carry a
                        // downpayment value — still honored here so old totals stay
                        // correct, even though new entries no longer collect one.
                        const legacyDownpayment = item.downpayment || 0;
                        const markup = (item.srp !== null && item.srp !== undefined) ? item.totalAmount - item.srp : null;
                        const totalPaidSoFar = legacyDownpayment + (item.paidMonths * item.monthly);
                        const remaining = item.totalAmount - totalPaidSoFar;
                        const method = walletMeta(item.paymentMethod || "Cash");

                        return (
                            <div key={item.id} className={`p-5 rounded-[1.5rem] border transition-all ${isDone ? 'bg-peso/10 dark:bg-pesoLight/10 border-peso/20 opacity-80' : 'bg-white/80 dark:bg-ink2/40 border-line/50 dark:border-white/10 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-ink2/70 dark:text-paper/70">
                                                {item.platform}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-ink2/70 dark:text-paper/70">
                                                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${method.color}`} />
                                                {method.name || method.text}
                                            </span>
                                            {isDone && <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#1F6F54] text-white">Tapos Na!</span>}
                                            {isOverdue && <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#B5483B] text-white">Overdue</span>}
                                        </div>
                                        <h4 className={`text-base font-bold ${isDone ? 'line-through text-ink2/60 dark:text-paper/60' : 'text-ink dark:text-paper'}`}>{item.name}</h4>
                                        <p className="text-xs text-ink2/50 dark:text-paper/50 font-mono mt-0.5">₱{window.peso(item.monthly)} / buwan</p>
                                    </div>
                                    <button onClick={() => handleDelete(item.id)} className="text-ink2/30 hover:text-expense p-1">
                                        <window.Icons.Trash size={16} />
                                    </button>
                                </div>

                                {/* Price breakdown: cash price + markup/interest. Downpayment shown
                                    only for legacy items that still have one on record. */}
                                {(item.srp || legacyDownpayment > 0) && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 text-[11px] font-mono">
                                        {item.srp ? (
                                            <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-lg px-2.5 py-2">
                                                <p className="text-ink2/50 dark:text-paper/45 text-[9.5px] uppercase tracking-wider mb-0.5">Cash Price</p>
                                                <p className="text-ink dark:text-paper font-semibold">₱{window.peso(item.srp)}</p>
                                            </div>
                                        ) : null}
                                        {markup !== null ? (
                                            <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-lg px-2.5 py-2">
                                                <p className="text-ink2/50 dark:text-paper/45 text-[9.5px] uppercase tracking-wider mb-0.5">Dagdag (Interest)</p>
                                                <p className={`font-semibold ${markup > 0 ? 'text-[#B5483B] dark:text-[#F38C80]' : 'text-ink dark:text-paper'}`}>
                                                    {markup > 0 ? '+' : ''}₱{window.peso(markup)}
                                                </p>
                                            </div>
                                        ) : null}
                                        {legacyDownpayment > 0 ? (
                                            <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-lg px-2.5 py-2">
                                                <p className="text-ink2/50 dark:text-paper/45 text-[9.5px] uppercase tracking-wider mb-0.5">Downpayment</p>
                                                <p className="text-ink dark:text-paper font-semibold">₱{window.peso(legacyDownpayment)}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-[11px] font-medium text-ink2/60 dark:text-paper/60 mb-1.5 font-mono">
                                        <span>Paid: {item.paidMonths} / {item.terms} mos</span>
                                        <span>₱{window.peso(item.totalAmount)}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-gold to-peso transition-all duration-700 ease-out rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>

                                {/* Big, hard-to-miss completion callout — this is the whole point of
                                    the tracker: knowing exactly which month/year each hulugan ends. */}
                                <div className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 mb-3 ${isDone ? 'bg-peso/10 dark:bg-pesoLight/10' : 'bg-gold/10 dark:bg-gold/15'}`}>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-peso/15 text-peso dark:bg-pesoLight/20 dark:text-pesoLight' : 'bg-gold/20 text-gold'}`}>
                                            <window.Icons.Calendar size={16} />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[9.5px] font-bold uppercase tracking-widest text-ink2/50 dark:text-paper/45">{isDone ? "Natapos Noong" : "Matatapos Sa"}</p>
                                            <p className="font-display text-[16px] font-bold text-ink dark:text-paper leading-tight truncate">
                                                {completionDate.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                    {!isDone && (
                                        <span className="text-[10.5px] font-mono font-semibold text-ink2/55 dark:text-paper/45 shrink-0 text-right whitespace-nowrap">
                                            {Math.max(item.terms - item.paidMonths, 0)} buwan na lang
                                        </span>
                                    )}
                                </div>

                                {/* Remaining balance + next due date */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-[11px] font-mono text-ink2/60 dark:text-paper/55">
                                    {!isDone && <span>Natitira: <span className="font-semibold text-ink dark:text-paper">₱{window.peso(remaining)}</span></span>}
                                    {!isDone && nextDueDate && (
                                        <span className={isOverdue ? "text-[#B5483B] dark:text-[#F38C80] font-semibold" : ""}>
                                            Susunod na Bayaran: {formatDatePH(nextDueDate)}
                                        </span>
                                    )}
                                </div>

                                {!isDone && (
                                    <button
                                        onClick={() => handlePay(item.id)}
                                        className="w-full py-2.5 bg-black/5 dark:bg-white/5 hover:bg-peso hover:text-white dark:hover:bg-pesoLight text-ink dark:text-paper text-[13px] font-semibold rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
                                    >
                                        <window.Icons.Check size={16} /> Bayad na 1 Buwan
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
