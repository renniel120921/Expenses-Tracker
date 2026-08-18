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

            /* Subtle hover lift on each row — a no-op if ExpenseItem's root isn't a direct <li> */
            .ledger-scroll > li {
                border-radius: 1rem;
                transition: background-color 0.2s ease;
            }
            .ledger-scroll > li:hover {
                background-color: rgba(31,111,84,0.05);
            }
            html.dark .ledger-scroll > li:hover {
                background-color: rgba(255,255,255,0.04);
            }

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
        <div className="px-6 sm:px-7 py-[1.125rem] flex items-center gap-4 border-b border-line/30 dark:border-line/10 last:border-0">
            <div className="skeleton-shimmer w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
                <div className="skeleton-shimmer h-3 rounded w-2/5" />
                <div className="skeleton-shimmer h-2.5 rounded w-1/4" />
            </div>
            <div className="skeleton-shimmer h-3.5 rounded w-14 shrink-0" />
        </div>
    );
}

function EntryList({ uid, entries, loading }) {
    // Inalis na natin yung "remove" function dito dahil ang
    // mismong ExpenseItem.js na ang nagha-handle ng SweetAlert at Deletion.

    return (
        <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/40 backdrop-blur-xl rounded-[1.75rem] border border-line/40 dark:border-line/10 shadow-[0_16px_32px_-18px_rgba(21,35,28,0.22)] ring-1 ring-ink/[0.03] dark:ring-white/5 mb-24 md:mb-0">
            <EntryListStyles />
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-peso via-pesoLight to-pesoDeep" />

            <div className="px-6 sm:px-7 py-5 border-b border-line/40 dark:border-line/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-peso/15 to-pesoLight/5 dark:from-pesoLight/20 dark:to-white/5 border border-peso/10 dark:border-white/10 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 shadow-inner">
                        <Icons.List size={16} />
                    </span>
                    <div className="min-w-0">
                        <h2 className="font-display text-xl font-semibold text-ink dark:text-paper leading-tight tracking-tight">Kasaysayan</h2>
                        <p className="text-[11px] text-ink2/50 dark:text-paper/40 truncate">Pinakabagong mga transaksyon</p>
                    </div>
                </div>
                <span key={entries ? entries.length : 0} className="count-pop shrink-0 inline-flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums text-peso dark:text-pesoLight bg-peso/10 dark:bg-pesoLight/15 ring-1 ring-peso/10 dark:ring-pesoLight/20 rounded-full px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-peso dark:bg-pesoLight" />
                    {entries ? entries.length : 0} total
                </span>
            </div>

            {loading ? (
                <div>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            ) : (!entries || entries.length === 0) ? (
                <div className="empty-bounce py-16 flex flex-col items-center gap-3.5 text-ink2/50 dark:text-paper/40">
                    <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-paperDim to-paperDim/50 dark:from-ink2/60 dark:to-ink2/20 border border-dashed border-line dark:border-white/10 flex items-center justify-center">
                        <Icons.Inbox size={22} />
                    </span>
                    <p className="text-sm text-center max-w-[220px]">Wala pang naka-log. Simulan sa itaas.</p>
                </div>
            ) : (
                <ul className="ledger-scroll list-in max-h-[30rem] overflow-y-auto px-1.5 sm:px-2 py-1.5 space-y-2">
                    {entries.map((e) => (
                        <ExpenseItem
                            key={e.id}
                            item={e}        // Eksaktong pangalan na hinahanap ng ExpenseItem
                            uid={uid}       // Pinapasa natin para malaman ng Firebase kung kanino buburahin
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
