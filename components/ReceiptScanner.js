// components/ReceiptScanner.js

// --- REAL SVG ICONS SUITE ---
const SCANNER_ICONS = {
    Scan: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" fillOpacity="0.15" />
            <line x1="7" y1="12" x2="17" y2="12" strokeWidth="1.8" />
        </svg>
    ),
    Camera: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="currentColor" fillOpacity="0.12" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Upload: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    Image: ({ size = 20, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" fillOpacity="0.12" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    Check: ({ size = 18, className = "", strokeWidth = 2.8 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Sparkles: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    Tag: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" fill="currentColor" fillOpacity="0.12" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
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
    Store: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" fill="currentColor" fillOpacity="0.12" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <circle cx="12" cy="7" r="2" />
        </svg>
    ),
    Receipt: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 2v20l3-2 3 2 3-2 3 2 4-2V2l-4 2-3-2-3 2-3-2-3 2Z" fill="currentColor" fillOpacity="0.12" />
            <line x1="8" y1="8" x2="16" y2="8" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="8" y1="16" x2="13" y2="16" />
        </svg>
    ),
    Trash: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Close: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Loader: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
            <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
    ),
    Coins: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.15" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="M16.7 13.3a4.5 4.5 0 0 0-3-3.3" />
        </svg>
    ),
    Clock: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
        </svg>
    ),
    Info: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2.5" />
        </svg>
    ),
    Pencil: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            <path d="m15 5 4 4" />
        </svg>
    ),
    Torch: ({ size = 18, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fillOpacity="0.2" />
        </svg>
    ),
    Zap: ({ size = 16, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Calendar: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    List: ({ size = 15, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" />
            <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" />
            <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" />
        </svg>
    ),
    ChevronDown: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    ChevronUp: ({ size = 14, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polyline points="18 15 12 9 6 15" />
        </svg>
    )
};

// --- PHILIPPINE MERCHANT & CATEGORY INTELLIGENCE DICTIONARY ---
const PH_STORE_RULES = [
    // Food & Dining (Fast food, Resto, Cafe, Bakery)
    {
        category: "Pagkain",
        stores: [
            "Jollibee", "McDonald's", "McDo", "Chowking", "Mang Inasal", "Greenwich", "KFC",
            "Burger King", "Wendy's", "Popeyes", "Shakey's", "Pizza Hut", "Subway", "Tokyo Tokyo",
            "BonChon", "Army Navy", "Starbucks", "Dunkin", "Krispy Kreme", "Tim Hortons",
            "Seattle's Best", "Chatime", "Gong Cha", "Macao Imperial", "Coco", "Tiger Sugar",
            "Goldilocks", "Red Ribbon", "Pan de Manila", "Carinderia", "Kainan"
        ],
        keywords: [
            "food", "kainan", "meal", "dine-in", "takeout", "chickenjoy", "burger", "coffee", "rice",
            "milktea", "bakery", "bakeshop", "diner", "bistro", "resto", "restaurant", "grill"
        ]
    },
    // Groceries & Supermarkets (under Pagkain)
    {
        category: "Pagkain",
        stores: [
            "SM Supermarket", "SM Hypermarket", "Savemore", "Puregold", "Robinsons Supermarket",
            "Robinsons Easymart", "Super8", "WalterMart", "AllDay", "S&R", "Landers", "Dali",
            "Osave", "Shopwise", "Gaisano", "Alfamart", "7-Eleven", "Uncle John's", "Lawson", "FamilyMart",
            "South Supermarket", "Metro Gaisano", "Landmark", "Cash & Carry", "Ever Supermarket", "Unimart", "Pioneer Centre"
        ],
        keywords: ["supermarket", "grocery", "mart", "mini mart", "convenience", "hypermarket", "market", "sari-sari", "groceries"]
    },
    // Transportation & Fuel
    {
        category: "Pamasahe",
        stores: [
            "Petron", "Shell", "Caltex", "Phoenix", "Cleanfuel", "Seaoil", "PTT", "Unioil",
            "Total Energies", "Flying V", "Grab", "Angkas", "JoyRide", "Move It", "Taxi", "MRT", "LRT",
            "Beep", "Autosweep", "Easytrip"
        ],
        keywords: ["fuel", "gasoline", "diesel", "petrol", "transport", "toll", "fare", "pamasahe", "ride", "pump", "station"]
    },
    // Utilities & Bills
    {
        category: "Bills",
        stores: [
            "Meralco", "Maynilad", "Manila Water", "PLDT", "Globe", "Smart", "Converge",
            "Sky Cable", "Cignal", "DITO", "Prime Water"
        ],
        keywords: ["bill", "utility", "electric", "water bill", "statement of account", "due date", "kwh", "internet"]
    },
    // Mobile Load & Data
    {
        category: "Load",
        stores: ["Prepaid Load", "Autoload", "Load Max", "Data Promo", "Giga", "GoSurf"],
        keywords: ["load", "eload", "regular load", "data promo", "prepaid"]
    },
    // Pharmacy / Health (Mapped to Iba pa)
    {
        category: "Iba pa",
        stores: [
            "Mercury Drug", "Watsons", "Southstar Drug", "Generika", "Rose Pharmacy", "TGP",
            "The Generics Pharmacy"
        ],
        keywords: ["drug", "pharmacy", "medicine", "tablets", "capsule", "rx", "pharma"]
    },
    // Electronics & Hardware (Mapped to Project Components)
    {
        category: "Project Components",
        stores: [
            "Ace Hardware", "Handyman", "True Value", "Wilcon", "Octagon", "Silicon Valley",
            "Datablitz", "PC Express", "Shopee", "Lazada", "TikTok Shop"
        ],
        keywords: ["hardware", "tools", "electronics", "cable", "screw", "computer", "gadget"]
    }
];

// Helper to convert ALL UPPERCASE text to Title Case
function toTitleCase(str) {
    if (!str) return "";
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

// Client-Side Canvas Image Preprocessor for High-Accuracy OCR
async function preprocessImageForOCR(imageSrcOrElement) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                // Constrain max dimension to 1600px for optimal OCR DPI and performance
                const maxDim = 1600;
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);

                const imgData = ctx.getImageData(0, 0, w, h);
                const d = imgData.data;

                // Grayscale and dynamic contrast normalization
                let minLum = 255;
                let maxLum = 0;
                const luminances = new Uint8Array(w * h);

                for (let i = 0, j = 0; i < d.length; i += 4, j++) {
                    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
                    luminances[j] = lum;
                    if (lum < minLum) minLum = lum;
                    if (lum > maxLum) maxLum = lum;
                }

                const range = maxLum - minLum;
                const stretch = range > 30;

                for (let i = 0, j = 0; i < d.length; i += 4, j++) {
                    let val = luminances[j];
                    if (stretch) {
                        val = Math.round(((val - minLum) / range) * 255);
                    }
                    // Push background to crisp white and text to deep black
                    if (val > 185) {
                        val = 255;
                    } else if (val < 90) {
                        val = Math.max(0, val - 30);
                    }
                    d[i] = val;
                    d[i + 1] = val;
                    d[i + 2] = val;
                }

                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.92));
            } catch (err) {
                console.warn("Canvas preprocessing fallback:", err);
                resolve(typeof imageSrcOrElement === "string" ? imageSrcOrElement : img.src);
            }
        };
        img.onerror = () => {
            resolve(typeof imageSrcOrElement === "string" ? imageSrcOrElement : "");
        };
        img.src = typeof imageSrcOrElement === "string" ? imageSrcOrElement : imageSrcOrElement.src;
    });
}

// Extract money values safely from a line, handling PHP/P prefix without requiring word boundaries
function extractNumbersFromLine(line) {
    if (!line) return [];
    let clean = line;
    // Replace comma decimal if followed by 2 digits: e.g. 164,50 -> 164.50
    clean = clean.replace(/(\d),(\d{2})(?!\d)/g, "$1.$2");
    // Remove comma thousands separators: e.g. 1,000.00 -> 1000.00
    clean = clean.replace(/,/g, "");
    // Fix spaces around decimal point: e.g. 164 . 50 -> 164.50
    clean = clean.replace(/(\d+)\s*\.\s*/g, "$1.");
    // Fix OCR 'O' or 'o' for zeros in decimals: e.g. .5O -> .50, .OO -> .00
    clean = clean.replace(/(\d+)\.([0-9])([oO])\b/g, (m, g1, g2) => g1 + "." + g2 + "0");
    clean = clean.replace(/(\d+)\.([oO])([0-9])\b/g, (m, g1, g2) => g1 + ".0" + g2);
    clean = clean.replace(/(\d+)\.([oO])([oO])\b/g, (m, g1) => g1 + ".00");

    const moneyRegex = /(?:PHP|₱|P|Php|\$)?\s*([0-9]{1,6}(?:\.[0-9]{1,2})?)(?!\d)/gi;
    const results = [];
    let match;
    while ((match = moneyRegex.exec(clean)) !== null) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val > 0 && val < 1000000) {
            // Exclude calendar years unless the line explicitly indicates a financial total
            if (val >= 2024 && val <= 2035 && !/total|php|due|sale|amount/i.test(line)) {
                continue;
            }
            results.push(val);
        }
    }
    return results;
}

// Smart OCR Parsing: Extracts Grand Total Amount & Candidates
function extractAmountAndCandidates(rawText, detectedItems = []) {
    if (!rawText || !rawText.trim()) return { amount: null, candidates: [] };

    const lines = rawText.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    const totalKeywords = /(?:grand\s*total|total\s*due|amount\s*due|total\s*amount|total\s*sale|net\s*total|net\s*amount|total\s*bill|total\s*php|total\s*p|t0tal|tota1|\btotal\b)/i;
    const subtotalKeywords = /(?:sub\s*total|vatable|vat\s*amount|service\s*charge|discount)/i;
    const paymentKeywords = /(?:cash|tendered|received|sukli|change|balik|paid\s*via|gcash|maya)/i;

    let primaryAmount = null;
    const candidates = new Set();
    let detectedCash = null;
    let detectedChange = null;

    // Scan lines
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track Cash & Change for mathematical cross validation
        if (/cash|tendered/i.test(line) && !/change|sukli/i.test(line)) {
            const nums = extractNumbersFromLine(line);
            if (nums.length > 0) detectedCash = nums[0];
        }
        if (/change|sukli|balik/i.test(line)) {
            const nums = extractNumbersFromLine(line);
            if (nums.length > 0) detectedChange = nums[0];
        }

        // Match Grand Total line
        if (totalKeywords.test(line) && !subtotalKeywords.test(line) && !/subtotal/i.test(line)) {
            let checkLine = line;
            if (/sub\s*total/i.test(line)) {
                checkLine = line.replace(/.*sub\s*total[^\d]*[\d.]+/i, "");
            }

            const matches = extractNumbersFromLine(checkLine);
            if (matches.length > 0) {
                primaryAmount = matches[matches.length - 1].toFixed(2);
                matches.forEach(m => candidates.add(m.toFixed(2)));
                break;
            }

            // Check immediate next line if total keyword was on its own line
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (!paymentKeywords.test(nextLine)) {
                    const nextMatches = extractNumbersFromLine(nextLine);
                    if (nextMatches.length > 0) {
                        primaryAmount = nextMatches[nextMatches.length - 1].toFixed(2);
                        nextMatches.forEach(m => candidates.add(m.toFixed(2)));
                        break;
                    }
                }
            }
        }
    }

    // Mathematical Cross-Validation: Cash - Change = Total
    if (detectedCash !== null && detectedChange !== null && detectedCash > detectedChange) {
        const mathTotal = (detectedCash - detectedChange).toFixed(2);
        if (!primaryAmount || primaryAmount === detectedCash.toFixed(2)) {
            primaryAmount = mathTotal;
        }
        candidates.add(mathTotal);
    }

    // Cross-Validation with Line Items Sum
    if (!primaryAmount && detectedItems && detectedItems.length > 0) {
        const itemsSum = detectedItems.reduce((acc, item) => acc + (item.price || 0), 0);
        if (itemsSum > 0 && itemsSum < 100000) {
            const sumStr = itemsSum.toFixed(2);
            primaryAmount = sumStr;
            candidates.add(sumStr);
        }
    }

    // Collect all candidates across text
    lines.forEach(l => {
        const nums = extractNumbersFromLine(l);
        nums.forEach(n => candidates.add(n.toFixed(2)));
    });

    // Fallback: If no primaryAmount found, choose the most sensible monetary value
    if (!primaryAmount && candidates.size > 0) {
        const candArray = Array.from(candidates).map(Number).filter(n => n > 0 && n < 500000);
        const filtered = detectedCash ? candArray.filter(n => Math.abs(n - detectedCash) > 0.01) : candArray;
        if (filtered.length > 0) {
            primaryAmount = Math.max(...filtered).toFixed(2);
        } else if (candArray.length > 0) {
            primaryAmount = Math.max(...candArray).toFixed(2);
        }
    }

    return {
        amount: primaryAmount,
        candidates: Array.from(candidates).slice(0, 6)
    };
}

// Store & Category Intelligence Extractor
function detectStoreAndCategory(rawText) {
    if (!rawText || !rawText.trim()) return { store: "Receipt", category: "Pagkain" };

    const lines = rawText.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    const nonStoreKeywords = /(?:tin|vat|non-vat|official\s*receipt|sales\s*invoice|or\s*#|si\s*#|invoice|receipt|date|time|cashier|terminal|machine|pos|tel|phone|address|st\.|ave\.|street|avenue|city|brgy|barangay|pasay|manila|makati|quezon|cebu|davao)/i;

    // Header inspection (lines 1 to 4)
    const headerLines = lines.slice(0, 4);
    const headerText = headerLines.join(" ");

    // 1. Check known stores in header lines first
    for (const rule of PH_STORE_RULES) {
        for (const store of rule.stores) {
            const storeRegex = new RegExp(`(?:^|[^a-zA-Z0-9])${store}(?:[^a-zA-Z0-9]|$)`, "i");
            if (storeRegex.test(headerText)) {
                return { store, category: rule.category };
            }
        }
    }

    // 2. Extract dynamic store name from top lines (e.g. MALAYA SUPERMARKET)
    let dynamicStore = "";
    for (let i = 0; i < headerLines.length; i++) {
        const line = headerLines[i];
        if (/[a-zA-Z]{3,}/.test(line) && !nonStoreKeywords.test(line) && line.length >= 3 && line.length <= 50) {
            dynamicStore = line.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
            break;
        }
    }

    // Determine category based on header or keywords
    let matchedCategory = "Pagkain";
    const textToAnalyze = (dynamicStore + " " + rawText).toLowerCase();

    for (const rule of PH_STORE_RULES) {
        if (rule.keywords.some(k => textToAnalyze.includes(k))) {
            matchedCategory = rule.category;
            break;
        }
    }

    if (dynamicStore) {
        return {
            store: toTitleCase(dynamicStore),
            category: matchedCategory
        };
    }

    // 3. Fallback: Check known stores across whole text with word boundaries
    for (const rule of PH_STORE_RULES) {
        for (const store of rule.stores) {
            const storeRegex = new RegExp(`\\b${store}\\b`, "i");
            if (storeRegex.test(rawText)) {
                return { store, category: rule.category };
            }
        }
    }

    return { store: "Receipt", category: matchedCategory };
}

// Payment Method Auto-Detector
function detectMethodFromText(rawText, wallets = ["Cash"]) {
    if (!rawText) return wallets[0] || "Cash";
    const lower = rawText.toLowerCase();
    if (lower.includes("gcash") && wallets.includes("GCash")) return "GCash";
    if ((lower.includes("maya") || lower.includes("paymaya")) && wallets.includes("Maya")) return "Maya";
    if ((lower.includes("cash") || lower.includes("sukli") || lower.includes("change")) && wallets.includes("Cash")) return "Cash";
    for (const w of wallets) {
        if (lower.includes(w.toLowerCase())) return w;
    }
    return wallets[0] || "Cash";
}

// Receipt Date Extractor
function detectDateFromText(rawText) {
    if (!rawText) return null;
    const dateRegexes = [
        /(?:date|petsa)?\s*[:#]?\s*([0-1]?[0-9])[\/\-]([0-3]?[0-9])[\/\-](202[4-9]|203[0-5])/i,
        /(?:date|petsa)?\s*[:#]?\s*(202[4-9]|203[0-5])[\/\-]([0-1]?[0-9])[\/\-]([0-3]?[0-9])/i
    ];

    for (const reg of dateRegexes) {
        const m = rawText.match(reg);
        if (m) {
            if (m[1].length === 4) {
                const y = m[1];
                const mo = m[2].padStart(2, "0");
                const d = m[3].padStart(2, "0");
                return `${y}-${mo}-${d}`;
            } else {
                const mo = m[1].padStart(2, "0");
                const d = m[2].padStart(2, "0");
                const y = m[3];
                return `${y}-${mo}-${d}`;
            }
        }
    }
    return null;
}

// Line Items Breakdown Extractor
function extractLineItems(text) {
    if (!text) return [];
    const lines = text.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    const ignoreKeywords = /(?:tin|vat|non-vat|official|receipt|invoice|total|subtotal|change|sukli|cash|tendered|date|time|cashier|or\s*#|si\s*#|thank|come\s*again|serves\s*as|tel|phone|pos|machine|terminal)/i;
    const items = [];
    for (const line of lines) {
        if (ignoreKeywords.test(line)) continue;
        const itemMatch = line.match(/^([0-9]{1,2}[xX]?\s+)?([A-Za-z0-9\s\-\.\/&]{3,40})\s+(?:PHP|₱|P|Php)?\s*([0-9]{1,5}(?:\.[0-9]{1,2})?)$/i);
        if (itemMatch) {
            const qty = itemMatch[1] ? itemMatch[1].trim() : "1";
            const name = toTitleCase(itemMatch[2].trim());
            const price = parseFloat(itemMatch[3]);
            if (name.length >= 3 && !isNaN(price) && price > 0 && price < 10000) {
                items.push({ qty, name, price });
            }
        }
    }
    return items;
}

// Helper to draw a squircle icon plate
function CategorySquircle({ category, size = 40, iconSize = 18 }) {
    const isFood = category === "Pagkain";
    const isFare = category === "Pamasahe";
    const isBills = category === "Bills";
    const isLoad = category === "Load";
    const isComponents = category === "Project Components";

    let bgStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    let IconComp = SCANNER_ICONS.Tag;

    if (isFood) {
        bgStyle = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
        IconComp = SCANNER_ICONS.Store;
    } else if (isFare) {
        bgStyle = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
        IconComp = SCANNER_ICONS.Tag;
    } else if (isBills) {
        bgStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
        IconComp = SCANNER_ICONS.Receipt;
    } else if (isLoad) {
        bgStyle = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
        IconComp = SCANNER_ICONS.Zap;
    } else if (isComponents) {
        bgStyle = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
        IconComp = SCANNER_ICONS.Sparkles;
    }

    return (
        <div
            className={`rounded-[13px] border flex items-center justify-center shrink-0 ${bgStyle}`}
            style={{ width: size, height: size }}
        >
            <IconComp size={iconSize} />
        </div>
    );
}

// --- MAIN RECEIPT SCANNER COMPONENT ---
window.ReceiptScanner = function ReceiptScanner({ uid, wallets = ["Cash"], onStatusChange }) {
    const { useState, useRef, useEffect, useMemo } = React;

    const [status, setStatus] = useState("IDLE"); // IDLE, CAMERA, SCANNING, RESULT
    const [stream, setStream] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [torchSupported, setTorchSupported] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // Extracted Data States
    const [extractedAmount, setExtractedAmount] = useState("");
    const [candidateAmounts, setCandidateAmounts] = useState([]);
    const [detectedStore, setDetectedStore] = useState("");
    const [extractedCategory, setExtractedCategory] = useState("Pagkain");
    const [extractedDate, setExtractedDate] = useState(null);
    const [extractedItems, setExtractedItems] = useState([]);
    const [showItemsBreakdown, setShowItemsBreakdown] = useState(false);
    const [spendType, setSpendType] = useState("need");

    const preferredWallet = useMemo(() => {
        try {
            return localStorage.getItem(window.TipidCore.storageKey(uid, "default_wallet"));
        } catch (_) { return null; }
    }, [uid]);

    const [method, setMethod] = useState(
        wallets.includes(preferredWallet) ? preferredWallet : (wallets[0] || "Cash")
    );
    const [amountWasDetected, setAmountWasDetected] = useState(false);
    const [saving, setSaving] = useState(false);
    const [scanError, setScanError] = useState(null);

    // Scanning progress simulation indicators
    const [scanStep, setScanStep] = useState(0);

    // Recent scans cache
    const [recentScans, setRecentScans] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`tipid_recent_scans_${uid}`) || "[]");
        } catch (_) { return []; }
    });

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Notify parent page of status change for hero card dynamic bubble
    useEffect(() => {
        if (typeof onStatusChange === "function") {
            onStatusChange(status);
        }
    }, [status, onStatusChange]);

    // Update wallet if wallets list shifts
    useEffect(() => {
        if (wallets.length > 0 && !wallets.includes(method)) {
            setMethod(wallets[0]);
        }
    }, [wallets]);

    // Cleanup camera track on unmount
    useEffect(() => {
        return () => stopCamera();
    }, []);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setTorchOn(false);
            setTorchSupported(false);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setStream(mediaStream);
            setStatus("CAMERA");

            const track = mediaStream.getVideoTracks()[0];
            if (track && typeof track.getCapabilities === "function") {
                const caps = track.getCapabilities();
                if (caps.torch) setTorchSupported(true);
            }

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied or error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Camera Access Needed',
                text: 'Unable to access your device camera. Please verify camera permissions in your browser or choose "Upload Receipt Photo".',
                confirmButtonColor: '#B5483B',
                customClass: { popup: 'tipid-swal' }
            });
        }
    };

    // Toggle hardware torch/flashlight if supported
    const toggleTorch = async () => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        if (track && torchSupported) {
            try {
                const nextState = !torchOn;
                await track.applyConstraints({ advanced: [{ torch: nextState }] });
                setTorchOn(nextState);
            } catch (e) {
                console.warn("Torch failed:", e);
            }
        }
    };

    // Attach stream to video tag when active
    useEffect(() => {
        if (status === "CAMERA" && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Play error:", e));
        }
    }, [status, stream]);

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setImageSrc(imgDataUrl);
        stopCamera();
        processImage(imgDataUrl);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 14 * 1024 * 1024) {
            e.target.value = "";
            return Swal.fire({
                icon: 'warning',
                title: 'Unsupported File',
                text: 'Please select a valid image file (JPG, PNG, or WEBP) under 14 MB.',
                confirmButtonColor: '#1F6F54',
                customClass: { popup: 'tipid-swal' }
            });
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setImageSrc(dataUrl);
            processImage(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            return Swal.fire({
                icon: 'warning',
                title: 'Image Required',
                text: 'Please drop a picture of your receipt.',
                confirmButtonColor: '#1F6F54',
                customClass: { popup: 'tipid-swal' }
            });
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            setImageSrc(dataUrl);
            processImage(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    // Ensure Tesseract.js is ready
    const ensureTesseractLoaded = () => {
        if (window.Tesseract) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load OCR engine. Please check your network connection."));
            document.head.appendChild(script);
        });
    };

    // Main OCR Execution with Canvas Preprocessing
    const processImage = async (base64Image) => {
        setStatus("SCANNING");
        setScanError(null);
        setScanStep(1);

        try {
            await ensureTesseractLoaded();

            // Step 1: Client-Side Canvas Preprocessing (grayscale & contrast normalization)
            const preprocessedUrl = await preprocessImageForOCR(base64Image);
            setScanStep(2);

            // Step 2: Execute Tesseract Recognition
            const worker = await window.Tesseract.createWorker("eng");
            let ret = await worker.recognize(preprocessedUrl);

            let rawText = ret && ret.data && ret.data.text ? ret.data.text : "";

            // Fast fallback to original image if preprocessed text is empty
            if ((!rawText || rawText.trim().length < 10) && preprocessedUrl !== base64Image) {
                ret = await worker.recognize(base64Image);
                rawText = ret && ret.data && ret.data.text ? ret.data.text : "";
            }

            await worker.terminate();
            setScanStep(3);

            // Step 3: Extract Essential Expense Fields
            const detectedItems = extractLineItems(rawText);
            const { amount, candidates } = extractAmountAndCandidates(rawText, detectedItems);
            const { store, category } = detectStoreAndCategory(rawText);
            const detectedWallet = detectMethodFromText(rawText, wallets);
            const detectedDate = detectDateFromText(rawText);

            if (amount) {
                setExtractedAmount(amount);
                setAmountWasDetected(true);
            } else {
                setExtractedAmount("");
                setAmountWasDetected(false);
            }

            setCandidateAmounts(candidates);
            setDetectedStore(store !== "Receipt" ? store : "Receipt");
            setExtractedCategory(category);
            setExtractedDate(detectedDate);
            setExtractedItems(detectedItems);
            setShowItemsBreakdown(false);
            if (detectedWallet) setMethod(detectedWallet);

            setStatus("RESULT");
        } catch (err) {
            console.error("OCR process error:", err);
            setScanError("Receipt text could not be recognized clearly. Please review or input details manually below.");
            setExtractedAmount("");
            setAmountWasDetected(false);
            setDetectedStore("Receipt");
            setExtractedDate(null);
            setExtractedItems([]);
            setStatus("RESULT");
        }
    };

    // Save extracted expense
    const handleSave = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const amt = parseFloat(extractedAmount);

        if (isNaN(amt) || amt <= 0) {
            return Swal.fire({
                icon: 'warning',
                title: 'Check Amount',
                text: 'Please enter a valid positive expense amount.',
                confirmButtonColor: '#1F6F54',
                customClass: { popup: 'tipid-swal' }
            });
        }

        setSaving(true);
        try {
            const description = detectedStore.trim() || "Receipt";

            await window.TipidData.addExpense(uid, {
                desc: description,
                amount: amt,
                category: extractedCategory,
                method: method || "Cash",
                spendType: spendType
            });

            // Record to local recent scans cache
            const newScanRecord = {
                id: Date.now().toString(),
                desc: description,
                amount: amt,
                category: extractedCategory,
                method: method || "Cash",
                date: new Date().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })
            };

            const updatedScans = [newScanRecord, ...recentScans.slice(0, 4)];
            setRecentScans(updatedScans);
            try {
                localStorage.setItem(`tipid_recent_scans_${uid}`, JSON.stringify(updatedScans));
            } catch (_) {}

            Swal.fire({
                icon: 'success',
                title: 'Logged to Expenses!',
                text: `₱${window.peso(amt)} (${description}) has been recorded under ${method}.`,
                confirmButtonColor: '#1F6F54',
                timer: 2300,
                showConfirmButton: false,
                customClass: { popup: 'tipid-swal' }
            });

            resetScanner();
        } catch (err) {
            console.error("Save expense error:", err);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Save',
                text: 'Unable to save expense to storage. Please check your connection and try again.',
                confirmButtonColor: '#B5483B',
                customClass: { popup: 'tipid-swal' }
            });
        } finally {
            setSaving(false);
        }
    };

    const resetScanner = () => {
        stopCamera();
        setImageSrc(null);
        setExtractedAmount("");
        setCandidateAmounts([]);
        setAmountWasDetected(false);
        setDetectedStore("");
        setExtractedDate(null);
        setExtractedItems([]);
        setShowItemsBreakdown(false);
        setScanError(null);
        setStatus("IDLE");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const clearRecentScans = () => {
        setRecentScans([]);
        try {
            localStorage.removeItem(`tipid_recent_scans_${uid}`);
        } catch (_) {}
    };

    const itemsTotal = useMemo(() => {
        if (!extractedItems || extractedItems.length === 0) return "0.00";
        return extractedItems.reduce((acc, it) => acc + (it.price || 0), 0).toFixed(2);
    }, [extractedItems]);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Hidden canvas for video captures */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden input for standard file picker */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* --- MAIN INTERACTIVE SCANNER CARD --- */}
            <div className="bg-white/80 dark:bg-ink2/30 backdrop-blur-2xl rounded-[2rem] border border-white/80 dark:border-white/10 shadow-ios p-5 sm:p-7 relative overflow-hidden transition-all duration-300">

                {/* Card Top Title Row */}
                <div className="flex items-center justify-between gap-3 mb-6 relative z-10 pb-4 border-b border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-peso/10 dark:bg-pesoLight/15 text-peso dark:text-pesoLight flex items-center justify-center shrink-0 border border-peso/20 dark:border-pesoLight/20 shadow-xs">
                            <SCANNER_ICONS.Scan size={20} />
                        </span>
                        <div>
                            <h3 className="font-display text-[1.15rem] font-semibold text-ink dark:text-paper leading-tight">
                                AI Receipt Extraction
                            </h3>
                            <p className="text-[11.5px] text-ink2/60 dark:text-paper/50">
                                Instant merchant, total amount & category detection
                            </p>
                        </div>
                    </div>

                    {status !== "IDLE" && (
                        <button
                            type="button"
                            onClick={resetScanner}
                            className="tap-scale px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 text-ink2/70 dark:text-paper/70 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                            <SCANNER_ICONS.Close size={13} />
                            <span>Cancel</span>
                        </button>
                    )}
                </div>

                {/* ============================================================== */}
                {/* 1. IDLE STATE: BENTO SELECTION & DROPZONE                       */}
                {/* ============================================================== */}
                {status === "IDLE" && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Bento Action 1: Live Camera Viewfinder Card */}
                            <div
                                onClick={startCamera}
                                className="tap-scale group cursor-pointer relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#124231]/8 to-[#124231]/15 dark:from-white/[0.04] dark:to-white/[0.08] border border-emerald-600/20 dark:border-emerald-400/20 p-5 sm:p-6 flex flex-col justify-between min-h-[220px] hover:border-emerald-500/40 transition-all shadow-xs"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="w-12 h-12 rounded-2xl bg-peso text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                        <SCANNER_ICONS.Camera size={24} />
                                    </span>
                                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                        Live Viewfinder
                                    </span>
                                </div>

                                <div className="mt-6">
                                    <h4 className="font-display text-[1.15rem] font-bold text-ink dark:text-paper mb-1">
                                        Scan with Camera
                                    </h4>
                                    <p className="text-[12px] text-ink2/70 dark:text-paper/60 leading-relaxed mb-4">
                                        Point camera at any printed receipt. Frame the Grand Total and tap shutter to scan.
                                    </p>
                                    <button
                                        type="button"
                                        className="tap-scale w-full bg-gradient-to-r from-peso to-pesoLight text-white py-3 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 group-hover:shadow-md transition-all"
                                    >
                                        <SCANNER_ICONS.Camera size={15} />
                                        <span>Open Camera Scanner</span>
                                    </button>
                                </div>
                            </div>

                            {/* Bento Action 2: Drag & Drop / File Picker Card */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                className={`tap-scale group cursor-pointer relative overflow-hidden rounded-[1.5rem] border-2 border-dashed p-5 sm:p-6 flex flex-col justify-between min-h-[220px] transition-all shadow-xs ${
                                    isDragOver
                                        ? "bg-emerald-500/10 border-emerald-500 dark:bg-emerald-400/15"
                                        : "bg-black/[0.02] dark:bg-white/[0.02] border-black/10 dark:border-white/15 hover:border-black/20 dark:hover:border-white/30"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 text-ink2 dark:text-paper flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                                        <SCANNER_ICONS.Upload size={22} />
                                    </span>
                                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-ink2/70 dark:text-paper/70">
                                        JPG • PNG • WEBP
                                    </span>
                                </div>

                                <div className="mt-6">
                                    <h4 className="font-display text-[1.15rem] font-bold text-ink dark:text-paper mb-1">
                                        Upload Receipt Photo
                                    </h4>
                                    <p className="text-[12px] text-ink2/70 dark:text-paper/60 leading-relaxed mb-4">
                                        Drop your receipt screenshot, gallery photo, or e-wallet transaction slip here.
                                    </p>
                                    <button
                                        type="button"
                                        className="tap-scale w-full bg-white dark:bg-ink2/70 border border-black/10 dark:border-white/15 text-ink dark:text-paper py-3 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 group-hover:border-black/20 dark:group-hover:border-white/30 transition-all"
                                    >
                                        <SCANNER_ICONS.Image size={15} />
                                        <span>Browse Receipt Image</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* 2. CAMERA STATE: LIVE APPLE-STYLE VIEWFINDER                   */}
                {/* ============================================================== */}
                {status === "CAMERA" && (
                    <div className="flex flex-col gap-4 animate-[fadeIn_0.35s_ease-out]">
                        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black rounded-[1.75rem] overflow-hidden shadow-2xl flex items-center justify-center ring-1 ring-white/20">
                            {/* Live Video Feed */}
                            <video
                                ref={videoRef}
                                playsInline
                                autoPlay
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Viewfinder Overlays & Reticles */}
                            <div className="absolute inset-6 sm:inset-10 pointer-events-none flex flex-col justify-between">
                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-t-4 border-emerald-400 rounded-tl-xl drop-shadow-md" />
                                    <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl drop-shadow-md" />
                                </div>

                                <div className="laser-sweep-beam" />

                                <div className="flex justify-between">
                                    <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl drop-shadow-md" />
                                    <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl drop-shadow-md" />
                                </div>
                            </div>

                            {/* Top Viewfinder Controls Pill */}
                            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30 pointer-events-auto">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Align Total Amount</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {torchSupported && (
                                        <button
                                            type="button"
                                            onClick={toggleTorch}
                                            aria-label="Toggle flashlight"
                                            className={`tap-scale w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-colors ${
                                                torchOn
                                                    ? "bg-amber-400 text-black border-amber-300 shadow-md"
                                                    : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                                            }`}
                                        >
                                            <SCANNER_ICONS.Torch size={16} />
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={resetScanner}
                                        aria-label="Close camera"
                                        className="tap-scale w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-colors"
                                    >
                                        <SCANNER_ICONS.Close size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Shutter Action Bar */}
                        <div className="flex items-center justify-center gap-6 pt-2 pb-1">
                            <button
                                type="button"
                                onClick={captureImage}
                                aria-label="Capture receipt"
                                className="tap-scale group relative w-20 h-20 rounded-full border-4 border-white dark:border-white/80 p-1 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                            >
                                <span className="w-full h-full rounded-full bg-peso group-hover:bg-pesoLight transition-colors flex items-center justify-center text-white shadow-inner">
                                    <SCANNER_ICONS.Camera size={26} />
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* 3. SCANNING STATE: NEURAL OCR PROGRESS ANIMATION                */}
                {/* ============================================================== */}
                {status === "SCANNING" && (
                    <div className="py-8 flex flex-col items-center justify-center text-center animate-[fadeIn_0.3s_ease-out]">
                        <div className="relative w-full max-w-[280px] aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl mb-6 ring-4 ring-peso/20">
                            {imageSrc && (
                                <img
                                    src={imageSrc}
                                    alt="Scanning receipt"
                                    className="w-full h-full object-cover opacity-50 grayscale"
                                />
                            )}
                            <div className="laser-sweep-beam" />

                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-t from-black/80 via-transparent to-black/60">
                                <div className="w-14 h-14 rounded-2xl bg-peso/30 backdrop-blur-md border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-3 shadow-lg">
                                    <SCANNER_ICONS.Loader size={26} className="spin" />
                                </div>
                                <p className="font-mono text-xs uppercase tracking-widest text-emerald-300 font-bold">
                                    Extracting Data...
                                </p>
                            </div>
                        </div>

                        {/* Progress Checklist Steps */}
                        <div className="w-full max-w-sm bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/10 space-y-2.5 text-left">
                            <div className={`flex items-center gap-2.5 text-xs ${scanStep >= 1 ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-ink2/40 dark:text-paper/30'}`}>
                                <SCANNER_ICONS.Check size={14} className={scanStep >= 1 ? 'opacity-100' : 'opacity-30'} />
                                <span>High-contrast image normalization</span>
                            </div>
                            <div className={`flex items-center gap-2.5 text-xs ${scanStep >= 2 ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-ink2/40 dark:text-paper/30'}`}>
                                <SCANNER_ICONS.Check size={14} className={scanStep >= 2 ? 'opacity-100' : 'opacity-30'} />
                                <span>Reading merchant lines & text OCR</span>
                            </div>
                            <div className={`flex items-center gap-2.5 text-xs ${scanStep >= 3 ? 'text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-ink2/40 dark:text-paper/30'}`}>
                                <SCANNER_ICONS.Check size={14} className={scanStep >= 3 ? 'opacity-100' : 'opacity-30'} />
                                <span>Parsing Philippine Peso grand total</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================== */}
                {/* 4. RESULT STATE: REVIEW, CONFIRMATION & LOGGING                 */}
                {/* ============================================================== */}
                {status === "RESULT" && (
                    <div className="space-y-6 animate-[fadeIn_0.35s_ease-out]">
                        {/* Status Alert Banner */}
                        {amountWasDetected ? (
                            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-400/15 border border-emerald-500/20">
                                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                    <SCANNER_ICONS.Check size={16} strokeWidth={3} />
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                        OCR Recognition Complete
                                    </p>
                                    <p className="text-sm font-semibold text-ink dark:text-paper mt-0.5">
                                        {detectedStore || "Receipt"} • Total Amount Detected
                                    </p>
                                    <p className="text-[11.5px] text-ink2/65 dark:text-paper/60 mt-0.5">
                                        Please review the details below before saving to your financial ledger.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/25">
                                <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                    <SCANNER_ICONS.Info size={16} />
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                        Review Required
                                    </p>
                                    <p className="text-sm font-semibold text-ink dark:text-paper mt-0.5">
                                        {scanError || "Could not detect a clear grand total from the receipt."}
                                    </p>
                                    <p className="text-[11.5px] text-ink2/65 dark:text-paper/60 mt-0.5">
                                        You can type the total amount manually below.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Review Form */}
                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                                {/* Left Side: Receipt Thumbnail Preview */}
                                <div className="md:col-span-4 flex flex-col items-center">
                                    <div className="relative w-full max-w-[220px] aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 group">
                                        {imageSrc ? (
                                            <img
                                                src={imageSrc}
                                                alt="Captured receipt preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-ink2/30">
                                                <SCANNER_ICONS.Receipt size={32} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[11px] font-mono text-white bg-black/70 px-2.5 py-1 rounded-full">
                                                Scanned Slip
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={resetScanner}
                                        className="tap-scale mt-3 text-xs font-semibold text-peso dark:text-pesoLight hover:underline flex items-center gap-1.5"
                                    >
                                        <SCANNER_ICONS.Camera size={13} />
                                        <span>Retake / Scan Another</span>
                                    </button>
                                </div>

                                {/* Right Side: Editable Fields with Squircles */}
                                <div className="md:col-span-8 space-y-4">
                                    {/* 1. Store / Description Field */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between pl-1">
                                            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50">
                                                Store / Description
                                            </label>
                                            {extractedDate && (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[10.5px] font-mono text-ink2/70 dark:text-paper/70">
                                                    <SCANNER_ICONS.Calendar size={11} className="text-peso dark:text-pesoLight" />
                                                    <span>Receipt Date: {extractedDate}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-white/90 dark:bg-ink2/40 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-peso/50 transition-all shadow-xs">
                                            <CategorySquircle category={extractedCategory} size={34} iconSize={16} />
                                            <input
                                                type="text"
                                                value={detectedStore}
                                                onChange={(e) => setDetectedStore(e.target.value)}
                                                placeholder="e.g. Malaya Supermarket, Jollibee"
                                                maxLength={120}
                                                className="w-full bg-transparent font-medium text-sm sm:text-base text-ink dark:text-paper focus:outline-none placeholder-ink2/30"
                                            />
                                        </div>
                                    </div>

                                    {/* 2. Amount Field with Big JetBrains Mono */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between pl-1">
                                            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50">
                                                Total Amount Due
                                            </label>
                                            {candidateAmounts.length > 1 && (
                                                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                                                    Alternate values detected
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2.5 bg-white/90 dark:bg-ink2/40 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-4 py-3 focus-within:ring-2 focus-within:ring-peso/50 transition-all shadow-xs">
                                            <span className="font-mono text-2xl font-bold text-peso dark:text-pesoLight">
                                                ₱
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={extractedAmount}
                                                onChange={(e) => setExtractedAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-transparent font-mono text-2xl font-bold text-ink dark:text-paper focus:outline-none placeholder-ink2/25"
                                            />
                                        </div>

                                        {/* Candidate Amount Chips */}
                                        {candidateAmounts.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap pt-1 pl-1">
                                                <span className="text-[10.5px] text-ink2/50 dark:text-paper/40 mr-1">
                                                    Candidates:
                                                </span>
                                                {candidateAmounts.map((cand, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setExtractedAmount(cand)}
                                                        className={`tap-scale px-2 py-0.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                                                            extractedAmount === cand
                                                                ? "bg-peso text-white shadow-xs"
                                                                : "bg-black/5 dark:bg-white/10 text-ink2 dark:text-paper hover:bg-black/10"
                                                        }`}
                                                    >
                                                        ₱{window.peso(cand)}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Category & Payment Wallet (Side-by-side) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50 pl-1">
                                                Category
                                            </label>
                                            <div className="relative flex items-center bg-white/90 dark:bg-ink2/40 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 py-3 focus-within:ring-2 focus-within:ring-peso/50 transition-all shadow-xs">
                                                <select
                                                    value={extractedCategory}
                                                    onChange={(e) => setExtractedCategory(e.target.value)}
                                                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-ink dark:text-paper focus:outline-none appearance-none pr-6 cursor-pointer"
                                                >
                                                    {window.CATEGORIES.map(c => (
                                                        <option key={c} value={c} className="bg-paper dark:bg-ink">
                                                            {window.CATEGORY_DISPLAY ? (window.CATEGORY_DISPLAY[c] || c) : c}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-3.5 pointer-events-none text-ink2/40">
                                                    <SCANNER_ICONS.ChevronDown size={14} />
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50 pl-1">
                                                Wallet / Payment
                                            </label>
                                            <div className="relative flex items-center bg-white/90 dark:bg-ink2/40 ring-1 ring-black/5 dark:ring-white/10 rounded-[14px] px-3.5 py-3 focus-within:ring-2 focus-within:ring-peso/50 transition-all shadow-xs">
                                                <select
                                                    value={method}
                                                    onChange={(e) => setMethod(e.target.value)}
                                                    className="w-full bg-transparent text-xs sm:text-sm font-semibold text-ink dark:text-paper focus:outline-none appearance-none pr-6 cursor-pointer"
                                                >
                                                    {wallets.map(w => (
                                                        <option key={w} value={w} className="bg-paper dark:bg-ink">
                                                            {w}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-3.5 pointer-events-none text-ink2/40">
                                                    <SCANNER_ICONS.ChevronDown size={14} />
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Spend Type Segmented Toggle */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-ink2/60 dark:text-paper/50 pl-1">
                                            Spending Type
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10">
                                            <button
                                                type="button"
                                                onClick={() => setSpendType("need")}
                                                className={`tap-scale py-2 rounded-lg text-xs font-semibold transition-all ${
                                                    spendType === "need"
                                                        ? "bg-white dark:bg-ink shadow-xs text-emerald-700 dark:text-emerald-400 font-bold"
                                                        : "text-ink2/60 dark:text-paper/60 hover:text-ink"
                                                }`}
                                            >
                                                Kailangan (Need)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSpendType("luho")}
                                                className={`tap-scale py-2 rounded-lg text-xs font-semibold transition-all ${
                                                    spendType === "luho"
                                                        ? "bg-white dark:bg-ink shadow-xs text-amber-600 dark:text-amber-400 font-bold"
                                                        : "text-ink2/60 dark:text-paper/60 hover:text-ink"
                                                }`}
                                            >
                                                Luho (Want)
                                            </button>
                                        </div>
                                    </div>

                                    {/* 5. Detected Line Items (Expandable Accordion) */}
                                    {extractedItems && extractedItems.length > 0 && (
                                        <div className="pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowItemsBreakdown(!showItemsBreakdown)}
                                                className="tap-scale w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/10 text-ink2/80 dark:text-paper/80 text-xs font-medium hover:bg-black/[0.06] transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <SCANNER_ICONS.List size={14} className="text-peso dark:text-pesoLight" />
                                                    <span>Scanned Line Items ({extractedItems.length} items • ₱{itemsTotal})</span>
                                                </div>
                                                <span>
                                                    {showItemsBreakdown ? <SCANNER_ICONS.ChevronUp size={13} /> : <SCANNER_ICONS.ChevronDown size={13} />}
                                                </span>
                                            </button>

                                            {showItemsBreakdown && (
                                                <div className="mt-2 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/10 space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                                                    {extractedItems.map((item, idx) => (
                                                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-black/5 dark:border-white/5 last:border-b-0">
                                                            <div className="flex items-center gap-2 truncate pr-2">
                                                                <span className="font-mono text-[11px] text-ink2/50 dark:text-paper/50">{item.qty}x</span>
                                                                <span className="text-ink dark:text-paper font-medium truncate">{item.name}</span>
                                                            </div>
                                                            <span className="font-mono text-ink dark:text-paper font-semibold shrink-0">
                                                                ₱{window.peso(item.price)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={resetScanner}
                                    className="tap-scale flex-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 text-ink dark:text-paper py-3.5 rounded-xl font-semibold text-xs sm:text-sm transition-colors"
                                >
                                    Cancel / Reset
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !extractedAmount || parseFloat(extractedAmount) <= 0}
                                    className="tap-scale flex-[2] bg-gradient-to-r from-peso to-pesoLight hover:shadow-lg hover:shadow-peso/25 text-white py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-60 transition-all border border-white/20"
                                >
                                    {saving ? (
                                        <>
                                            <SCANNER_ICONS.Loader size={18} className="spin" />
                                            <span>Recording to {method}...</span>
                                        </>
                                    ) : (
                                        <>
                                            <SCANNER_ICONS.Check size={18} />
                                            <span>
                                                Save ₱{extractedAmount ? window.peso(extractedAmount) : "0.00"} as Expense
                                            </span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* ============================================================== */}
            {/* 5. RECENT SCANS FEED                                           */}
            {/* ============================================================== */}
            {recentScans.length > 0 && (
                <div className="fade-up bg-white/70 dark:bg-ink2/30 backdrop-blur-xl rounded-[1.75rem] border border-white/80 dark:border-white/10 shadow-ios p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-peso dark:text-pesoLight">
                                <SCANNER_ICONS.Clock size={16} />
                            </span>
                            <h3 className="font-display text-[1.1rem] font-semibold text-ink dark:text-paper tracking-tight">
                                Recent Scanned Receipts
                            </h3>
                        </div>

                        <button
                            type="button"
                            onClick={clearRecentScans}
                            className="tap-scale text-[11px] font-medium text-ink2/50 dark:text-paper/40 hover:text-rose-600 transition-colors"
                        >
                            Clear History
                        </button>
                    </div>

                    <div className="divide-y divide-black/5 dark:divide-white/5">
                        {recentScans.map((scan) => (
                            <div key={scan.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <CategorySquircle category={scan.category} size={38} iconSize={17} />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-ink dark:text-paper truncate">
                                            {scan.desc}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink2/60 dark:text-paper/50">
                                            <span>{scan.category}</span>
                                            <span>•</span>
                                            <span className="font-mono">{scan.method}</span>
                                            <span>•</span>
                                            <span>{scan.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="font-mono text-base font-bold text-ink dark:text-paper">
                                        ₱{window.peso(scan.amount)}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                        <SCANNER_ICONS.Check size={11} strokeWidth={3} />
                                        <span>Logged</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
