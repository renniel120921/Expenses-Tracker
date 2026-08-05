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
        <div className="bg-white/80 dark:bg-ink2/25 backdrop-blur-xl rounded-[1.5rem] border border-line/40 dark:border-line/10 shadow-sm overflow-hidden mb-16 md:mb-0">
            <EntryListStyles />

            <div className="px-6 sm:px-7 py-5 border-b border-line/40 dark:border-line/10 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink dark:text-paper">Kasaysayan</h2>
                <span key={entries.length} className="count-pop font-mono text-xs text-ink2/60 dark:text-paper/60">{entries.length} total</span>
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
                    <Icons.Inbox size={26} />
                    <p className="text-sm">Wala pang naka-log. Simulan sa itaas.</p>
                </div>
            ) : (
                <ul className="list-in max-h-[28rem] overflow-y-auto">
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
