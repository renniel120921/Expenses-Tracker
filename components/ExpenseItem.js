// components/ExpenseItem.js

// Dinagdag natin ang 'entry' sa tinatanggap na properties
function ExpenseItem({ item, entry, uid }) {
    // Babasahin niya ang data kung 'item' man o 'entry' ang ginamit ng parent component
    const data = item || entry;

    // Safety check. Kung parehong walang naipasa, wag i-render para hindi mag-crash.
    if (!data) return null;

    const isIncome = data.type === "income";

    const dateStr = data.createdAt && data.createdAt.toDate
        ? data.createdAt.toDate().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : "Kamakailan";

    const handleDelete = () => {
        // Safety Guard: Pigilan ang error bago pa tumawag sa Firebase
        if (!uid || !data.id) {
            console.error("Missing Data:", { uid, entryId: data?.id });
            return Swal.fire({
                icon: 'error',
                title: 'System Error',
                text: 'Hindi mahanap ang User ID. Paki-refresh ang pahina.',
                confirmButtonColor: '#B5483B',
                customClass: { popup: 'tipid-swal' }
            });
        }

        Swal.fire({
            title: 'Sigurado ka ba?',
            text: `Buburahin mo ang record para sa "${data.desc}" (₱${window.peso(data.amount)}). Hindi na ito maibabalik.`,
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
                window.TipidData.deleteEntry(uid, data.id)
                    .then(() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Nabura na!',
                            text: 'Ang record ay matagumpay na tinanggal sa iyong history.',
                            confirmButtonColor: '#1F6F54',
                            timer: 1500,
                            showConfirmButton: false,
                            customClass: { popup: 'tipid-swal' }
                        });
                    })
                    .catch((err) => {
                        console.error("Delete Error:", err);
                        Swal.fire({
                            icon: 'error',
                            title: 'Oops!',
                            text: 'Hindi mabura ang record. May error sa server.',
                            confirmButtonColor: '#B5483B',
                            customClass: { popup: 'tipid-swal' }
                        });
                    });
            }
        });
    };

    return (
        <li className="list-none flex items-center justify-between gap-3 p-4 sm:p-[1.125rem] bg-white dark:bg-ink2/30 rounded-[1.25rem] border border-line dark:border-white/10 shadow-[0_1px_2px_rgba(21,35,28,0.03)] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_10px_24px_-12px_rgba(21,35,28,0.18)] hover:-translate-y-0.5 group row-in">
            <div className="flex items-center gap-3.5 min-w-0">
                <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border ${
                        isIncome
                            ? 'bg-gradient-to-br from-peso/15 to-pesoLight/5 dark:from-pesoLight/20 dark:to-white/5 border-peso/10 dark:border-white/10 text-peso dark:text-pesoLight'
                            : 'bg-gradient-to-br from-expense/15 to-expense/5 dark:from-expense/25 dark:to-expense/5 border-expense/10 dark:border-expense/20 text-expense'
                    }`}
                >
                    {isIncome ? <Icons.TrendUp size={18} /> : <Icons.TrendDown size={18} />}
                </div>
                <div className="min-w-0">
                    <p className="font-semibold text-ink dark:text-paper text-sm md:text-base truncate">{data.desc}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-mono font-medium tracking-wide px-2 py-0.5 rounded-lg bg-paperDim dark:bg-ink2/50 text-ink2/70 dark:text-paper/60 uppercase ring-1 ring-black/[0.03] dark:ring-white/5">
                            {data.category}
                        </span>
                        <span className="text-[11px] text-ink2/50 dark:text-paper/40">{dateStr}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <span className={`font-mono font-semibold tabular-nums text-sm md:text-base ${isIncome ? 'text-peso dark:text-pesoLight' : 'text-ink dark:text-paper'}`}>
                    {isIncome ? '+' : '-'}₱{window.peso(data.amount)}
                </span>

                <button
                    onClick={handleDelete}
                    aria-label="Burahin ang entry"
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 transition-all duration-200 p-2.5 rounded-full text-ink2/40 hover:text-expense hover:bg-expense/10 dark:text-paper/40 dark:hover:text-expense active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40"
                >
                    <Icons.Trash size={18} />
                </button>
            </div>
        </li>
    );
}
