// components/InstallmentTracker.js

window.InstallmentTracker = function InstallmentTracker({ uid }) {
    const { useState, useEffect } = React;

    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem(`tipid_installments_${uid}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [name, setName] = useState("");
    const [platform, setPlatform] = useState("SPayLater");
    const [totalAmount, setTotalAmount] = useState("");
    const [terms, setTerms] = useState("");

    useEffect(() => {
        localStorage.setItem(`tipid_installments_${uid}`, JSON.stringify(items));
    }, [items, uid]);

    const handleAdd = (e) => {
        e.preventDefault();
        const amt = parseFloat(totalAmount);
        const t = parseInt(terms);

        if (!name.trim() || isNaN(amt) || amt <= 0 || isNaN(t) || t <= 0) {
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Kumpletuhin ang detalye ng hulugan.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        const newItem = {
            id: Date.now().toString(),
            name: name.trim(),
            platform,
            totalAmount: amt,
            terms: t,
            paidMonths: 0,
            monthly: amt / t
        };

        setItems([newItem, ...items]);
        setName("");
        setTotalAmount("");
        setTerms("");

        Swal.fire({ icon: 'success', title: 'Naidagdag!', text: 'Nai-log na ang bagong hulugan.', confirmButtonColor: '#1F6F54', timer: 1500, showConfirmButton: false, customClass: { popup: 'tipid-swal' } });
    };

    const handlePay = (id) => {
        setItems(items.map(item => {
            if (item.id === id && item.paidMonths < item.terms) {
                return { ...item, paidMonths: item.paidMonths + 1 };
            }
            return item;
        }));
        // Optional: Trigger SweetAlert to confirm logging this payment to expenses.
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

    const platforms = ["SPayLater", "LazPayLater", "Home Credit", "Billease", "Credit Card", "Motorcycle", "Iba pa"];

    return (
        <div className="space-y-6">
            {/* ADD FORM */}
            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 fade-up">
                <div className="flex items-center gap-3 mb-5">
                    <span className="w-10 h-10 rounded-[14px] bg-gold/10 dark:bg-gold/15 text-gold flex items-center justify-center shrink-0">
                        <window.Icons.Plus size={18} />
                    </span>
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">Bagong Hulugan</h3>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">I-track ang progress para gumaan ang pakiramdam</p>
                    </div>
                </div>

                <form onSubmit={handleAdd} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                        <window.Icons.Pencil size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Hal: iPhone 15 Pro, PC Build" className="w-full bg-transparent py-3.5 text-[14px] focus:outline-none text-ink dark:text-paper" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all relative">
                            <window.Icons.Wallet size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                            <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-transparent py-3.5 text-[14px] focus:outline-none text-ink dark:text-paper appearance-none">
                                {platforms.map(p => <option key={p} value={p} className="bg-paper dark:bg-ink">{p}</option>)}
                            </select>
                        </div>

                        <div className="flex-1 flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                            <span className="text-ink2/40 dark:text-paper/40 font-mono text-[15px] shrink-0">₱</span>
                            <input type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Kabuuang Utang" className="w-full bg-transparent py-3.5 text-[14px] font-mono focus:outline-none text-ink dark:text-paper" />
                        </div>

                        <div className="flex-1 flex items-center gap-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                            <window.Icons.Calendar size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />
                            <input type="number" value={terms} onChange={e => setTerms(e.target.value)} placeholder="Ilang Buwan? (Terms)" className="w-full bg-transparent py-3.5 text-[14px] focus:outline-none text-ink dark:text-paper" />
                        </div>
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

                        return (
                            <div key={item.id} className={`p-5 rounded-[1.5rem] border transition-all ${isDone ? 'bg-peso/10 dark:bg-pesoLight/10 border-peso/20 opacity-80' : 'bg-white/80 dark:bg-ink2/40 border-line/50 dark:border-white/10 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-ink2/70 dark:text-paper/70">
                                                {item.platform}
                                            </span>
                                            {isDone && <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#1F6F54] text-white">Tapos Na!</span>}
                                        </div>
                                        <h4 className={`text-base font-bold ${isDone ? 'line-through text-ink2/60 dark:text-paper/60' : 'text-ink dark:text-paper'}`}>{item.name}</h4>
                                        <p className="text-xs text-ink2/50 dark:text-paper/50 font-mono mt-0.5">₱{window.peso(item.monthly)} / month</p>
                                    </div>
                                    <button onClick={() => handleDelete(item.id)} className="text-ink2/30 hover:text-expense p-1">
                                        <window.Icons.Trash size={16} />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-[11px] font-medium text-ink2/60 dark:text-paper/60 mb-1.5 font-mono">
                                        <span>Paid: {item.paidMonths} / {item.terms} mos</span>
                                        <span>₱{window.peso(item.totalAmount)}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-gold to-peso transition-all duration-700 ease-out rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
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
