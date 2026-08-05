// components/BillsCenter.js

function BillsCenter({ uid, bills = [], loading }) {
    const { useState, useEffect } = React;
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [category, setCategory] = useState("Bills");
    const [saving, setSaving] = useState(false);

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
                <div className="bg-white/90 dark:bg-ink2/30 backdrop-blur-xl p-5 rounded-3xl border border-line/50 dark:border-white/10 shadow-sm">
                    <p className="text-xs font-mono uppercase tracking-wider text-ink2/60 dark:text-paper/50 mb-1">Total na Babayaran</p>
                    <p className="font-display text-2xl font-semibold text-ink dark:text-paper">₱{window.peso(totalUnpaid)}</p>
                </div>
                <div className="bg-white/90 dark:bg-ink2/30 backdrop-blur-xl p-5 rounded-3xl border border-line/50 dark:border-white/10 shadow-sm">
                    <p className="text-xs font-mono uppercase tracking-wider text-expense mb-1">Overdue Bills</p>
                    <p className="font-display text-2xl font-semibold text-expense">{overdueCount} <span className="text-sm font-body font-normal">mga bill</span></p>
                </div>
                <div className="bg-white/90 dark:bg-ink2/30 backdrop-blur-xl p-5 rounded-3xl border border-line/50 dark:border-white/10 shadow-sm">
                    <p className="text-xs font-mono uppercase tracking-wider text-peso dark:text-pesoLight mb-1">Bayad na (Paid)</p>
                    <p className="font-display text-2xl font-semibold text-peso dark:text-pesoLight">{paidCount} <span className="text-sm font-body font-normal">naitala</span></p>
                </div>
            </div>

            {/* Add Bill Form with Native Date Picker */}
            <div className="bg-white/90 dark:bg-ink2/30 backdrop-blur-xl rounded-3xl border border-line/50 dark:border-white/10 shadow-sm p-6">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink dark:text-paper">Magdagdag ng Bill</h3>
                <form onSubmit={handleAddBill} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                        type="text"
                        placeholder="Pangalan ng Bill (e.g. Kuryente)"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-peso font-medium text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                    />
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Halaga (₱)"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-peso font-medium text-ink dark:text-paper placeholder-ink2/40 dark:placeholder-paper/30"
                    />
                    {/* Hito ang Calendar Picker (Native HTML5 Date Input) */}
                    <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-peso font-medium text-ink dark:text-paper"
                    />
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="bg-paper/50 dark:bg-ink2/40 border border-line dark:border-ink2/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-peso text-ink dark:text-paper"
                    >
                        <option value="Bills">Bills</option>
                        <option value="Kuryente">Kuryente</option>
                        <option value="Tubig">Tubig</option>
                        <option value="Internet">Internet</option>
                        <option value="Rent / Bahay">Rent / Bahay</option>
                        <option value="Iba pa">Iba pa</option>
                    </select>
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-peso hover:bg-pesoLight active:scale-95 text-paper font-semibold rounded-xl px-4 py-3 text-sm transition-all shadow-md shadow-peso/20 flex items-center justify-center gap-2"
                    >
                        {saving ? "Sine-save..." : "I-save ang Bill"}
                    </button>
                </form>
            </div>

            {/* Bills List */}
            <div className="bg-white/90 dark:bg-ink2/30 backdrop-blur-xl rounded-3xl border border-line/50 dark:border-white/10 shadow-sm overflow-hidden p-6">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink dark:text-paper">Listahan ng mga Bills</h3>

                {loading ? (
                    <p className="text-sm text-ink2/50 text-py-8 text-center">Naglo-load ng bills...</p>
                ) : bills.length === 0 ? (
                    <div className="py-12 text-center text-ink2/50 dark:text-paper/40">
                        <p className="text-sm">Wala pang naka-set na bills. Magdagdag sa itaas.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {bills.map(bill => {
                            const isPaid = bill.status === "Paid";
                            const isOverdue = bill.status === "Overdue";
                            return (
                                <div key={bill.id} className="flex items-center justify-between p-4 bg-paper/40 dark:bg-ink2/40 rounded-2xl border border-line/40 dark:border-white/5 transition-all">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleStatus(bill)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                isPaid ? 'bg-peso border-peso text-white' : 'border-line dark:border-paper/40'
                                            }`}
                                            title="Mark as Paid"
                                        >
                                            {isPaid && <span className="text-xs font-bold">✓</span>}
                                        </button>
                                        <div>
                                            <p className={`font-semibold text-sm md:text-base ${isPaid ? 'line-through text-ink2/50 dark:text-paper/40' : 'text-ink dark:text-paper'}`}>
                                                {bill.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-paperDim dark:bg-ink2/50 uppercase text-ink2/70 dark:text-paper/60">
                                                    {bill.category}
                                                </span>
                                                <span className="text-[11px] font-mono text-ink2/60 dark:text-paper/50">
                                                    Due: {bill.dueDate}
                                                </span>
                                                {isOverdue && !isPaid && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-expense/10 text-expense uppercase">
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-semibold text-sm md:text-base text-ink dark:text-paper">
                                            ₱{window.peso(bill.amount)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(bill.id)}
                                            className="text-ink2/40 hover:text-expense transition-colors p-1"
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
}
