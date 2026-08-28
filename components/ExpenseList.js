// components/ExpenseList.js

function EntryListStyles() {
    return (
        <style>{`
            @keyframes shimmerSweep {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .skeleton-shimmer {
                background: linear-gradient(90deg, rgba(21,35,28,0.04) 25%, rgba(21,35,28,0.1) 37%, rgba(21,35,28,0.04) 63%);
                background-size: 200% 100%;
                animation: shimmerSweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            html.dark .skeleton-shimmer {
                background: linear-gradient(90deg, rgba(241,244,239,0.04) 25%, rgba(241,244,239,0.08) 37%, rgba(241,244,239,0.04) 63%);
                background-size: 200% 100%;
            }

            @keyframes emptyBounce {
                0%   { opacity: 0; transform: scale(0.9) translateY(10px); }
                60%  { opacity: 1; transform: scale(1.02) translateY(0); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            .empty-bounce { animation: emptyBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

            @keyframes listIn {
                from { opacity: 0; transform: translateY(4px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .list-in { animation: listIn 0.4s ease-out both; }

            /* Modern hover lift for list items */
            .ledger-scroll > li {
                border-radius: 1rem;
                transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                margin-bottom: 0.25rem;
            }
            .ledger-scroll > li:hover {
                background-color: rgba(31,111,84,0.04);
                transform: scale(0.995);
            }
            html.dark .ledger-scroll > li:hover {
                background-color: rgba(255,255,255,0.03);
            }

            /* Sleek, hidden-until-hover scrollbar */
            .ledger-scroll::-webkit-scrollbar { width: 4px; }
            .ledger-scroll::-webkit-scrollbar-track { background: transparent; }
            .ledger-scroll::-webkit-scrollbar-thumb { background-color: rgba(31,111,84,0.15); border-radius: 999px; }
            .ledger-scroll:hover::-webkit-scrollbar-thumb { background-color: rgba(31,111,84,0.3); }
            .ledger-scroll { scrollbar-width: thin; scrollbar-color: rgba(31,111,84,0.2) transparent; }
            html.dark .ledger-scroll::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); }
            html.dark .ledger-scroll:hover::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); }

            @media (prefers-reduced-motion: reduce) {
                .skeleton-shimmer, .empty-bounce, .list-in {
                    animation: none !important;
                }
            }
        `}</style>
    );
}

function SkeletonRow() {
    return (
        <div className="px-5 sm:px-6 py-4 flex items-center gap-4 border-b border-line/20 dark:border-white/5 last:border-0">
            {/* Icon Skeleton */}
            <div className="skeleton-shimmer w-[2.85rem] h-[2.85rem] rounded-[14px] shrink-0" />

            {/* Text Skeleton */}
            <div className="flex-1 min-w-0 space-y-2.5">
                <div className="skeleton-shimmer h-3.5 rounded-full w-3/5 max-w-[160px]" />
                <div className="skeleton-shimmer h-2.5 rounded-full w-2/5 max-w-[100px]" />
            </div>

            {/* Amount Skeleton */}
            <div className="skeleton-shimmer h-4 rounded-full w-16 sm:w-20 shrink-0" />
        </div>
    );
}

function EntryList({ uid, entries, loading }) {
    // Inalis na natin yung "remove" function dito dahil ang
    // mismong ExpenseItem.js na ang nagha-handle ng SweetAlert at Deletion.

    return (
        <div className="relative overflow-hidden bg-white/60 dark:bg-ink2/30 backdrop-blur-2xl rounded-[1.75rem] border border-white/60 dark:border-white/10 shadow-ios">
            <EntryListStyles />

            {/* Subtle top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-peso/80 via-pesoLight/80 to-gold/80" />

            {/* Inner Header - Clean & Minimal */}
            <div className="px-5 sm:px-6 py-4 border-b border-line/30 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-white/5">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0">
                        <Icons.List size={18} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-ink dark:text-paper leading-tight">Mga Transaksyon</h3>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-1">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            ) : (!entries || entries.length === 0) ? (
                <div className="empty-bounce py-16 sm:py-20 flex flex-col items-center justify-center gap-4 text-ink2/50 dark:text-paper/40">
                    <div className="relative flex items-center justify-center w-16 h-16 mb-2">
                        {/* Soft pulsing ring behind the icon */}
                        <div className="absolute inset-0 bg-peso/10 dark:bg-pesoLight/10 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                        <span className="relative z-10 w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-paperDim to-paperDim/50 dark:from-ink2/60 dark:to-ink2/20 border border-dashed border-line dark:border-white/15 flex items-center justify-center shadow-sm">
                            <Icons.Inbox size={26} className="text-peso/60 dark:text-pesoLight/60" />
                        </span>
                    </div>
                    <p className="text-[13px] font-medium text-center max-w-[220px] leading-relaxed">
                        Wala pang transaksyon.<br/>Magdagdag ng gastos para makita ito dito.
                    </p>
                </div>
            ) : (
                <ul className="ledger-scroll list-in max-h-[32rem] overflow-y-auto px-2 py-2">
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
