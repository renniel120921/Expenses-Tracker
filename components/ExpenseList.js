// components/ExpenseList.js

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
        <div className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden mb-16 md:mb-0">
            <div className="px-6 sm:px-7 py-5 border-b border-line flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">Kasaysayan</h2>
                <span className="font-mono text-xs text-ink2/60">{entries.length} total</span>
            </div>

            {loading ? (
                <div className="py-16 flex justify-center">
                    <Icons.Loader size={20} className="spin text-peso" />
                </div>
            ) : entries.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-ink2/50">
                    <Icons.Inbox size={26} />
                    <p className="text-sm">Wala pang naka-log. Simulan sa itaas.</p>
                </div>
            ) : (
                <ul className="divide-y divide-line max-h-[28rem] overflow-y-auto">
                    {entries.map(e => (
                        <ExpenseItem
                            key={e.id}
                            entry={e}
                            onRemove={remove}
                            isDeleting={deletingId === e.id}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
