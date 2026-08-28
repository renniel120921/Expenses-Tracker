// components/ExpenseItem.js

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
            html: `Buburahin mo ang record para sa <b>"${data.desc}"</b> (₱${window.peso(data.amount)}).<br>Hindi na ito maibabalik.`,
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
        <li className="list-none group flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-transparent hover:bg-white/60 dark:hover:bg-white/[0.04] rounded-[1.25rem] transition-all duration-300 row-in">

            {/* Left Side: Icon & Details */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${
                        isIncome
                            ? 'bg-[#E6F3EF] text-[#1F6F54] dark:bg-[#1F6F54]/20 dark:text-[#52C8A1]'
                            : 'bg-[#FAEDE9] text-[#B5483B] dark:bg-[#B5483B]/20 dark:text-[#F38C80]'
                    }`}
                >
                    {isIncome ? <Icons.TrendUp size={20} /> : <Icons.TrendDown size={20} />}
                </div>

                <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-ink dark:text-paper text-sm sm:text-[15px] leading-tight truncate">
                        {data.desc}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[9px] sm:text-[10px] font-mono font-semibold tracking-wide px-2 py-0.5 rounded-md bg-ink/[0.04] dark:bg-white/10 text-ink2/70 dark:text-paper/70 uppercase">
                            {data.category}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-ink2/40 dark:text-paper/40">
                            {dateStr}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Side: Amount & Delete Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-right flex flex-col items-end justify-center">
                    <span className={`font-mono font-bold tabular-nums text-[15px] sm:text-base tracking-tight leading-none ${
                        isIncome ? 'text-[#1F6F54] dark:text-[#52C8A1]' : 'text-ink dark:text-paper'
                    }`}>
                        {isIncome ? '+' : '-'}₱{window.peso(data.amount)}
                    </span>
                </div>

                <button
                    onClick={handleDelete}
                    aria-label="Burahin ang entry"
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 p-2 sm:p-2.5 rounded-full text-ink2/30 hover:text-expense hover:bg-expense/10 dark:text-paper/30 dark:hover:text-[#F38C80] dark:hover:bg-[#B5483B]/20 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 shrink-0"
                >
                    <Icons.Trash size={18} strokeWidth={2.2} />
                </button>
            </div>

        </li>
    );
}
