// components/ExpenseItem.js

function ExpenseItem({ entry, onRemove, isDeleting }) {
    // Format the Firestore timestamp to a readable date
    const formatDate = (ts) => {
        if (!ts) return "Ngayon lang";
        return ts.toDate().toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    };

    return (
        <li className="row-in flex items-center justify-between gap-3 px-6 sm:px-7 py-4 group hover:bg-paperDim/30 transition-colors">
            <div className="min-w-0">
                <p className="font-medium text-ink truncate">{entry.desc}</p>
                <p className="font-mono text-[11px] text-ink2/60 mt-0.5">
                    {entry.type === "income" ? "Kita" : entry.category} · {entry.method || "Cash"} · {formatDate(entry.createdAt)}
                </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <span className={`font-mono ${entry.type === "income" ? "text-peso" : "text-expense"}`}>
                    {entry.type === "income" ? "+" : "-"}₱{peso(entry.amount)}
                </span>
                <button
                    onClick={() => onRemove(entry.id)}
                    disabled={isDeleting}
                    aria-label="Delete entry"
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity text-ink2/40 hover:text-expense disabled:opacity-100"
                >
                    {isDeleting ? <Icons.Loader size={15} className="spin" /> : <Icons.Trash size={15} />}
                </button>
            </div>
        </li>
    );
}
