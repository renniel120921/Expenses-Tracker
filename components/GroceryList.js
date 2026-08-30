// components/GroceryList.js

window.GroceryList = function GroceryList({ uid }) {
    const { useState, useEffect, useMemo } = React;

    // Load saved list and budget from LocalStorage specific to this user
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem(`tipid_grocery_${uid}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [budget, setBudget] = useState(() => {
        return parseFloat(localStorage.getItem(`tipid_grocery_budget_${uid}`)) || 0;
    });

    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [saving, setSaving] = useState(false);

    // Save to local storage whenever items or budget change
    useEffect(() => {
        localStorage.setItem(`tipid_grocery_${uid}`, JSON.stringify(items));
    }, [items, uid]);

    useEffect(() => {
        localStorage.setItem(`tipid_grocery_budget_${uid}`, budget.toString());
    }, [budget, uid]);

    // Computations
    const runningTotal = useMemo(() => {
        return items.filter(item => item.isChecked).reduce((sum, item) => sum + item.price, 0);
    }, [items]);

    const expectedTotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.price, 0);
    }, [items]);

    const remaining = budget - runningTotal;
    const isOverBudget = budget > 0 && runningTotal > budget;

    const addItem = (e) => {
        e.preventDefault();
        const price = parseFloat(newItemPrice);

        if (!newItemName.trim() || isNaN(price) || price < 0) {
            return Swal.fire({ icon: 'warning', title: 'Teka muna!', text: 'Ilagay ang pangalan at tamang presyo ng bibilhin.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        const newItem = {
            id: Date.now().toString(),
            name: newItemName.trim(),
            price: price,
            isChecked: false
        };

        setItems([newItem, ...items]);
        setNewItemName("");
        setNewItemPrice("");
    };

    const toggleItem = (id) => {
        setItems(items.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const logToExpenses = async () => {
        if (runningTotal <= 0) {
            return Swal.fire({ icon: 'warning', title: 'Walang Laman!', text: 'Wala ka pang na-check sa listahan mo.', confirmButtonColor: '#1F6F54', customClass: { popup: 'tipid-swal' }});
        }

        Swal.fire({
            title: 'I-log ang Gastos?',
            html: `Idadagdag ang <b>₱${window.peso(runningTotal)}</b> sa iyong history bilang gastos sa <b>Pagkain</b> (Cash).`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1F6F54',
            cancelButtonColor: '#33443A',
            confirmButtonText: 'I-log Na',
            cancelButtonText: 'Kanselahin',
            customClass: { popup: 'tipid-swal' },
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                setSaving(true);
                try {
                    // Log to Firebase using standard parameters
                    await window.TipidData.addExpense(uid, {
                        desc: "Palengke / Grocery",
                        amount: runningTotal,
                        category: "Pagkain",
                        method: "Cash",
                        spendType: "need"
                    });

                    // Remove checked items from the list
                    setItems(items.filter(item => !item.isChecked));
                    setBudget(0);

                    Swal.fire({
                        icon: 'success',
                        title: 'Nai-log na! 🛒',
                        text: `Nawas na ang ₱${window.peso(runningTotal)} sa iyong wallet.`,
                        confirmButtonColor: '#1F6F54',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: { popup: 'tipid-swal' }
                    });
                } catch (err) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Hindi nai-save. Subukan ulit.', confirmButtonColor: '#B5483B', customClass: { popup: 'tipid-swal' }});
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const clearAll = () => {
        Swal.fire({
            title: 'Burahin ang listahan?',
            text: 'Mawawala lahat ng nakasulat sa iyong palengke list.',
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
                setItems([]);
                setBudget(0);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header / Budget Input */}
            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 fade-up">
                <div className="flex flex-col gap-4">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-widest text-ink2/60 dark:text-paper/50">Dala mong Pera (Budget)</label>
                    <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-4 py-3.5 focus-within:ring-2 focus-within:ring-peso/40 transition-all">
                        <span className="text-ink2/40 dark:text-paper/40 font-mono text-[16px] shrink-0">₱</span>
                        <input
                            type="number"
                            value={budget || ""}
                            onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full bg-transparent font-mono text-xl font-bold text-ink dark:text-paper placeholder-ink2/30 dark:placeholder-paper/30 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                            <p className="text-[10px] font-medium text-ink2/60 dark:text-paper/50 mb-1">Nasa Cart (Checked)</p>
                            <p className={`font-mono text-xl font-bold truncate ${isOverBudget ? 'text-expense dark:text-[#F38C80]' : 'text-peso dark:text-pesoLight'}`}>
                                ₱{window.peso(runningTotal)}
                            </p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                            <p className="text-[10px] font-medium text-ink2/60 dark:text-paper/50 mb-1">Natitira sa Dala mo</p>
                            <p className={`font-mono text-xl font-bold truncate ${remaining < 0 ? 'text-expense dark:text-[#F38C80]' : 'text-ink dark:text-paper'}`}>
                                ₱{window.peso(remaining)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios p-5 sm:p-7 fade-up" style={{ animationDelay: '60ms' }}>

                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper">Ang Iyong Listahan</h3>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/50">Est. Total ng lahat: ₱{window.peso(expectedTotal)}</p>
                    </div>
                    {items.length > 0 && (
                        <button onClick={clearAll} className="text-[11px] font-semibold text-expense/80 hover:text-expense px-3 py-1.5 rounded-full bg-expense/10 transition-colors">
                            I-clear
                        </button>
                    )}
                </div>

                <form onSubmit={addItem} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Hal: Baboy 1kg"
                        className="flex-[2] min-w-0 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 py-3 text-[14px] text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-peso/40 transition-all"
                    />
                    <input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="₱ Est."
                        className="flex-1 min-w-0 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 py-3 text-[14px] font-mono text-ink dark:text-paper focus:outline-none focus:ring-2 focus:ring-peso/40 transition-all"
                    />
                    <button type="submit" className="bg-peso text-white w-12 h-[3rem] rounded-[14px] flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-md">
                        <window.Icons.Plus size={18} strokeWidth={2.5} />
                    </button>
                </form>

                {items.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ink2/30 dark:text-paper/30 mb-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        </div>
                        <p className="text-[13px] font-medium text-ink2/50 dark:text-paper/50">Walang laman ang listahan mo.</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {items.map((item) => (
                            <li key={item.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                                item.isChecked
                                    ? 'bg-peso/10 dark:bg-pesoLight/10 border-peso/20 dark:border-pesoLight/20 opacity-80'
                                    : 'bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/5'
                            }`}>
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        item.isChecked ? 'bg-peso border-peso text-white dark:bg-pesoLight dark:border-pesoLight' : 'border-ink2/20 dark:border-paper/20'
                                    }`}
                                >
                                    {item.isChecked && <window.Icons.Check size={14} strokeWidth={3} />}
                                </button>

                                <div className="flex-1 min-w-0" onClick={() => toggleItem(item.id)}>
                                    <p className={`text-[14px] font-semibold truncate transition-all ${item.isChecked ? 'line-through text-ink2/60 dark:text-paper/60' : 'text-ink dark:text-paper'}`}>
                                        {item.name}
                                    </p>
                                </div>

                                <span className={`font-mono text-[14px] font-bold shrink-0 ${item.isChecked ? 'text-ink2/50 dark:text-paper/50' : 'text-ink dark:text-paper'}`}>
                                    ₱{window.peso(item.price)}
                                </span>

                                <button onClick={() => removeItem(item.id)} className="p-1.5 text-ink2/30 dark:text-paper/30 hover:text-expense hover:bg-expense/10 rounded-lg transition-colors ml-1">
                                    <window.Icons.Trash size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Sticky Action Button */}
            {runningTotal > 0 && (
                <div className="sticky bottom-[5.5rem] md:bottom-8 z-40 fade-up" style={{ animationDelay: '120ms' }}>
                    <button
                        onClick={logToExpenses}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/20 text-white py-4 rounded-[1.25rem] text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(31,111,84,0.5)] active:scale-[0.98] transition-all disabled:opacity-70"
                    >
                        {saving ? <window.Icons.Loader size={20} className="spin" /> : <window.Icons.Check size={20} />}
                        I-log ang ₱{window.peso(runningTotal)} bilang Gastos
                    </button>
                </div>
            )}
        </div>
    );
}
