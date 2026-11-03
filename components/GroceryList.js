// components/GroceryList.js

// --- REAL SVG ICONS SUITE ---
const GROCERY_ICONS = {
    Produce: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M11 20A7 7 0 0 1 4 13a1 1 0 0 1 1-1c4 0 8 2 10 6a1 1 0 0 1-1 1c-1 0-2-.2-3-.6" fill="currentColor" fillOpacity="0.18" />
            <path d="M4 13c0-6 4-10 10-10 1 0 5 0 6 1s1 5 1 6c0 6-4 10-10 10" />
        </svg>
    ),
    Meat: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-2-2-5-2-7 0s-2 5 0 7c.2.6-.6 2-2 2-1 0-2 1-2 2s1 2 2 2c2 0 3-1 3.5-2 2 1 4.5 1 6.5-1 2.5-2.5 2.5-6.5 0-9 .6-.2 2-1.5 2-3 0-1-1-2-2-2z" fill="currentColor" fillOpacity="0.18" />
            <circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    ),
    Fish: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2 16s9-15 20-4c-11 11-20-4-20-4z" fill="currentColor" fillOpacity="0.15" />
            <circle cx="18" cy="10" r="1.5" fill="currentColor" stroke="none" />
            <path d="M2 16l4-4-4-4" />
        </svg>
    ),
    Dairy: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M8 2h8v4H8z" />
            <path d="M7 6h10l2 15H5L7 6z" fill="currentColor" fillOpacity="0.15" />
            <line x1="7" y1="12" x2="17" y2="12" strokeWidth="1.5" />
        </svg>
    ),
    Pantry: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="5" y="4" width="14" height="17" rx="3" fill="currentColor" fillOpacity="0.15" />
            <line x1="5" y1="9" x2="19" y2="9" />
            <line x1="5" y1="16" x2="19" y2="16" />
            <line x1="9" y1="2" x2="15" y2="2" />
        </svg>
    ),
    Bakery: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 13c0-4 4-8 9-8s9 4 9 8-4 7-9 7-9-3-9-7z" fill="currentColor" fillOpacity="0.18" />
            <line x1="7" y1="12" x2="9" y2="15" />
            <line x1="11" y1="11" x2="13" y2="15" />
            <line x1="15" y1="12" x2="17" y2="15" />
        </svg>
    ),
    Beverage: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" fill="currentColor" fillOpacity="0.15" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
    ),
    Snacks: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.15" />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
        </svg>
    ),
    Household: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <rect x="4" y="11" width="16" height="11" rx="2" fill="currentColor" fillOpacity="0.15" />
            <circle cx="12" cy="16" r="2" />
        </svg>
    ),
    Cart: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="9" cy="21" r="1" fill="currentColor" />
            <circle cx="20" cy="21" r="1" fill="currentColor" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    ),
    Bag: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 8h12l1 13H5L6 8Z" fill="currentColor" fillOpacity="0.15" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
    ),
    Wallet: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" fill="currentColor" fillOpacity="0.15" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            <circle cx="18" cy="14" r="0.75" fill="currentColor" stroke="none" />
        </svg>
    ),
    Coins: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.15" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="M16.7 13.3a4.5 4.5 0 0 0-3-3.3" />
        </svg>
    ),
    Check: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Plus: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Trash: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Search: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Close: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Tag: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        </svg>
    ),
    Sparkles: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    Loader: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
            <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
    )
};

// --- CATEGORY METADATA DEFINITIONS ---
const GROCERY_CATEGORIES = {
    produce: {
        key: "Produce",
        name: "Fresh Produce",
        sub: "Gulay & Prutas",
        icon: "Produce",
        tone: "text-emerald-600 dark:text-emerald-400",
        bgLight: "bg-emerald-500/10 border-emerald-500/20",
        bgDark: "dark:bg-emerald-400/15 dark:border-emerald-400/25",
        badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
    },
    meat: {
        key: "Meat",
        name: "Meat & Poultry",
        sub: "Karne & Manok",
        icon: "Meat",
        tone: "text-rose-600 dark:text-rose-400",
        bgLight: "bg-rose-500/10 border-rose-500/20",
        bgDark: "dark:bg-rose-400/15 dark:border-rose-400/25",
        badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
    },
    seafood: {
        key: "Seafood",
        name: "Fish & Seafood",
        sub: "Isda & Lamang-Dagat",
        icon: "Fish",
        tone: "text-sky-600 dark:text-sky-400",
        bgLight: "bg-sky-500/10 border-sky-500/20",
        bgDark: "dark:bg-sky-400/15 dark:border-sky-400/25",
        badge: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/40"
    },
    dairy: {
        key: "Dairy",
        name: "Dairy & Eggs",
        sub: "Gatas & Itlog",
        icon: "Dairy",
        tone: "text-amber-600 dark:text-amber-400",
        bgLight: "bg-amber-500/10 border-amber-500/20",
        bgDark: "dark:bg-amber-400/15 dark:border-amber-400/25",
        badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
    },
    pantry: {
        key: "Pantry",
        name: "Pantry Staples",
        sub: "Bigas, Delata & Mantika",
        icon: "Pantry",
        tone: "text-orange-600 dark:text-orange-400",
        bgLight: "bg-orange-500/10 border-orange-500/20",
        bgDark: "dark:bg-orange-400/15 dark:border-orange-400/25",
        badge: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/40"
    },
    bakery: {
        key: "Bakery",
        name: "Bread & Bakery",
        sub: "Tinapay & Pastry",
        icon: "Bakery",
        tone: "text-amber-700 dark:text-amber-300",
        bgLight: "bg-amber-600/10 border-amber-600/20",
        bgDark: "dark:bg-amber-500/15 dark:border-amber-500/25",
        badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/40"
    },
    beverage: {
        key: "Beverages",
        name: "Drinks & Coffee",
        sub: "Kape & Juice",
        icon: "Beverage",
        tone: "text-blue-600 dark:text-blue-400",
        bgLight: "bg-blue-500/10 border-blue-500/20",
        bgDark: "dark:bg-blue-400/15 dark:border-blue-400/25",
        badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40"
    },
    snacks: {
        key: "Snacks",
        name: "Snacks & Treats",
        sub: "Miryenda",
        icon: "Snacks",
        tone: "text-purple-600 dark:text-purple-400",
        bgLight: "bg-purple-500/10 border-purple-500/20",
        bgDark: "dark:bg-purple-400/15 dark:border-purple-400/25",
        badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
    },
    household: {
        key: "Household",
        name: "Household & Cleaning",
        sub: "Sabon & Toiletries",
        icon: "Household",
        tone: "text-teal-600 dark:text-teal-400",
        bgLight: "bg-teal-500/10 border-teal-500/20",
        bgDark: "dark:bg-teal-400/15 dark:border-teal-400/25",
        badge: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/40"
    },
    other: {
        key: "Other",
        name: "General Items",
        sub: "Iba pa",
        icon: "Bag",
        tone: "text-emerald-700 dark:text-emerald-300",
        bgLight: "bg-emerald-500/10 border-emerald-500/20",
        bgDark: "dark:bg-emerald-400/15 dark:border-emerald-400/25",
        badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
    }
};

// --- INTELLIGENT GROCERY RESOLVER ---
function resolveGroceryCategory(name = "", category = "") {
    const raw = `${category || ""} ${name || ""}`.toLowerCase();
    if (raw.includes("gulay") || raw.includes("prutas") || raw.includes("talong") || raw.includes("kamatis") || raw.includes("bawang") || raw.includes("sibuyas") || raw.includes("repolyo") || raw.includes("carrot") || raw.includes("sayote") || raw.includes("saging") || raw.includes("mangga") || raw.includes("apple") || raw.includes("veg") || raw.includes("fruit")) return GROCERY_CATEGORIES.produce;
    if (raw.includes("karne") || raw.includes("manok") || raw.includes("baboy") || raw.includes("baka") || raw.includes("pork") || raw.includes("chicken") || raw.includes("beef") || raw.includes("liempo") || raw.includes("ground") || raw.includes("hotdog") || raw.includes("giniling") || raw.includes("meat")) return GROCERY_CATEGORIES.meat;
    if (raw.includes("isda") || raw.includes("tilapia") || raw.includes("bangus") || raw.includes("hipon") || raw.includes("squid") || raw.includes("pusit") || raw.includes("tuna") || raw.includes("salmon") || raw.includes("fish") || raw.includes("seafood")) return GROCERY_CATEGORIES.seafood;
    if (raw.includes("gatas") || raw.includes("milk") || raw.includes("itlog") || raw.includes("egg") || raw.includes("keso") || raw.includes("cheese") || raw.includes("butter") || raw.includes("yogurt") || raw.includes("dairy")) return GROCERY_CATEGORIES.dairy;
    if (raw.includes("bigas") || raw.includes("rice") || raw.includes("mantika") || raw.includes("oil") || raw.includes("delata") || raw.includes("sardinas") || raw.includes("corned beef") || raw.includes("toyo") || raw.includes("suka") || raw.includes("patis") || raw.includes("sauce") || raw.includes("noodles") || raw.includes("pasta") || raw.includes("asin") || raw.includes("asukal") || raw.includes("pantry")) return GROCERY_CATEGORIES.pantry;
    if (raw.includes("tinapay") || raw.includes("pandesal") || raw.includes("bread") || raw.includes("loaf") || raw.includes("cake") || raw.includes("bakery")) return GROCERY_CATEGORIES.bakery;
    if (raw.includes("kape") || raw.includes("coffee") || raw.includes("juice") || raw.includes("tea") || raw.includes("tubig") || raw.includes("water") || raw.includes("soda") || raw.includes("coke") || raw.includes("drink")) return GROCERY_CATEGORIES.beverage;
    if (raw.includes("tsitsirya") || raw.includes("chips") || raw.includes("biskwit") || raw.includes("biscuit") || raw.includes("chocolate") || raw.includes("candy") || raw.includes("cookie") || raw.includes("snack")) return GROCERY_CATEGORIES.snacks;
    if (raw.includes("sabon") || raw.includes("soap") || raw.includes("detergent") || raw.includes("shampoo") || raw.includes("toothpaste") || raw.includes("tissue") || raw.includes("bleach") || raw.includes("sponge") || raw.includes("clean") || raw.includes("household")) return GROCERY_CATEGORIES.household;
    return GROCERY_CATEGORIES.other;
}

// Quick common grocery staple chips
const QUICK_STAPLES = [
    { name: "Bigas (5kg)", price: "275", category: "Pantry" },
    { name: "Itlog (1 Dozen)", price: "110", category: "Dairy" },
    { name: "Manok / Chicken (1kg)", price: "220", category: "Meat" },
    { name: "Bawang & Sibuyas", price: "80", category: "Produce" },
    { name: "Cooking Oil (1L)", price: "95", category: "Pantry" },
    { name: "Pork Liempo (1kg)", price: "360", category: "Meat" },
    { name: "Fresh Milk (1L)", price: "105", category: "Dairy" },
    { name: "Pandesal / Bread", price: "50", category: "Bakery" },
    { name: "Laundry Detergent", price: "140", category: "Household" },
];

// Budget quick buttons
const QUICK_BUDGETS = [500, 1000, 2000, 3000, 5000];

function CategorySquircle({ meta, size = 42, iconSize = 20 }) {
    const IconComponent = (meta && meta.icon && GROCERY_ICONS[meta.icon]) || GROCERY_ICONS.Bag;
    return (
        <div
            className={`relative shrink-0 rounded-[14px] flex items-center justify-center border shadow-xs transition-transform duration-200 ${(meta && meta.bgLight) || ''} ${(meta && meta.bgDark) || ''} ${(meta && meta.tone) || ''}`}
            style={{ width: size, height: size }}
        >
            <IconComponent size={iconSize} />
        </div>
    );
}

function FieldWrap({ icon, children, className = "" }) {
    return (
        <div className={`flex items-center gap-2.5 bg-white/80 dark:bg-ink2/30 ring-1 ring-black/5 dark:ring-white/10 hover:ring-black/10 dark:hover:ring-white/20 rounded-[14px] px-3.5 focus-within:ring-2 focus-within:ring-peso/50 focus-within:bg-white dark:focus-within:bg-ink transition-all duration-200 shadow-xs ${className}`}>
            {icon}
            {children}
        </div>
    );
}

function AnimatedAmount({ value, className }) {
    const { useState, useEffect, useRef } = React;
    const safeValue = Number.isFinite(value) ? value : 0;
    const [display, setDisplay] = useState(safeValue);
    const prevValue = useRef(safeValue);
    const rafRef = useRef(null);

    useEffect(() => {
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const from = prevValue.current;
        const to = safeValue;

        if (reduceMotion || from === to) {
            setDisplay(to);
            prevValue.current = to;
            return;
        }

        const duration = 500;
        const start = performance.now();
        cancelAnimationFrame(rafRef.current);

        const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 4);
            setDisplay(from + (to - from) * eased);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                prevValue.current = to;
                setDisplay(to);
            }
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [safeValue]);

    return <span className={className}>₱{window.peso(display)}</span>;
}

// --- MAIN GROCERY LIST COMPONENT ---
window.GroceryList = function GroceryList({ uid, onStatsChange }) {
    const { useState, useEffect, useMemo, useRef } = React;

    // Load saved list and budget from LocalStorage
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem(`tipid_grocery_${uid}`);
            return saved ? JSON.parse(saved) : [];
        } catch (_) { return []; }
    });

    const [budget, setBudget] = useState(() => {
        try {
            return window.TipidCore.money(localStorage.getItem(`tipid_grocery_budget_${uid}`) || 0, { allowZero: true });
        } catch (_) { return 0; }
    });

    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("Produce");
    const [filter, setFilter] = useState("all"); // "all", "pending", "checked"
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date"); // "date", "price", "name"
    const [saving, setSaving] = useState(false);

    const inputNameRef = useRef(null);

    // Persist to local storage
    useEffect(() => {
        localStorage.setItem(`tipid_grocery_${uid}`, JSON.stringify(items));
    }, [items, uid]);

    useEffect(() => {
        localStorage.setItem(`tipid_grocery_budget_${uid}`, budget.toString());
    }, [budget, uid]);

    // Computations
    const checkedItems = useMemo(() => items.filter(i => i.isChecked), [items]);
    const pendingItems = useMemo(() => items.filter(i => !i.isChecked), [items]);

    const runningTotal = useMemo(() => {
        if (!window.TipidCore) return 0;
        return window.TipidCore.sumMoney(checkedItems.map(item => item.price));
    }, [checkedItems]);

    const expectedTotal = useMemo(() => {
        if (!window.TipidCore) return 0;
        return window.TipidCore.sumMoney(items.map(item => item.price));
    }, [items]);

    const remaining = budget - runningTotal;
    const isOverBudget = budget > 0 && runningTotal > budget;
    const budgetPct = budget > 0 ? Math.round((runningTotal / budget) * 100) : 0;

    // Notify parent stats listener if provided
    useEffect(() => {
        if (typeof onStatsChange === "function") {
            onStatsChange({
                items,
                budget,
                runningTotal,
                expectedTotal,
                checkedCount: checkedItems.length,
                pendingCount: pendingItems.length,
                isOverBudget,
                remaining
            });
        }
    }, [items, budget, runningTotal, expectedTotal, checkedItems.length, pendingItems.length, isOverBudget, remaining, onStatsChange]);

    const applyStaple = (staple) => {
        setNewItemName(staple.name);
        setNewItemPrice(staple.price);
        setNewItemCategory(staple.category);
        if (inputNameRef.current) inputNameRef.current.focus();
    };

    const addItem = (e) => {
        e.preventDefault();
        let price = 0;
        try {
            price = window.TipidCore.money(newItemPrice || 0, { allowZero: true });
        } catch (_) { price = 0; }

        if (!newItemName.trim()) {
            return Swal.fire({
                icon: 'warning',
                title: 'Item Name Required',
                text: 'Please enter the item name before adding to your shopping checklist.',
                confirmButtonColor: '#1F6F54',
                customClass: { popup: 'tipid-swal' }
            });
        }

        const resolvedMeta = resolveGroceryCategory(newItemName.trim(), newItemCategory);

        const newItem = {
            id: Date.now().toString(),
            name: newItemName.trim(),
            price: price,
            category: resolvedMeta.key,
            isChecked: false,
            createdAt: Date.now()
        };

        setItems([newItem, ...items]);
        setNewItemName("");
        setNewItemPrice("");
    };

    const toggleItem = (id) => {
        setItems(items.map(item => item.id === id ? { ...item, isChecked: !item.isChecked } : item));
    };

    const removeItem = (id) => {
        setItems(items.filter(item => item.id !== id));
    };

    const logToExpenses = async () => {
        if (runningTotal <= 0) {
            return Swal.fire({
                icon: 'warning',
                title: 'Cart is Empty!',
                text: 'You have not checked any items into your cart yet.',
                confirmButtonColor: '#1F6F54',
                customClass: { popup: 'tipid-swal' }
            });
        }

        Swal.fire({
            title: 'Log as Groceries Expense?',
            text: `Record ₱${window.peso(runningTotal)} (${checkedItems.length} checked items) to your financial history under Pagkain (Cash).`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#1F6F54',
            cancelButtonColor: '#2F4037',
            confirmButtonText: 'Log Expense',
            cancelButtonText: 'Cancel',
            customClass: { popup: 'tipid-swal' },
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                setSaving(true);
                try {
                    await window.TipidData.addExpense(uid, {
                        desc: `Grocery Shopping (${checkedItems.length} items)`,
                        amount: runningTotal,
                        category: "Pagkain",
                        method: "Cash",
                        spendType: "need"
                    });

                    // Remove only checked items, retain unbought items for the next trip
                    setItems(items.filter(item => !item.isChecked));
                    setBudget(0);

                    Swal.fire({
                        icon: 'success',
                        title: 'Logged Successfully! 🛒',
                        text: `Deducted ₱${window.peso(runningTotal)} from your wallet balance.`,
                        confirmButtonColor: '#1F6F54',
                        timer: 1800,
                        showConfirmButton: false,
                        customClass: { popup: 'tipid-swal' }
                    });
                } catch (err) {
                    console.error("Log grocery expense error:", err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to record expense. Please try again.',
                        confirmButtonColor: '#B5483B',
                        customClass: { popup: 'tipid-swal' }
                    });
                } finally {
                    setSaving(false);
                }
            }
        });
    };

    const clearAll = () => {
        Swal.fire({
            title: 'Clear Shopping List?',
            text: 'All items on your checklist will be cleared.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B5483B',
            cancelButtonColor: '#2F4037',
            confirmButtonText: 'Yes, clear all',
            cancelButtonText: 'Cancel',
            customClass: { popup: 'tipid-swal' },
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                setItems([]);
                setBudget(0);
            }
        });
    };

    // Filter & Sort
    const displayedItems = useMemo(() => {
        let list = [...items];

        if (filter === "pending") {
            list = list.filter(i => !i.isChecked);
        } else if (filter === "checked") {
            list = list.filter(i => i.isChecked);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(i =>
                (i.name || "").toLowerCase().includes(q) ||
                (i.category || "").toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            if (sortBy === "price") return (b.price || 0) - (a.price || 0);
            if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
            // default date: unchecked items first, then newest
            if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

        return list;
    }, [items, filter, searchQuery, sortBy]);

    return (
        <div className="space-y-6 sm:space-y-8 fade-up">

            {/* --- 3 APPLE HIG SHOPPING BUDGET & PACING CARDS --- */}
            <div className="bg-white/80 dark:bg-ink2/35 backdrop-blur-2xl rounded-[1.85rem] border border-white/90 dark:border-white/10 shadow-ios p-5 sm:p-7 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-peso to-emerald-700" />

                <div className="flex flex-col gap-5 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-peso dark:bg-pesoLight animate-pulse" />
                                <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">
                                    Shopping Budget & Cash Pacing
                                </h3>
                            </div>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50 mt-0.5">
                                Set cash on hand to monitor remaining balance as you drop items in your cart
                            </p>
                        </div>

                        {/* Quick Budget Presets */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {QUICK_BUDGETS.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setBudget(amt)}
                                    className={`tap-scale px-2.5 py-1 rounded-xl text-[11.5px] font-mono font-semibold border transition-all ${
                                        budget === amt
                                            ? "bg-peso text-white border-peso shadow-xs"
                                            : "bg-black/[0.03] dark:bg-white/[0.04] border-black/5 dark:border-white/10 text-ink2/70 dark:text-paper/70 hover:bg-black/[0.06]"
                                    }`}
                                >
                                    ₱{amt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget Input Row */}
                    <div className="flex items-center gap-3 bg-white/90 dark:bg-black/20 ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] px-4 py-3.5 focus-within:ring-2 focus-within:ring-peso/50 transition-all shadow-xs">
                        <span className="text-ink2/50 dark:text-paper/50 font-mono text-xl font-bold shrink-0">₱</span>
                        <input
                            type="number"
                            step="10"
                            value={budget || ""}
                            onChange={(e) => {
                                try { setBudget(window.TipidCore.money(e.target.value || 0, { allowZero: true })); }
                                catch (_) { setBudget(0); }
                            }}
                            placeholder="Set Cash on Hand (e.g. 2,000)"
                            className="w-full bg-transparent font-mono text-2xl font-bold text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25 focus:outline-none"
                        />
                        {budget > 0 && (
                            <button
                                type="button"
                                onClick={() => setBudget(0)}
                                className="text-ink2/40 hover:text-ink dark:text-paper/40 dark:hover:text-paper p-1"
                            >
                                <GROCERY_ICONS.Close size={16} />
                            </button>
                        )}
                    </div>

                    {/* 3 Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">

                        {/* 1. Cash Budget */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-400/10 dark:to-transparent p-4 rounded-2xl border border-amber-500/20 dark:border-amber-400/20">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-amber-600 dark:text-amber-400">
                                    <GROCERY_ICONS.Wallet size={16} />
                                </span>
                                <p className="text-[10px] font-mono uppercase font-semibold text-amber-700/80 dark:text-amber-300/80 tracking-wider">
                                    Cash Budget
                                </p>
                            </div>
                            <AnimatedAmount value={budget} className="font-mono text-xl font-bold text-ink dark:text-paper" />
                        </div>

                        {/* 2. In Cart (Checked) */}
                        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-400/10 dark:to-transparent p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-400/20">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    <GROCERY_ICONS.Cart size={16} />
                                </span>
                                <p className="text-[10px] font-mono uppercase font-semibold text-emerald-700/80 dark:text-emerald-300/80 tracking-wider">
                                    In Cart ({checkedItems.length})
                                </p>
                            </div>
                            <AnimatedAmount value={runningTotal} className={`font-mono text-xl font-bold ${
                                isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-300'
                            }`} />
                        </div>

                        {/* 3. Remaining Balance */}
                        <div className={`p-4 rounded-2xl border transition-colors ${
                            remaining < 0
                                ? 'bg-rose-500/10 border-rose-500/25 dark:bg-rose-500/15'
                                : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10'
                        }`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink2/60 dark:text-paper/60'}>
                                    <GROCERY_ICONS.Coins size={16} />
                                </span>
                                <p className={`text-[10px] font-mono uppercase font-semibold tracking-wider ${
                                    remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink2/60 dark:text-paper/50'
                                }`}>
                                    Remaining Budget
                                </p>
                            </div>
                            <p className={`font-mono text-xl font-bold truncate ${
                                remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink dark:text-paper'
                            }`}>
                                {remaining < 0 ? '-' : ''}₱{window.peso(Math.abs(remaining))}
                            </p>
                        </div>
                    </div>

                    {/* Visual Budget Progress Bar */}
                    {budget > 0 && (
                        <div className="pt-2">
                            <div className="flex items-center justify-between text-[11.5px] font-mono mb-1.5">
                                <span className="text-ink2/60 dark:text-paper/50">Budget Consumed</span>
                                <span className={`font-semibold ${isOverBudget ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-300"}`}>
                                    {budgetPct}% {isOverBudget ? "⚠️ Over Budget!" : "On Track"}
                                </span>
                            </div>
                            <div className="h-2.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                                        isOverBudget
                                            ? "bg-gradient-to-r from-rose-500 to-rose-600"
                                            : budgetPct > 80
                                                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                                : "bg-gradient-to-r from-pesoLight to-peso"
                                    }`}
                                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ADD NEW GROCERY ITEM SECTION --- */}
            <div className="bg-white/80 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.85rem] border border-white/90 dark:border-white/10 shadow-ios p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-pesoLight via-emerald-500 to-peso" />

                <div className="flex items-start justify-between gap-4 mb-5 relative z-10 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-peso/15 to-peso/5 dark:from-pesoLight/20 dark:to-pesoLight/5 border border-peso/20 dark:border-pesoLight/20 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 shadow-xs">
                            <GROCERY_ICONS.Sparkles size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-[1.25rem] font-semibold text-ink dark:text-paper leading-tight">
                                Add Grocery Item
                            </h3>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50">
                                Plan shopping items with estimated prices before heading to the supermarket
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Add Common Staples Chips */}
                <div className="mb-5 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <GROCERY_ICONS.Tag size={13} className="text-ink2/40 dark:text-paper/40" />
                        <span className="text-[11px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/50 tracking-wider">
                            Popular Palengke Staples (Tap to Autofill)
                        </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {QUICK_STAPLES.map((st, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => applyStaple(st)}
                                className="tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/5 dark:border-white/10 text-[12px] font-medium text-ink dark:text-paper transition-all"
                            >
                                <span>{st.name}</span>
                                <span className="font-mono text-[11px] opacity-70">(₱{st.price})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={addItem} className="flex flex-col gap-3.5 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">

                        {/* Item Name */}
                        <div className="sm:col-span-6">
                            <FieldWrap icon={<GROCERY_ICONS.Bag size={17} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="grocery-name" className="sr-only">Item Name</label>
                                <input
                                    id="grocery-name"
                                    ref={inputNameRef}
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Item name (e.g. Pork Liempo, Fresh Milk, Sibuyas)"
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[14.5px] font-medium text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                        {/* Category Dropdown */}
                        <div className="sm:col-span-3">
                            <FieldWrap icon={<GROCERY_ICONS.Tag size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="grocery-category" className="sr-only">Category</label>
                                <select
                                    id="grocery-category"
                                    value={newItemCategory}
                                    onChange={(e) => setNewItemCategory(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[13.5px] font-medium text-ink dark:text-paper focus:outline-none cursor-pointer appearance-none"
                                >
                                    <option value="Produce" className="bg-paper dark:bg-ink">🥬 Fresh Produce</option>
                                    <option value="Meat" className="bg-paper dark:bg-ink">🥩 Meat & Poultry</option>
                                    <option value="Seafood" className="bg-paper dark:bg-ink">🐟 Fish & Seafood</option>
                                    <option value="Dairy" className="bg-paper dark:bg-ink">🥛 Dairy & Eggs</option>
                                    <option value="Pantry" className="bg-paper dark:bg-ink">🥫 Pantry Staples</option>
                                    <option value="Bakery" className="bg-paper dark:bg-ink">🍞 Bread & Bakery</option>
                                    <option value="Beverages" className="bg-paper dark:bg-ink">🧃 Drinks & Coffee</option>
                                    <option value="Snacks" className="bg-paper dark:bg-ink">🍪 Snacks & Treats</option>
                                    <option value="Household" className="bg-paper dark:bg-ink">🧼 Cleaning & Soap</option>
                                    <option value="Other" className="bg-paper dark:bg-ink">📋 General / Other</option>
                                </select>
                            </FieldWrap>
                        </div>

                        {/* Estimated Price */}
                        <div className="sm:col-span-3">
                            <FieldWrap icon={<span className="text-ink2/50 dark:text-paper/50 font-mono text-[16px] font-bold shrink-0">₱</span>}>
                                <label htmlFor="grocery-price" className="sr-only">Estimated Price</label>
                                <input
                                    id="grocery-price"
                                    type="number"
                                    step="0.01"
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-mono font-bold text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                    </div>

                    <div className="flex items-center justify-end mt-1">
                        <button
                            type="submit"
                            aria-label="Add Item to Shopping Checklist"
                            className="tap-scale w-full sm:w-auto bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/25 active:scale-95 text-white font-semibold rounded-[14px] px-7 py-3.5 text-[14px] transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
                        >
                            <GROCERY_ICONS.Plus size={18} strokeWidth={2.5} />
                            <span>Add to List</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* --- SHOPPING CHECKLIST LEDGER --- */}
            <div className="bg-white/80 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.85rem] border border-white/90 dark:border-white/10 shadow-ios overflow-hidden p-6 sm:p-8">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-7 rounded-full bg-peso dark:bg-pesoLight" />
                        <div>
                            <h3 className="font-display text-[1.25rem] font-semibold text-ink dark:text-paper">
                                Shopping Checklist
                            </h3>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50">
                                Estimated Total: <span className="font-mono font-semibold text-ink dark:text-paper">₱{window.peso(expectedTotal)}</span> ({items.length} items planned)
                            </p>
                        </div>
                    </div>

                    {/* Clear Button */}
                    {items.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="tap-scale inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-colors self-start md:self-auto"
                        >
                            <GROCERY_ICONS.Trash size={14} />
                            <span>Clear List</span>
                        </button>
                    )}
                </div>

                {/* Filter Tabs & Search Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">

                    {/* Filter Segmented Control */}
                    <div className="inline-flex p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 gap-1 overflow-x-auto scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                filter === "all"
                                    ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            All ({items.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("pending")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                filter === "pending"
                                    ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            To Buy ({pendingItems.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter("checked")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                filter === "checked"
                                    ? "bg-white dark:bg-ink text-peso dark:text-pesoLight shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-peso dark:hover:text-pesoLight"
                            }`}
                        >
                            In Cart ({checkedItems.length})
                        </button>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-56">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2/40 dark:text-paper/40 pointer-events-none">
                                <GROCERY_ICONS.Search size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search grocery items..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/70 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-[12.5px] text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-peso/50"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink2/40 dark:text-paper/40 hover:text-ink dark:hover:text-paper"
                                >
                                    <GROCERY_ICONS.Close size={12} />
                                </button>
                            )}
                        </div>

                        {/* Sort Selector */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            aria-label="Sort grocery items"
                            className="bg-white/70 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-ink2/70 dark:text-paper/70 focus:outline-none cursor-pointer"
                        >
                            <option value="date">Default</option>
                            <option value="price">Highest Price</option>
                            <option value="name">Name</option>
                        </select>
                    </div>

                </div>

                {/* Items List Content */}
                {displayedItems.length === 0 ? (
                    <div className="py-14 px-4 flex flex-col items-center justify-center gap-3 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                        <div aria-hidden="true" className="w-14 h-14 rounded-2xl bg-paperDim dark:bg-ink2/50 border border-dashed border-line dark:border-white/15 flex items-center justify-center text-ink2/40 dark:text-paper/30">
                            <GROCERY_ICONS.Cart size={26} />
                        </div>
                        <div>
                            <p className="text-[14px] font-semibold text-ink dark:text-paper mb-1">
                                {searchQuery ? "No matching items found" : filter === "checked" ? "No items in cart yet" : "Your grocery list is empty"}
                            </p>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50 max-w-sm">
                                {searchQuery ? "Try clearing your search term to view all grocery items." : "Add fresh produce, meat, dairy, and pantry items above to pace your shopping."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <ul className="space-y-2.5">
                        {displayedItems.map((item) => {
                            const meta = resolveGroceryCategory(item.name, item.category);

                            return (
                                <li
                                    key={item.id}
                                    className={`relative overflow-hidden group flex items-center justify-between gap-3.5 pl-4 pr-3 sm:pl-5 sm:pr-4 py-3.5 rounded-2xl transition-all duration-200 border ${
                                        item.isChecked
                                            ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/20 dark:border-emerald-500/25 opacity-75 hover:opacity-100"
                                            : "bg-white/60 dark:bg-white/[0.03] border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-ink2/60 shadow-xs"
                                    }`}
                                >
                                    {/* Left Accent Bar */}
                                    <div
                                        className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-[55%] w-[3.5px] rounded-full transition-opacity duration-300 ${
                                            item.isChecked ? "bg-emerald-500" : "bg-peso"
                                        } ${item.isChecked ? "opacity-30" : "opacity-80 group-hover:opacity-100"}`}
                                        aria-hidden="true"
                                    />

                                    {/* Main Row Content */}
                                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">

                                        {/* 1-Tap iOS Circular Checkbox */}
                                        <button
                                            type="button"
                                            onClick={() => toggleItem(item.id)}
                                            aria-label={item.isChecked ? `Uncheck ${item.name}` : `Check ${item.name} into cart`}
                                            className={`tap-scale w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
                                                item.isChecked
                                                    ? 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs'
                                                    : 'bg-white/80 dark:bg-transparent border-2 border-black/20 dark:border-white/25 hover:border-peso dark:hover:border-pesoLight'
                                            }`}
                                        >
                                            <GROCERY_ICONS.Check size={14} className={`transition-opacity duration-200 ${item.isChecked ? 'opacity-100' : 'opacity-0'}`} />
                                        </button>

                                        {/* Category Squircle Icon Plate */}
                                        <CategorySquircle meta={meta} size={42} iconSize={20} />

                                        {/* Item Name & Category Badge */}
                                        <div className="min-w-0 pr-1 cursor-pointer" onClick={() => toggleItem(item.id)}>
                                            <p className={`font-semibold text-[14.5px] sm:text-[15.5px] leading-tight truncate transition-colors duration-200 ${
                                                item.isChecked ? "line-through text-ink2/40 dark:text-paper/30" : "text-ink dark:text-paper"
                                            }`}>
                                                {item.name}
                                            </p>

                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${meta.badge}`}>
                                                    {meta.name}
                                                </span>
                                                <span className={`text-[11px] font-medium ${item.isChecked ? "text-emerald-700 dark:text-emerald-300" : "text-ink2/50 dark:text-paper/40"}`}>
                                                    {item.isChecked ? "✓ In Cart" : "To Buy"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Price & Remove Action */}
                                    <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                                        <span className={`font-mono font-bold tabular-nums text-[16px] sm:text-[18px] tracking-tight ${
                                            item.isChecked ? "text-emerald-700 dark:text-emerald-300" : "text-ink dark:text-paper"
                                        }`}>
                                            ₱{window.peso(item.price)}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            aria-label={`Remove ${item.name} from list`}
                                            className="tap-scale p-2 rounded-xl text-ink2/30 hover:text-rose-600 hover:bg-rose-500/10 dark:text-paper/30 dark:hover:text-rose-400 dark:hover:bg-rose-500/20 active:scale-90 transition-colors"
                                        >
                                            <GROCERY_ICONS.Trash size={16} />
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* --- STICKY LOG TO EXPENSES ACTION BAR --- */}
            {runningTotal > 0 && (
                <div className="sticky bottom-[5.5rem] md:bottom-8 z-40 fade-up">
                    <button
                        type="button"
                        onClick={logToExpenses}
                        disabled={saving}
                        className="tap-scale w-full bg-gradient-to-r from-peso to-pesoLight hover:shadow-xl hover:shadow-peso/25 text-white py-4 rounded-[1.35rem] text-[15px] font-bold flex items-center justify-center gap-2.5 shadow-iosLg active:scale-[0.98] transition-all disabled:opacity-70 border border-white/20"
                    >
                        {saving ? <GROCERY_ICONS.Loader size={20} className="spin" /> : <GROCERY_ICONS.Cart size={20} />}
                        <span>Log ₱{window.peso(runningTotal)} ({checkedItems.length} items) as Expense</span>
                    </button>
                </div>
            )}

        </div>
    );
};
