// components/ExpenseItem.js

function ExpenseItem({ item, entry, uid }) {
    // Babasahin niya ang data kung 'item' man o 'entry' ang ginamit ng parent component
    const data = item || entry;

    // Safety check. Kung parehong walang naipasa, wag i-render para hindi mag-crash.
    if (!data) return null;

    const isIncome = data.type === "income";

    // --- Palette tokens (per type) ---
    // Iisang source of truth para consistent lahat ng accent — bar, icon, dot, amount.
    const accent = isIncome
        ? { fg: "text-[#1F6F54] dark:text-[#52C8A1]", bg: "bg-[#1F6F54] dark:bg-[#52C8A1]", tint: "from-[#EAF6F1] to-[#DCEFE7] dark:from-[#1F6F54]/25 dark:to-[#1F6F54]/10" }
        : { fg: "text-[#B5483B] dark:text-[#F38C80]", bg: "bg-[#B5483B] dark:bg-[#F38C80]", tint: "from-[#FCEFEB] to-[#F7DFD8] dark:from-[#B5483B]/25 dark:to-[#B5483B]/10" };

    // Relative date label (Ngayon / Kahapon / short date) instead of laging buong petsa —
    // mas madaling ma-scan sa isang tingin, katulad ng modern banking apps.
    const getDateLabel = (createdAt) => {
        if (!createdAt || !createdAt.toDate) return "Kamakailan";
        const date = createdAt.toDate();
        const now = new Date();
        const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

        if (diffDays === 0) {
            return `Ngayon, ${date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`;
        }
        if (diffDays === 1) return "Kahapon";
        return date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: diffDays > 300 ? "numeric" : undefined
        });
    };

    const dateStr = getDateLabel(data.createdAt);

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
        <li className="relative list-none group flex items-center justify-between gap-3 pl-5 pr-3.5 py-3.5 sm:pl-6 sm:pr-4 sm:py-4 bg-transparent hover:bg-white/60 dark:hover:bg-white/[0.04] rounded-[1.25rem] transition-all duration-300 ease-out hover:shadow-[0_8px_24px_-12px_rgba(20,20,20,0.18)] hover:-translate-y-0.5 active:scale-[0.995] row-in overflow-hidden">

            {/* Scan-bar: colored edge so income/expense is readable at a glance down the list */}
            <div
                className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-[55%] w-[3px] rounded-full transition-opacity duration-300 ${accent.bg} opacity-30 group-hover:opacity-100`}
                aria-hidden="true"
            ></div>

            {/* Left Side: Icon & Details */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${accent.tint} ${accent.fg} ring-1 ring-inset ring-black/[0.03] dark:ring-white/10 transition-transform duration-300 ease-out group-hover:scale-105`}
                >
                    {isIncome ? <Icons.TrendUp size={20} /> : <Icons.TrendDown size={20} />}
                </div>

                <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-ink dark:text-paper text-sm sm:text-[15px] leading-tight truncate">
                        {data.desc}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-semibold tracking-wide px-2.5 py-1 rounded-full bg-ink/[0.04] dark:bg-white/10 text-ink2/70 dark:text-paper/70 uppercase">
                            <span className={`w-1.5 h-1.5 rounded-full ${accent.bg}`} aria-hidden="true"></span>
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
                    <span className={`font-mono font-bold tabular-nums text-base sm:text-lg tracking-tight leading-none ${
                        isIncome ? 'text-[#1F6F54] dark:text-[#52C8A1]' : 'text-ink dark:text-paper'
                    }`}>
                        {isIncome ? '+' : '-'}₱{window.peso(data.amount)}
                    </span>
                </div>

                <button
                    onClick={handleDelete}
                    aria-label="Burahin ang entry"
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 p-2 sm:p-2.5 rounded-full text-ink2/30 hover:text-expense hover:bg-expense/10 hover:scale-105 dark:text-paper/30 dark:hover:text-[#F38C80] dark:hover:bg-[#B5483B]/20 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-expense/40 shrink-0"
                >
                    <Icons.Trash size={18} strokeWidth={2.2} />
                </button>
            </div>

        </li>
    );
}
