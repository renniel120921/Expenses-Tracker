const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

// Read and extract helper functions from components/ReceiptScanner.js
const scannerSrc = fs.readFileSync("components/ReceiptScanner.js", "utf8");

// Slice pure JS portion containing store rules and extraction functions
const startIdx = scannerSrc.indexOf("const PH_STORE_RULES");
const endIdx = scannerSrc.indexOf("function CategorySquircle");
const pureJsSection = scannerSrc.slice(startIdx, endIdx);

const fnCode = `
${pureJsSection}
return {
    extractNumbersFromLine,
    extractAmountAndCandidates,
    detectStoreAndCategory,
    detectMethodFromText,
    detectDateFromText,
    extractLineItems,
    PH_STORE_RULES,
    toTitleCase
};
`;

const getHelpers = new Function(fnCode);
const {
    extractNumbersFromLine,
    extractAmountAndCandidates,
    detectStoreAndCategory,
    detectMethodFromText,
    detectDateFromText,
    extractLineItems
} = getHelpers();

const MALAYA_RECEIPT = `MALAYA SUPERMARKET
123 Rizal Ave, Pasay City
TIN: 123-456-789-00000
OFFICIAL RECEIPT
OR #: 000456123
DATE: 11/04/2026 04:32 PM
CASHIER: JESSICA
1 NESCAFE 3IN1       12.50
2 LUCKY ME NOODLES   32.00
1 555 SARDINES       25.00
1 SINANDOMENG 1KG    58.00
1 COKE 290ML         22.00
1 SURF POWDER        15.00
SUBTOTAL            164.50
12% VAT              17.62
TOTAL           PHP 164.50
CASH                200.00
CHANGE               35.50
THANK YOU, COME AGAIN!
THIS SERVES AS AN OFFICIAL RECEIPT`;

test("Receipt Scanner extracts Malaya Supermarket grand total and fields accurately", () => {
    const { amount, candidates } = extractAmountAndCandidates(MALAYA_RECEIPT);
    assert.equal(amount, "164.50", "Must extract 164.50 grand total instead of null or Cash tendered 200.00");
    assert.ok(candidates.includes("164.50"), "164.50 must be in candidates list");

    const { store, category } = detectStoreAndCategory(MALAYA_RECEIPT);
    assert.equal(store, "Malaya Supermarket", "Must extract store name from header");
    assert.equal(category, "Pagkain", "Supermarket must be categorized under Pagkain");

    const method = detectMethodFromText(MALAYA_RECEIPT, ["Cash", "GCash", "Maya"]);
    assert.equal(method, "Cash", "Must detect Cash payment from receipt");

    const date = detectDateFromText(MALAYA_RECEIPT);
    assert.equal(date, "2026-11-04", "Must detect 11/04/2026 date correctly");

    const items = extractLineItems(MALAYA_RECEIPT);
    assert.equal(items.length, 6, "Must detect 6 individual line items");
    const sum = items.reduce((acc, it) => acc + it.price, 0);
    assert.equal(sum.toFixed(2), "164.50", "Sum of items must match receipt total 164.50");
});

test("Receipt Scanner handles Jollibee fast food with GCash", () => {
    const jollibeeText = `JOLLIBEE FOODS CORP.
SM MEGAMALL BRANCH
VAT REG TIN: 000-333-111-000
DATE: 2026-11-03  TIME: 12:45 PM
CASHIER: J. REYES  OR NO: 994821
1x 2pc Chickenjoy Meal   219.00
1x Jolly Spaghetti        60.00
1x Peach Mango Pie        48.00
SUBTOTAL:                327.00
12% VAT:                  35.04
TOTAL AMOUNT DUE:     PHP 327.00
PAID VIA GCASH QR        327.00
THANK YOU FOR DINING WITH US!`;

    const { amount } = extractAmountAndCandidates(jollibeeText);
    assert.equal(amount, "327.00");

    const { store, category } = detectStoreAndCategory(jollibeeText);
    assert.equal(store, "Jollibee");
    assert.equal(category, "Pagkain");

    const method = detectMethodFromText(jollibeeText, ["Cash", "GCash", "Maya"]);
    assert.equal(method, "GCash");

    const date = detectDateFromText(jollibeeText);
    assert.equal(date, "2026-11-03");
});

test("Receipt Scanner handles word boundary traps (PHP attached directly to numbers)", () => {
    const textWithNoSpace = `PUREGOLD PRICE CLUB INC.
Q.C. BRANCH
1 RICE 5KG           280.00
1 EGGS 1 DOZ         110.00
TOTAL:              PHP390.00
CASH                500.00
SUKLI               110.00`;

    const { amount } = extractAmountAndCandidates(textWithNoSpace);
    assert.equal(amount, "390.00", "Must match PHP390.00 without space");

    const { store, category } = detectStoreAndCategory(textWithNoSpace);
    assert.equal(store, "Puregold");
    assert.equal(category, "Pagkain");
});

test("Receipt Scanner handles gas station transport category (Shell)", () => {
    const shellText = `SHELL PILIPINAS CORP
EDSA GUADALUPE MAKATI
DATE: 04/11/2026
FUEL - V-POWER GASOLINE
TOTAL SALE:          P1,000.00
PAID VIA MAYA QR    1000.00`;

    const { amount } = extractAmountAndCandidates(shellText);
    assert.equal(amount, "1000.00");

    const { store, category } = detectStoreAndCategory(shellText);
    assert.equal(store, "Shell");
    assert.equal(category, "Pamasahe");

    const method = detectMethodFromText(shellText, ["Cash", "GCash", "Maya"]);
    assert.equal(method, "Maya");
});

test("Receipt Scanner handles OCR letter-O confusion and decimal spacing", () => {
    const ocrMessyText = `MALAYA SUPERMARKET
TOTAL PHP 164 . 5O
CASH 20O.OO
CHANGE 35.5O`;

    const { amount } = extractAmountAndCandidates(ocrMessyText);
    assert.equal(amount, "164.50", "Must recover 164.50 from 164 . 5O");
});

test("Receipt Scanner contains zero emojis per design guideline", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
    const matches = scannerSrc.match(new RegExp(emojiRegex.source, "gu"));
    assert.equal(matches, null, "components/ReceiptScanner.js must not contain any emojis");
});

test("ExpenseList contains zero emojis and zero demo sample records", () => {
    const listSrc = fs.readFileSync("components/ExpenseList.js", "utf8");
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
    const matches = listSrc.match(new RegExp(emojiRegex.source, "gu"));
    assert.equal(matches, null, "components/ExpenseList.js must not contain any emojis");
    assert.ok(!listSrc.includes("SAMPLE_DEMO_ENTRIES"), "Must not contain SAMPLE_DEMO_ENTRIES");
    assert.ok(!listSrc.includes("Preview Sample Demo Ledger"), "Must not contain Preview Sample Demo Ledger button");
});

test("InstallmentTracker contains zero emojis and zero demo sample records", () => {
    const instSrc = fs.readFileSync("components/InstallmentTracker.js", "utf8");
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
    const matches = instSrc.match(new RegExp(emojiRegex.source, "gu"));
    assert.equal(matches, null, "components/InstallmentTracker.js must not contain any emojis");
    assert.ok(!instSrc.includes("SAMPLE_DEMO_INSTALLMENTS"), "Must not contain SAMPLE_DEMO_INSTALLMENTS");
    assert.ok(!instSrc.includes("Preview Demo"), "Must not contain Preview Demo button");
    assert.ok(!instSrc.includes("Preview Sample Demo Plans"), "Must not contain Preview Sample Demo Plans button");
});
