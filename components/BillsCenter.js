// components/BillsCenter.js

// --- REAL SVG ICONS SUITE ---
const REAL_ICONS = {
    Electricity: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.22" />
        </svg>
    ),
    Water: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    Internet: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1.5" fill="currentColor" />
        </svg>
    ),
    Mobile: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
            <line x1="9" y1="5" x2="15" y2="5" strokeWidth="1.5" />
        </svg>
    ),
    Rent: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" fill="currentColor" fillOpacity="0.18" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    CreditCard: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" fillOpacity="0.15" />
            <line x1="2" y1="10" x2="22" y2="10" />
            <rect x="5" y="13" width="3.5" height="2.5" rx="0.5" fill="currentColor" stroke="none" />
            <line x1="12" y1="14" x2="18" y2="14" strokeWidth="1.5" />
        </svg>
    ),
    Streaming: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="4" width="20" height="16" rx="3" fill="currentColor" fillOpacity="0.15" />
            <polygon points="10 8.5 16 12 10 15.5 10 8.5" fill="currentColor" />
        </svg>
    ),
    Insurance: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.18" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2.4" />
        </svg>
    ),
    Government: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="3" y1="21" x2="21" y2="21" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <polyline points="12 3 3 8 21 8 12 3" fill="currentColor" fillOpacity="0.18" />
            <line x1="6" y1="10" x2="6" y2="21" />
            <line x1="10" y1="10" x2="10" y2="21" />
            <line x1="14" y1="10" x2="14" y2="21" />
            <line x1="18" y1="10" x2="18" y2="21" />
        </svg>
    ),
    Education: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="currentColor" fillOpacity="0.18" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
    ),
    Loan: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="6" width="20" height="12" rx="2.5" fill="currentColor" fillOpacity="0.15" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M6 12h.01M18 12h.01" strokeWidth="2.5" />
        </svg>
    ),
    Receipt: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="currentColor" fillOpacity="0.12" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
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
    AlertPulse: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="currentColor" fillOpacity="0.18" />
            <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2.5" />
            <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
    ),
    CheckCircleFilled: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" />
            <path d="m8.5 12 2.5 2.5 5-5" strokeWidth="2.6" />
        </svg>
    ),
    CalendarClock: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2.5" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <circle cx="13" cy="16" r="3" fill="currentColor" fillOpacity="0.2" />
            <polyline points="13 15 13 16 14 16.5" strokeWidth="1.8" />
        </svg>
    ),
    Search: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Pencil: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
    ),
    Trash: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Plus: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Check: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Loader: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
            <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
    ),
    Sparkles: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    Tag: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        </svg>
    ),
    Close: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    ChevronDown: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    Inbox: ({ size = 26, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    )
};

// --- CATEGORY METADATA DEFINITIONS ---
const BILL_CATEGORIES = {
    electricity: {
        key: "Kuryente",
        name: "Electricity",
        sub: "Power & Utilities",
        icon: "Electricity",
        iconTone: "text-amber-600 dark:text-amber-400",
        bgLight: "bg-amber-500/10 border-amber-500/20",
        bgDark: "dark:bg-amber-400/15 dark:border-amber-400/25",
        accent: "#F59E0B",
        badgeBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40"
    },
    water: {
        key: "Tubig",
        name: "Water",
        sub: "Water & Utilities",
        icon: "Water",
        iconTone: "text-sky-600 dark:text-sky-400",
        bgLight: "bg-sky-500/10 border-sky-500/20",
        bgDark: "dark:bg-sky-400/15 dark:border-sky-400/25",
        accent: "#0284C7",
        badgeBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/40"
    },
    internet: {
        key: "Internet",
        name: "Internet & WiFi",
        sub: "Broadband & Fiber",
        icon: "Internet",
        iconTone: "text-indigo-600 dark:text-indigo-400",
        bgLight: "bg-indigo-500/10 border-indigo-500/20",
        bgDark: "dark:bg-indigo-400/15 dark:border-indigo-400/25",
        accent: "#6366F1",
        badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40"
    },
    mobile: {
        key: "Mobile",
        name: "Mobile Postpaid",
        sub: "Cellular & Telco",
        icon: "Mobile",
        iconTone: "text-emerald-600 dark:text-emerald-400",
        bgLight: "bg-emerald-500/10 border-emerald-500/20",
        bgDark: "dark:bg-emerald-400/15 dark:border-emerald-400/25",
        accent: "#10B981",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
    },
    rent: {
        key: "Rent / Bahay",
        name: "Rent / Housing",
        sub: "Property & Dues",
        icon: "Rent",
        iconTone: "text-rose-600 dark:text-rose-400",
        bgLight: "bg-rose-500/10 border-rose-500/20",
        bgDark: "dark:bg-rose-400/15 dark:border-rose-400/25",
        accent: "#E11D48",
        badgeBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
    },
    creditCard: {
        key: "Credit Card",
        name: "Credit Card & BNPL",
        sub: "Banking & Installments",
        icon: "CreditCard",
        iconTone: "text-purple-600 dark:text-purple-400",
        bgLight: "bg-purple-500/10 border-purple-500/20",
        bgDark: "dark:bg-purple-400/15 dark:border-purple-400/25",
        accent: "#9333EA",
        badgeBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40"
    },
    streaming: {
        key: "Subscriptions",
        name: "Subscriptions",
        sub: "Streaming & Media",
        icon: "Streaming",
        iconTone: "text-red-600 dark:text-red-400",
        bgLight: "bg-red-500/10 border-red-500/20",
        bgDark: "dark:bg-red-400/15 dark:border-red-400/25",
        accent: "#EF4444",
        badgeBg: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40"
    },
    insurance: {
        key: "Insurance",
        name: "Insurance & HMO",
        sub: "Protection & Health",
        icon: "Insurance",
        iconTone: "text-teal-600 dark:text-teal-400",
        bgLight: "bg-teal-500/10 border-teal-500/20",
        bgDark: "dark:bg-teal-400/15 dark:border-teal-400/25",
        accent: "#14B8A6",
        badgeBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/40"
    },
    government: {
        key: "Government",
        name: "Government & Tax",
        sub: "SSS, Pag-IBIG & BIR",
        icon: "Government",
        iconTone: "text-amber-700 dark:text-amber-300",
        bgLight: "bg-amber-600/10 border-amber-600/20",
        bgDark: "dark:bg-amber-500/15 dark:border-amber-500/25",
        accent: "#B45309",
        badgeBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/40"
    },
    education: {
        key: "Tuition",
        name: "Tuition & School",
        sub: "Education & Fees",
        icon: "Education",
        iconTone: "text-blue-600 dark:text-blue-400",
        bgLight: "bg-blue-500/10 border-blue-500/20",
        bgDark: "dark:bg-blue-400/15 dark:border-blue-400/25",
        accent: "#2563EB",
        badgeBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40"
    },
    loan: {
        key: "Utang / Loan",
        name: "Loan & Debt",
        sub: "Personal & Bank Loans",
        icon: "Loan",
        iconTone: "text-orange-600 dark:text-orange-400",
        bgLight: "bg-orange-500/10 border-orange-500/20",
        bgDark: "dark:bg-orange-400/15 dark:border-orange-400/25",
        accent: "#F97316",
        badgeBg: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/40"
    },
    bills: {
        key: "Bills",
        name: "Utility / Bills",
        sub: "General Bills",
        icon: "Receipt",
        iconTone: "text-emerald-700 dark:text-emerald-300",
        bgLight: "bg-emerald-500/10 border-emerald-500/20",
        bgDark: "dark:bg-emerald-400/15 dark:border-emerald-400/25",
        accent: "#1F6F54",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
    }
};

// --- INTELLIGENT CATEGORY RESOLVER ---
function resolveCategoryMeta(category, title = "") {
    const raw = `${category || ""} ${title || ""}`.toLowerCase();
    if (raw.includes("kuryente") || raw.includes("electr") || raw.includes("meralco") || raw.includes("power") || raw.includes("ilaw")) return BILL_CATEGORIES.electricity;
    if (raw.includes("tubig") || raw.includes("water") || raw.includes("maynilad") || raw.includes("manila water") || raw.includes("prime water")) return BILL_CATEGORIES.water;
    if (raw.includes("internet") || raw.includes("wifi") || raw.includes("pldt") || raw.includes("converge") || raw.includes("fiber") || raw.includes("broadband")) return BILL_CATEGORIES.internet;
    if (raw.includes("phone") || raw.includes("cell") || raw.includes("mobile") || raw.includes("globe") || raw.includes("smart") || raw.includes("dito") || raw.includes("postpaid")) return BILL_CATEGORIES.mobile;
    if (raw.includes("rent") || raw.includes("bahay") || raw.includes("condo") || raw.includes("apartment") || raw.includes("hoa") || raw.includes("association")) return BILL_CATEGORIES.rent;
    if (raw.includes("credit") || raw.includes("card") || raw.includes("bdo") || raw.includes("bpi") || raw.includes("metrobank") || raw.includes("citi") || raw.includes("spay") || raw.includes("lazpay") || raw.includes("maya credit")) return BILL_CATEGORIES.creditCard;
    if (raw.includes("stream") || raw.includes("netflix") || raw.includes("spotify") || raw.includes("youtube") || raw.includes("disney") || raw.includes("hbo") || raw.includes("apple") || raw.includes("prime video") || raw.includes("subscript")) return BILL_CATEGORIES.streaming;
    if (raw.includes("insurance") || raw.includes("hmo") || raw.includes("philhealth") || raw.includes("sunlife") || raw.includes("pru") || raw.includes("health") || raw.includes("medic")) return BILL_CATEGORIES.insurance;
    if (raw.includes("gov") || raw.includes("sss") || raw.includes("pag-ibig") || raw.includes("pagibig") || raw.includes("bir") || raw.includes("tax")) return BILL_CATEGORIES.government;
    if (raw.includes("tuition") || raw.includes("school") || raw.includes("aral") || raw.includes("college") || raw.includes("educ")) return BILL_CATEGORIES.education;
    if (raw.includes("utang") || raw.includes("loan") || raw.includes("hulog") || raw.includes("motor") || raw.includes("amort")) return BILL_CATEGORIES.loan;
    return BILL_CATEGORIES.bills;
}

// --- QUICK-ADD PRESETS ---
const QUICK_UTILITY_PRESETS = [
    { label: "Meralco", category: "Kuryente", title: "Meralco Electricity", icon: "Electricity", tone: "text-amber-500", defaultAmount: "" },
    { label: "Manila Water", category: "Tubig", title: "Manila Water Bill", icon: "Water", tone: "text-sky-500", defaultAmount: "" },
    { label: "Fiber WiFi", category: "Internet", title: "Home Fiber Internet", icon: "Internet", tone: "text-indigo-500", defaultAmount: "1699" },
    { label: "Postpaid", category: "Mobile", title: "Mobile Postpaid Plan", icon: "Mobile", tone: "text-emerald-500", defaultAmount: "999" },
    { label: "Credit Card", category: "Credit Card", title: "Credit Card Bill", icon: "CreditCard", tone: "text-purple-500", defaultAmount: "" },
    { label: "Netflix", category: "Subscriptions", title: "Netflix Subscription", icon: "Streaming", tone: "text-red-500", defaultAmount: "549" },
    { label: "House Rent", category: "Rent / Bahay", title: "House Rent", icon: "Rent", tone: "text-rose-500", defaultAmount: "" },
    { label: "Health HMO", category: "Insurance", title: "Health Insurance", icon: "Insurance", tone: "text-teal-500", defaultAmount: "" },
];

function CategorySquircle({ meta, size = 44, iconSize = 22 }) {
    const IconComponent = REAL_ICONS[meta.icon] || REAL_ICONS.Receipt;
    return (
        <div
            className={`relative shrink-0 rounded-[14px] flex items-center justify-center border shadow-xs transition-transform duration-200 ${meta.bgLight} ${meta.bgDark} ${meta.iconTone}`}
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

        const duration = 600;
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

function formatDueDate(dateStr) {
    if (!dateStr) return "No date";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDueStatus(bill) {
    if (bill.status === "Paid") {
        return {
            statusKey: "paid",
            label: "Paid",
            tone: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-400/15 dark:border-emerald-400/25",
            dotTone: "bg-emerald-500"
        };
    }
    const bDate = new Date(bill.dueDate);
    if (isNaN(bDate.getTime())) {
        return {
            statusKey: "unknown",
            label: "Scheduled",
            tone: "text-ink2/70 dark:text-paper/70 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10",
            dotTone: "bg-ink2/40"
        };
    }
    bDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((bDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);
        return {
            statusKey: "overdue",
            label: daysAgo === 1 ? "Overdue (Yesterday)" : `Overdue by ${daysAgo}d`,
            tone: "text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/25 dark:bg-rose-400/20 dark:border-rose-400/30",
            dotTone: "bg-rose-500 animate-ping",
            isUrgent: true
        };
    }
    if (diffDays === 0) {
        return {
            statusKey: "today",
            label: "Due Today",
            tone: "text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/25 dark:bg-amber-400/20 dark:border-amber-400/30",
            dotTone: "bg-amber-500 animate-pulse",
            isUrgent: true
        };
    }
    if (diffDays === 1) {
        return {
            statusKey: "tomorrow",
            label: "Due Tomorrow",
            tone: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20 dark:bg-amber-400/15 dark:border-amber-400/25",
            dotTone: "bg-amber-500"
        };
    }
    if (diffDays <= 3) {
        return {
            statusKey: "soon",
            label: `Due in ${diffDays} days`,
            tone: "text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20 dark:bg-teal-400/15 dark:border-teal-400/25",
            dotTone: "bg-teal-500"
        };
    }
    return {
        statusKey: "upcoming",
        label: `In ${diffDays} days`,
        tone: "text-ink2/70 dark:text-paper/70 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10",
        dotTone: "bg-ink2/40"
    };
}

// --- MAIN BILLS CENTER COMPONENT ---
window.BillsCenter = function BillsCenter({ uid, bills = [], loading }) {
    const { useState, useEffect, useMemo } = React;
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [category, setCategory] = useState("Kuryente");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("all"); // "all", "upcoming", "overdue", "paid"
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("dueDate"); // "dueDate", "amount", "title"

    // --- CALCULATIONS ---
    const totalUnpaid = useMemo(() => {
        if (!window.TipidCore) return 0;
        const unpaidBills = bills.filter(b => b.status === "Unpaid" || b.status === "Overdue");
        return window.TipidCore.sumMoney(unpaidBills.map(b => b.amount));
    }, [bills]);

    const totalOverdue = useMemo(() => {
        if (!window.TipidCore) return 0;
        const overdueBills = bills.filter(b => b.status === "Overdue");
        return window.TipidCore.sumMoney(overdueBills.map(b => b.amount));
    }, [bills]);

    const totalPaid = useMemo(() => {
        if (!window.TipidCore) return 0;
        const paidBills = bills.filter(b => b.status === "Paid");
        return window.TipidCore.sumMoney(paidBills.map(b => b.amount));
    }, [bills]);

    const overdueCount = bills.filter(b => b.status === "Overdue").length;
    const paidCount = bills.filter(b => b.status === "Paid").length;
    const unpaidCount = bills.filter(b => b.status === "Unpaid").length;
    const paidPct = bills.length > 0 ? Math.round((paidCount / bills.length) * 100) : 0;

    // --- NOTIFICATIONS: EXACT DATE CHECK ---
    useEffect(() => {
        if (!loading && bills.length > 0) {
            const notificationKey = window.TipidCore ? window.TipidCore.storageKey(uid, 'bills_notified') : `tipid_${uid}_bills_notified`;
            const hasNotified = sessionStorage.getItem(notificationKey);
            if (hasNotified) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = [];
            const overdue = [];

            bills.forEach(bill => {
                if (bill.status === "Paid") return;
                const bDate = new Date(bill.dueDate);
                bDate.setHours(0, 0, 0, 0);
                const diffDays = Math.round((bDate - today) / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    overdue.push({ ...bill, diffDays });
                } else if (diffDays >= 0 && diffDays <= 3) {
                    upcoming.push({ ...bill, diffDays });
                }
            });

            if (overdue.length > 0 || upcoming.length > 0) {
                const lines = [];
                if (overdue.length) {
                    lines.push("⚠️ Overdue Bills:", ...overdue.map(b => `• ${b.title} — ₱${window.peso(b.amount)}`));
                }
                if (upcoming.length) {
                    if (lines.length) lines.push("");
                    lines.push("📅 Upcoming Due Dates (Next 3 Days):", ...upcoming.map(b => {
                        const dayLabel = b.diffDays === 0 ? "Due today" : b.diffDays === 1 ? "Due tomorrow" : `Due in ${b.diffDays} days`;
                        return `• ${b.title} — ₱${window.peso(b.amount)} (${dayLabel})`;
                    }));
                }

                Swal.fire({
                    title: 'Bills Reminders',
                    text: lines.join("\n"),
                    confirmButtonText: 'Understood',
                    confirmButtonColor: '#1F6F54',
                    customClass: { popup: 'tipid-swal' }
                });

                sessionStorage.setItem(notificationKey, 'true');
            }
        }
    }, [bills, loading, uid]);

    // Quick preset click handler
    const applyPreset = (preset) => {
        setTitle(preset.title);
        setCategory(preset.category);
        if (preset.defaultAmount) {
            setAmount(preset.defaultAmount);
        }
        // Auto focus amount input if empty
        const amountEl = document.getElementById("bill-amount");
        if (amountEl) {
            amountEl.focus();
        }
    };

    const handleAddBill = async (e) => {
        e.preventDefault();
        if (!title.trim() || !amount || !dueDate) {
            return Swal.fire({
                icon: 'warning',
                title: 'Incomplete Details',
                text: 'Please provide a bill title, amount, and due date.',
                confirmButtonColor: '#1F6F54',
                customClass: { popup: 'tipid-swal' }
            });
        }

        setSaving(true);
        try {
            await window.TipidData.addBill(uid, {
                title: title.trim(),
                amount: parseFloat(amount),
                dueDate,
                category,
                notes: notes.trim()
            });

            setTitle("");
            setAmount("");
            setDueDate("");
            setNotes("");

            Swal.fire({
                icon: 'success',
                title: 'Bill Scheduled!',
                text: 'Your recurring obligation has been saved.',
                confirmButtonColor: '#1F6F54',
                timer: 1600,
                showConfirmButton: false,
                customClass: { popup: 'tipid-swal' }
            });
        } catch (err) {
            console.error("Add bill error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not record bill. Please check inputs and try again.',
                confirmButtonColor: '#B5483B',
                customClass: { popup: 'tipid-swal' }
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (bill) => {
        const nextStatus = bill.status === "Paid" ? "Unpaid" : "Paid";
        try {
            await window.TipidData.updateBillStatus(uid, bill.id, nextStatus);
        } catch (err) {
            console.error("Status update error:", err);
        }
    };

    const handleDelete = async (bill) => {
        Swal.fire({
            title: `Delete ${bill.title}?`,
            text: 'This will remove the bill from your schedule.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#B5483B',
            cancelButtonColor: '#2F4037',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            customClass: { popup: 'tipid-swal' },
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await window.TipidData.deleteBill(uid, bill.id);
                } catch (err) {
                    console.error("Delete error:", err);
                }
            }
        });
    };

    // Filtered & Sorted Bills
    const displayedBills = useMemo(() => {
        let list = [...bills];

        // Filter by tab
        if (activeTab === "upcoming") {
            list = list.filter(b => b.status === "Unpaid");
        } else if (activeTab === "overdue") {
            list = list.filter(b => b.status === "Overdue");
        } else if (activeTab === "paid") {
            list = list.filter(b => b.status === "Paid");
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(b =>
                (b.title || "").toLowerCase().includes(q) ||
                (b.category || "").toLowerCase().includes(q) ||
                (b.notes || "").toLowerCase().includes(q)
            );
        }

        // Sort
        list.sort((a, b) => {
            if (sortBy === "amount") {
                return (b.amount || 0) - (a.amount || 0);
            }
            if (sortBy === "title") {
                return (a.title || "").localeCompare(b.title || "");
            }
            // default: dueDate
            return (a.dueDate || "").localeCompare(b.dueDate || "");
        });

        return list;
    }, [bills, activeTab, searchQuery, sortBy]);

    return (
        <div className="space-y-6 sm:space-y-8 fade-up">

            {/* --- 3 PREMIUM SUMMARY METRIC CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

                {/* 1. Total Outstanding */}
                <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/35 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border border-white/90 dark:border-white/10 shadow-ios transition-all duration-300 hover:-translate-y-1 group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-[14px] bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/20 dark:border-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                                <REAL_ICONS.Wallet size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-amber-700/80 dark:text-amber-300/80">
                                    Total Outstanding
                                </p>
                                <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                    {unpaidCount + overdueCount} bills pending
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-baseline justify-between gap-2">
                        <AnimatedAmount value={totalUnpaid} className="font-mono text-[1.85rem] sm:text-3xl font-bold tracking-tight text-ink dark:text-paper" />
                    </div>
                </div>

                {/* 2. Overdue Bills */}
                <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/35 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border border-white/90 dark:border-white/10 shadow-ios transition-all duration-300 hover:-translate-y-1 group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className={`w-11 h-11 rounded-[14px] border flex items-center justify-center shrink-0 shadow-xs ${
                                overdueCount > 0
                                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-ink2/50 dark:text-paper/40'
                            }`}>
                                <REAL_ICONS.AlertPulse size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-rose-600 dark:text-rose-400">
                                    Overdue Bills
                                </p>
                                <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                    {overdueCount > 0 ? "Immediate action needed" : "All caught up"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-baseline justify-between gap-2">
                        <p className={`font-mono text-[1.85rem] sm:text-3xl font-bold tracking-tight ${
                            overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-ink dark:text-paper'
                        }`}>
                            {overdueCount} <span className="text-[14px] font-body font-medium text-ink2/60 dark:text-paper/50">bills</span>
                        </p>
                        {totalOverdue > 0 && (
                            <span className="font-mono text-[12px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-400/15 px-2 py-0.5 rounded-md">
                                ₱{window.peso(totalOverdue)}
                            </span>
                        )}
                    </div>
                </div>

                {/* 3. Settled / Paid Bills */}
                <div className="relative overflow-hidden bg-white/80 dark:bg-ink2/35 backdrop-blur-2xl p-5 sm:p-6 rounded-[1.75rem] border border-white/90 dark:border-white/10 shadow-ios transition-all duration-300 hover:-translate-y-1 group">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-peso to-emerald-700" />
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-peso/10 rounded-full blur-2xl group-hover:bg-peso/20 transition-colors pointer-events-none" />

                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                            <span className="w-11 h-11 rounded-[14px] bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-500/20 dark:border-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                                <REAL_ICONS.CheckCircleFilled size={20} />
                            </span>
                            <div>
                                <p className="text-[10px] sm:text-[11px] font-mono uppercase font-semibold tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                                    Settled Bills
                                </p>
                                <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                    {paidPct}% completed
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-baseline justify-between gap-2">
                        <p className="font-mono text-[1.85rem] sm:text-3xl font-bold tracking-tight text-peso dark:text-pesoLight">
                            {paidCount} <span className="text-[14px] font-body font-medium text-ink2/60 dark:text-paper/50">paid</span>
                        </p>
                        {totalPaid > 0 && (
                            <span className="font-mono text-[12px] font-semibold text-peso dark:text-pesoLight bg-peso/10 dark:bg-pesoLight/15 px-2 py-0.5 rounded-md">
                                ₱{window.peso(totalPaid)}
                            </span>
                        )}
                    </div>
                </div>

            </div>

            {/* --- SCHEDULE NEW BILL SECTION --- */}
            <div className="bg-white/80 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.85rem] border border-white/90 dark:border-white/10 shadow-ios p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-pesoLight via-emerald-500 to-peso" />

                <div className="flex items-start justify-between gap-4 mb-6 relative z-10 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-peso/15 to-peso/5 dark:from-pesoLight/20 dark:to-pesoLight/5 border border-peso/20 dark:border-pesoLight/20 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 shadow-xs">
                            <REAL_ICONS.Sparkles size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-[1.25rem] font-semibold text-ink dark:text-paper leading-tight">
                                Schedule a Bill
                            </h3>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50">
                                Keep track of upcoming utilities, recurring subscriptions, and dues
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick utility pickers */}
                <div className="mb-6 relative z-10">
                    <div className="flex items-center gap-2 mb-2.5">
                        <REAL_ICONS.Tag size={13} className="text-ink2/40 dark:text-paper/40" />
                        <span className="text-[11px] font-mono uppercase font-semibold text-ink2/50 dark:text-paper/50 tracking-wider">
                            Quick Utility Presets
                        </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {QUICK_UTILITY_PRESETS.map((p, idx) => {
                            const PresetIcon = REAL_ICONS[p.icon] || REAL_ICONS.Receipt;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => applyPreset(p)}
                                    className="tap-scale shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/5 dark:border-white/10 text-[12px] font-medium text-ink dark:text-paper transition-all"
                                >
                                    <span className={p.tone}><PresetIcon size={14} /></span>
                                    <span>{p.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleAddBill} className="flex flex-col gap-3.5 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">

                        {/* Bill Title */}
                        <div className="sm:col-span-7">
                            <FieldWrap icon={<REAL_ICONS.Receipt size={17} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="bill-title" className="sr-only">Bill Title</label>
                                <input
                                    id="bill-title"
                                    type="text"
                                    placeholder="Bill Name (e.g. Meralco, Manila Water, Netflix)"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[14.5px] font-medium text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                        {/* Category Dropdown */}
                        <div className="sm:col-span-5">
                            <FieldWrap icon={<REAL_ICONS.Tag size={17} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="bill-category" className="sr-only">Category</label>
                                <select
                                    id="bill-category"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[14px] font-medium text-ink dark:text-paper focus:outline-none cursor-pointer appearance-none pr-3"
                                >
                                    <option value="Kuryente" className="bg-paper dark:bg-ink dark:text-paper">⚡ Electricity (Kuryente)</option>
                                    <option value="Tubig" className="bg-paper dark:bg-ink dark:text-paper">💧 Water (Tubig)</option>
                                    <option value="Internet" className="bg-paper dark:bg-ink dark:text-paper">🌐 Internet & WiFi</option>
                                    <option value="Mobile" className="bg-paper dark:bg-ink dark:text-paper">📱 Mobile Postpaid</option>
                                    <option value="Rent / Bahay" className="bg-paper dark:bg-ink dark:text-paper">🏠 Rent / Housing</option>
                                    <option value="Credit Card" className="bg-paper dark:bg-ink dark:text-paper">💳 Credit Card & BNPL</option>
                                    <option value="Subscriptions" className="bg-paper dark:bg-ink dark:text-paper">🍿 Subscriptions & Media</option>
                                    <option value="Insurance" className="bg-paper dark:bg-ink dark:text-paper">🛡️ Insurance & HMO</option>
                                    <option value="Government" className="bg-paper dark:bg-ink dark:text-paper">🏛️ Government / Taxes</option>
                                    <option value="Tuition" className="bg-paper dark:bg-ink dark:text-paper">🎓 Tuition & School</option>
                                    <option value="Utang / Loan" className="bg-paper dark:bg-ink dark:text-paper">💵 Loan & Installment</option>
                                    <option value="Bills" className="bg-paper dark:bg-ink dark:text-paper">📋 General Utilities</option>
                                </select>
                                <REAL_ICONS.ChevronDown size={14} className="text-ink2/30 dark:text-paper/30 shrink-0 pointer-events-none" />
                            </FieldWrap>
                        </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">

                        {/* Amount Input */}
                        <div className="sm:col-span-4">
                            <FieldWrap icon={<span className="text-ink2/50 dark:text-paper/50 font-mono text-[16px] font-bold shrink-0">₱</span>}>
                                <label htmlFor="bill-amount" className="sr-only">Amount</label>
                                <input
                                    id="bill-amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[15px] font-mono font-bold text-ink dark:text-paper placeholder:text-ink2/25 dark:placeholder:text-paper/25 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                        {/* Due Date Input */}
                        <div className="sm:col-span-4">
                            <FieldWrap icon={<REAL_ICONS.CalendarClock size={16} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="bill-due-date" className="sr-only">Due Date</label>
                                <input
                                    id="bill-due-date"
                                    type="date"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[13.5px] font-mono font-semibold text-ink dark:text-paper focus:outline-none cursor-pointer"
                                />
                            </FieldWrap>
                        </div>

                        {/* Notes / Reference (Optional) */}
                        <div className="sm:col-span-4">
                            <FieldWrap icon={<REAL_ICONS.Pencil size={15} className="text-ink2/40 dark:text-paper/40 shrink-0" />}>
                                <label htmlFor="bill-notes" className="sr-only">Account or Reference (Optional)</label>
                                <input
                                    id="bill-notes"
                                    type="text"
                                    placeholder="Acct # or Note (optional)"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full min-w-0 bg-transparent py-3.5 text-[13.5px] text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none"
                                />
                            </FieldWrap>
                        </div>

                    </div>

                    <div className="flex items-center justify-end mt-1">
                        <button
                            type="submit"
                            disabled={saving}
                            aria-label={saving ? "Saving bill..." : "Schedule Bill"}
                            className="tap-scale w-full sm:w-auto bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/25 active:scale-95 disabled:opacity-60 text-white font-semibold rounded-[14px] px-7 py-3.5 text-[14px] transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peso/50"
                        >
                            {saving ? <REAL_ICONS.Loader size={18} className="spin" /> : <REAL_ICONS.Plus size={18} />}
                            <span>{saving ? "Saving..." : "Schedule Bill"}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* --- BILLS SCHEDULE & LEDGER --- */}
            <div className="bg-white/80 dark:bg-ink2/40 backdrop-blur-3xl rounded-[1.85rem] border border-white/90 dark:border-white/10 shadow-ios overflow-hidden p-6 sm:p-8">

                {/* Top Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-7 rounded-full bg-peso dark:bg-pesoLight" />
                        <div>
                            <h3 className="font-display text-[1.25rem] font-semibold text-ink dark:text-paper">
                                Bills Schedule
                            </h3>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50">
                                {bills.length} recurring {bills.length === 1 ? 'commitment' : 'commitments'} logged
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar & Settlement Pill */}
                    {!loading && bills.length > 0 && (
                        <div className="flex items-center gap-3">
                            <span className="text-[11.5px] font-mono font-semibold bg-peso/10 dark:bg-pesoLight/15 border border-peso/20 dark:border-pesoLight/20 px-3 py-1.5 rounded-xl text-peso dark:text-pesoLight">
                                {paidCount}/{bills.length} paid ({paidPct}%)
                            </span>
                        </div>
                    )}
                </div>

                {/* Visual Progress Bar */}
                {!loading && bills.length > 0 && (
                    <div className="mb-6 relative">
                        <div
                            role="progressbar"
                            aria-label="Bills completion rate"
                            aria-valuenow={paidPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="h-2.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner"
                        >
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-pesoLight via-emerald-500 to-peso transition-all duration-700 ease-out relative"
                                style={{ width: `${paidPct}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 w-full h-full animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">

                    {/* Filter Segmented Control */}
                    <div className="inline-flex p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 gap-1 overflow-x-auto scrollbar-none">
                        <button
                            type="button"
                            onClick={() => setActiveTab("all")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                activeTab === "all"
                                    ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            All ({bills.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("upcoming")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                activeTab === "upcoming"
                                    ? "bg-white dark:bg-ink text-ink dark:text-paper shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-ink dark:hover:text-paper"
                            }`}
                        >
                            Upcoming ({unpaidCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("overdue")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                activeTab === "overdue"
                                    ? "bg-white dark:bg-ink text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-rose-600 dark:hover:text-rose-400"
                            }`}
                        >
                            Overdue ({overdueCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("paid")}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                activeTab === "paid"
                                    ? "bg-white dark:bg-ink text-peso dark:text-pesoLight shadow-xs font-semibold"
                                    : "text-ink2/60 dark:text-paper/60 hover:text-peso dark:hover:text-pesoLight"
                            }`}
                        >
                            Paid ({paidCount})
                        </button>
                    </div>

                    {/* Search & Sort */}
                    <div className="flex items-center gap-2">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-56">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink2/40 dark:text-paper/40 pointer-events-none">
                                <REAL_ICONS.Search size={14} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search bills..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/70 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-[12.5px] text-ink dark:text-paper placeholder:text-ink2/30 dark:placeholder:text-paper/30 focus:outline-none focus:ring-1 focus:ring-peso/50"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink2/40 dark:text-paper/40 hover:text-ink dark:hover:text-paper"
                                >
                                    <REAL_ICONS.Close size={12} />
                                </button>
                            )}
                        </div>

                        {/* Sort Selector */}
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            aria-label="Sort bills"
                            className="bg-white/70 dark:bg-black/20 border border-black/5 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-ink2/70 dark:text-paper/70 focus:outline-none cursor-pointer"
                        >
                            <option value="dueDate">Due Date</option>
                            <option value="amount">Amount</option>
                            <option value="title">Name</option>
                        </select>
                    </div>

                </div>

                {/* Bills List Content */}
                {loading ? (
                    <div role="status" aria-label="Loading bills" className="py-16 flex flex-col items-center justify-center gap-3 text-ink2/40 dark:text-paper/30">
                        <REAL_ICONS.Loader size={26} className="spin text-peso" />
                        <span className="text-[12px] font-mono">Synchronizing scheduled bills...</span>
                    </div>
                ) : displayedBills.length === 0 ? (
                    <div className="py-14 px-4 flex flex-col items-center justify-center gap-3 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                        <div aria-hidden="true" className="w-14 h-14 rounded-2xl bg-paperDim dark:bg-ink2/50 border border-dashed border-line dark:border-white/15 flex items-center justify-center text-ink2/40 dark:text-paper/30">
                            <REAL_ICONS.Inbox size={26} />
                        </div>
                        <div>
                            <p className="text-[14px] font-semibold text-ink dark:text-paper mb-1">
                                {searchQuery ? "No matching bills found" : activeTab === "overdue" ? "No overdue bills — great job!" : "No bills scheduled in this tab"}
                            </p>
                            <p className="text-[12px] text-ink2/60 dark:text-paper/50 max-w-sm">
                                {searchQuery ? "Try clearing your search term to see all bills." : "Add your electric, water, internet, and credit cards above to stay ahead of deadlines."}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayedBills.map(bill => {
                            const isPaid = bill.status === "Paid";
                            const meta = resolveCategoryMeta(bill.category, bill.title);
                            const dueInfo = getDueStatus(bill);

                            return (
                                <div
                                    key={bill.id}
                                    className={`relative overflow-hidden group flex items-center justify-between gap-3.5 pl-4 pr-3 sm:pl-5 sm:pr-4 py-3.5 rounded-2xl transition-all duration-200 border ${
                                        isPaid
                                            ? 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-75 hover:opacity-100'
                                            : dueInfo.statusKey === 'overdue'
                                                ? 'bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border-rose-500/20 dark:border-rose-500/25 hover:bg-white dark:hover:bg-ink2/60 shadow-xs'
                                                : 'bg-white/60 dark:bg-white/[0.03] border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-ink2/60 shadow-xs'
                                    }`}
                                >
                                    {/* Left Accent Bar */}
                                    <div
                                        className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-[55%] w-[3.5px] rounded-full transition-opacity duration-300 ${
                                            isPaid ? 'bg-emerald-500' : dueInfo.statusKey === 'overdue' ? 'bg-rose-500' : 'bg-peso'
                                        } ${isPaid ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`}
                                        aria-hidden="true"
                                    />

                                    {/* Main Row Content */}
                                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">

                                        {/* 1-Tap iOS Checkbox */}
                                        <button
                                            type="button"
                                            onClick={() => toggleStatus(bill)}
                                            aria-pressed={isPaid}
                                            aria-label={isPaid ? `Mark as unpaid: ${bill.title}` : `Mark as paid: ${bill.title}`}
                                            title={isPaid ? "Mark as unpaid" : "Mark as paid"}
                                            className={`tap-scale w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
                                                isPaid
                                                    ? 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-xs'
                                                    : 'bg-white/80 dark:bg-transparent border-2 border-black/20 dark:border-white/25 hover:border-peso dark:hover:border-pesoLight'
                                            }`}
                                        >
                                            <REAL_ICONS.Check size={14} className={`transition-opacity duration-200 ${isPaid ? 'opacity-100' : 'opacity-0'}`} />
                                        </button>

                                        {/* Category Squircle Icon Plate */}
                                        <CategorySquircle meta={meta} size={42} iconSize={20} />

                                        {/* Bill Details */}
                                        <div className="min-w-0 pr-1">
                                            <p className={`font-semibold text-[14.5px] sm:text-[15.5px] leading-tight truncate transition-colors duration-200 ${
                                                isPaid ? 'line-through text-ink2/40 dark:text-paper/30' : 'text-ink dark:text-paper'
                                            }`}>
                                                {bill.title}
                                            </p>

                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {/* Category Badge */}
                                                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                                                    isPaid
                                                        ? 'bg-black/5 dark:bg-white/5 text-ink2/40 dark:text-paper/30 border-transparent'
                                                        : meta.badgeBg
                                                }`}>
                                                    {meta.name}
                                                </span>

                                                {/* Due Date Badge */}
                                                <span className={`text-[10px] sm:text-[11px] font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${
                                                    isPaid
                                                        ? 'bg-black/5 dark:bg-white/5 text-ink2/40 dark:text-paper/30 border-transparent'
                                                        : dueInfo.tone
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${dueInfo.dotTone}`} />
                                                    <span>{dueInfo.label}</span>
                                                    <span className="opacity-70 font-mono">({formatDueDate(bill.dueDate)})</span>
                                                </span>

                                                {/* Notes if available */}
                                                {bill.notes && (
                                                    <span className="hidden md:inline-block text-[11px] text-ink2/50 dark:text-paper/40 truncate max-w-[200px]" title={bill.notes}>
                                                        • {bill.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Amount & Actions */}
                                    <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                                        <span className={`font-mono font-bold tabular-nums text-[16px] sm:text-[18px] tracking-tight transition-colors duration-200 ${
                                            isPaid ? 'text-ink2/40 dark:text-paper/30 line-through' : 'text-ink dark:text-paper'
                                        }`}>
                                            ₱{window.peso(bill.amount)}
                                        </span>

                                        {/* Delete Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(bill)}
                                            aria-label={`Delete bill: ${bill.title}`}
                                            className="tap-scale p-2 rounded-xl text-ink2/30 hover:text-rose-600 hover:bg-rose-500/10 dark:text-paper/30 dark:hover:text-rose-400 dark:hover:bg-rose-500/20 active:scale-90 transition-colors"
                                        >
                                            <REAL_ICONS.Trash size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>
        </div>
    );
};
