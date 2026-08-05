// components/ExpenseItem.js

function ExpenseItemStyles() {
    return (
        <style>{`
            @keyframes deleteIconSwap {
                from { opacity: 0; transform: scale(0.7) rotate(-8deg); }
                to   { opacity: 1; transform: scale(1) rotate(0deg); }
            }
            .delete-icon-swap { animation: deleteIconSwap 0.2s cubic-bezier(0.34, 1.4, 0.64, 1) both; }

            .row-leaving { transition: opacity 0.3s ease, transform 0.3s ease; }

            @media (prefers-reduced-motion: reduce) {
                .delete-icon-swap { animation: none !important; }
                .row-leaving { transition: none !important; }
            }
        `}</style>
    );
}

function ExpenseItem({ entry, onRemove, isDeleting, index }) {
    // Format the timestamp safely (supports Firestore Timestamp, strings, or numbers)
    const formatDate = (ts) => {
        if (!ts) return "Ngayon lang";
        try {
            let dateObj = ts;
            if (typeof ts.toDate === "function") {
                dateObj = ts.toDate();
            } else if (typeof ts === "string" || typeof ts === "number") {
                dateObj = new Date(ts);
            }
            return dateObj.toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
            });
        } catch (e) {
            return "Ngayon lang";
        }
    };

    // Stagger only the first handful of rows on mount so long lists don't crawl in one by one
    const staggerDelay = typeof index === "number" ? Math.min(index, 8) * 45 : 0;

    // Category-tinted icon chip — reuses the same CATEGORY_COLOR map as the summary/chart cards
    const accentColor = entry.type === "income" ? "#2F8E6C" : (CATEGORY_COLOR[entry.category] || "#33443A");

    return (
        <li
            className={`row-in row-leaving flex items-center justify-between gap-3 px-6 sm:px-7 py-4 group hover:bg-paperDim/30 dark:hover:bg-ink2/30 transition-colors border-b border-line/30 dark:border-line/10 last:border-none ${isDeleting ? "opacity-40 scale-[0.98]" : ""}`}
            style={{ animationDelay: `${staggerDelay}ms` }}
        >
            <ExpenseItemStyles />
            <div className="flex items-center gap-3.5 min-w-0">
                <span
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: accentColor + "1A", color: accentColor }}
                >
                    {entry.type === "income" ? <Icons.TrendUp size={15} /> : <Icons.Category size={13} />}
                </span>
                <div className="min-w-0">
                    <p className="font-medium text-ink dark:text-paper truncate">{entry.desc}</p>
                    <p className="font-mono text-[11px] text-ink2/60 dark:text-paper/50 mt-0.5">
                        {entry.type === "income" ? "Kita" : entry.category} · {entry.method || "Cash"} · {formatDate(entry.createdAt || entry.timestamp)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <span className={`font-mono font-semibold tabular-nums ${entry.type === "income" ? "text-pesoLight" : "text-expense"}`}>
                    {entry.type === "income" ? "+" : "-"}₱{peso(entry.amount)}
                </span>
                <button
                    onClick={() => onRemove(entry.id)}
                    disabled={isDeleting}
                    aria-label="Delete entry"
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-ink2/40 hover:text-expense dark:text-paper/40 dark:hover:text-expense disabled:opacity-100 p-1"
                >
                    <span key={isDeleting ? "loading" : "trash"} className="delete-icon-swap inline-flex">
                        {isDeleting ? <Icons.Loader size={15} className="spin" /> : <Icons.Trash size={15} />}
                    </span>
                </button>
            </div>
        </li>
    );
}
