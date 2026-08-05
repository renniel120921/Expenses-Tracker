// components/ExpenseList.js

function EntryListStyles() {
    return (
        <style>{`
            @keyframes shimmerSweep { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            .skeleton-shimmer {
                background: linear-gradient(90deg, rgba(21,35,28,0.06) 25%, rgba(21,35,28,0.12) 37%, rgba(21,35,28,0.06) 63%);
                background-size: 200% 100%;
                animation: shimmerSweep 1.4s ease-in-out infinite;
            }
            html.dark .skeleton-shimmer {
                background: linear-gradient(90deg, rgba(241,244,239,0.06) 25%, rgba(241,244,239,0.12) 37%, rgba(241,244,239,0.06) 63%);
                background-size: 200% 100%;
            }

            @keyframes countPop {
                0%   { transform: scale(1); }
                40%  { transform: scale(1.18); }
                100% { transform: scale(1); }
            }
            .count-pop { display: inline-block; animation: countPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

            @keyframes emptyBounce {
                0%   { opacity: 0; transform: scale(0.85) translateY(4px); }
                60%  { opacity: 1; transform: scale(1.05) translateY(0); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            .empty-bounce { animation: emptyBounce 0.5s cubic-bezier(0.34, 1.2, 0.4, 1) both; }

            @keyframes listIn { from { opacity: 0; } to { opacity: 1; } }
            .list-in { animation: listIn 0.35s ease-out both; }

            /* Slim, brand-tinted scrollbar for the entry list */
            .ledger-scroll::-webkit-scrollbar { width: 6px; }
            .ledger-scroll::-webkit-scrollbar-track { background: transparent; }
            .ledger-scroll::-webkit-scrollbar-thumb { background-color: rgba(31,111,84,0.25); border-radius: 999px; }
            .ledger-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(31,111,84,0.45); }
            .ledger-scroll { scrollbar-width: thin; scrollbar-color: rgba(31,111,84,0.3) transparent; }
            html.dark .ledger-scroll::-webkit-scrollbar-thumb { background-color: rgba(47,142,108,0.35); }

            @media (prefers-reduced-motion: reduce) {
                .skeleton-shimmer, .count-pop, .empty-bounce, .list-in {
                    animation: none !important;
                }
            }
        `}</style>
    );
}

function SkeletonRow() {
    return (
        <div className="px-6 sm:px-7 py-4 flex items-center gap-3.5 border-b border-line/30 dark:border-line/10 last:border-0">
            <div className="skeleton-shimmer w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
                <div className="skeleton-shimmer h-3 rounded w-2/5" />
                <div className="skeleton-shimmer h-2.5 rounded w-1/4" />
            </div>
            <div className="skeleton-shimmer h-3.5 rounded w-14 shrink-0" />
        </div>
    );
}

function EntryList({ uid, entries, loading }) {
    const { useState } = React;
    const [deletingId, setDeletingId] = useState(null);

    const remove = async (id) => {
        setDeletingId(id);
        try {
            await window.TipidData.deleteEntry(uid, id);
        } catch (err) {
            console.error("Failed to delete entry:", err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.5rem] border border-line/40 dark:border-line/10 shadow-sm mb-16 md:mb-0">
            <EntryListStyles />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-peso to-pesoDeep" />

            <div className="px-6 sm:px-7 py-5 border-b border-line/40 dark:border-line/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0">
                        <Icons.List size={14} />
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-display text-xl font-semibold text-ink dark:text-paper leading-tight">Kasaysayan</h2>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/40 truncate">Pinakabagong mga transaksyon</p>
                    </div>
                </div>
                <span key={entries.length} className="count-pop shrink-0 font-mono text-xs font-semibold text-peso dark:text-pesoLight bg-peso/10 dark:bg-pesoLight/15 rounded-full px-2.5 py-1">
                    {entries.length} total
                </span>
            </div>

            {loading ? (
                <div>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            ) : entries.length === 0 ? (
                <div className="empty-bounce py-16 flex flex-col items-center gap-3 text-ink2/50 dark:text-paper/40">
                    <span className="w-12 h-12 rounded-full bg-paperDim dark:bg-ink2/40 flex items-center justify-center">
                        <Icons.Inbox size={22} />
                    </span>
                    <p className="text-sm">Wala pang naka-log. Simulan sa itaas.</p>
                </div>
            ) : (
                <ul className="ledger-scroll list-in max-h-[28rem] overflow-y-auto">
                    {entries.map((e, i) => (
                        <ExpenseItem
                            key={e.id}
                            entry={e}
                            index={i}
                            onRemove={remove}
                            isDeleting={deletingId === e.id}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
