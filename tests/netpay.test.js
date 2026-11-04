const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadNetPayEngine() {
  const context = {
    window: {},
    Math,
    Number,
    String,
    Intl
  };
  const code = fs.readFileSync(path.join(__dirname, "../components/AllowanceCalculator.js"), "utf8");
  // Extract window.TipidNetPay definition block
  const match = code.match(/window\.TipidNetPay\s*=\s*\{[\s\S]*?\n\};/);
  if (!match) throw new Error("window.TipidNetPay not found in components/AllowanceCalculator.js");
  vm.runInNewContext(match[0], context);
  return context.window.TipidNetPay;
}

test("TipidNetPay handles zero and negative gross salary safely", () => {
  const engine = loadNetPayEngine();
  const res0 = engine.calculate(0);
  assert.equal(res0.netMonthly, 0);
  assert.equal(res0.netSemiMonthly, 0);
  assert.equal(res0.totalDeductions, 0);
  assert.equal(res0.isTaxExempt, true);

  const resNeg = engine.calculate(-15000);
  assert.equal(resNeg.netMonthly, 0);
});

test("TipidNetPay correctly computes Minimum Wage (₱18,000) with zero income tax", () => {
  const engine = loadNetPayEngine();
  const res = engine.calculate(18000);
  // SSS: round(18000 / 500) * 500 = 18000 * 0.045 = 810
  assert.equal(res.sssEmployee, 810);
  // PhilHealth: 18000 * 0.025 = 450
  assert.equal(res.philhealthEmployee, 450);
  // Pag-IBIG: 200
  assert.equal(res.pagibigEmployee, 200);
  assert.equal(res.totalGovEmployee, 1460);
  // Taxable: 18000 - 1460 = 16540 (<= 20,833.33) -> Tax = 0
  assert.equal(res.isTaxExempt, true);
  assert.equal(res.tax, 0);
  assert.equal(res.totalDeductions, 1460);
  assert.equal(res.netMonthly, 16540);
  assert.equal(res.netSemiMonthly, 8270);
});

test("TipidNetPay correctly computes ₱30,000 gross salary with TRAIN law tax", () => {
  const engine = loadNetPayEngine();
  const res = engine.calculate(30000);
  // SSS capped at 30,000 MSC: 1350
  assert.equal(res.sssEmployee, 1350);
  // PhilHealth: 30000 * 0.025 = 750
  assert.equal(res.philhealthEmployee, 750);
  // Pag-IBIG: max 200
  assert.equal(res.pagibigEmployee, 200);
  assert.equal(res.totalGovEmployee, 2300);
  // Taxable: 30000 - 2300 = 27700
  assert.equal(res.taxableIncome, 27700);
  // Tax: (27700 - 20833.33) * 0.15 = 1030.00
  assert.equal(res.tax, 1030);
  assert.equal(res.isTaxExempt, false);
  assert.equal(res.totalDeductions, 3330);
  assert.equal(res.netMonthly, 26670);
  assert.equal(res.netSemiMonthly, 13335);
});

test("TipidNetPay incorporates optional de minimis / non-taxable allowances", () => {
  const engine = loadNetPayEngine();
  // 30,000 salary with 2,000 non-taxable rice/transpo allowance
  const res = engine.calculate(30000, 2000);
  // Taxable income decreases by 2,000 -> 27700 - 2000 = 25700
  assert.equal(res.taxableIncome, 25700);
  // Tax decreases: (25700 - 20833.33) * 0.15 = 730
  assert.equal(res.tax, 730);
  // Net increases accordingly: (30000 - 3030) + 2000 = 28970
  assert.equal(res.netMonthly, 28970);
});


test("TipidNetPay correctly computes Job Order (JO) Daily Rate with 0% Tax Exemption", () => {
  const engine = loadNetPayEngine();
  const res = engine.calculateJO({
    rateType: "daily",
    dailyRate: 650,
    daysWorked: 22,
    taxType: "exempt"
  });
  assert.equal(res.gross, 14300);
  assert.equal(res.tax, 0);
  assert.equal(res.isTaxExempt, true);
  assert.equal(res.totalDeductions, 0);
  assert.equal(res.netMonthly, 14300);
  assert.equal(res.netSemiMonthly, 7150);
});

test("TipidNetPay computes JO with +20% CSC-DBM Premium", () => {
  const engine = loadNetPayEngine();
  const res = engine.calculateJO({
    rateType: "daily",
    dailyRate: 650,
    daysWorked: 22,
    hasPremium20: true,
    taxType: "exempt"
  });
  // Base: 14,300, 20% Premium = 2,860, Total Gross = 17,160
  assert.equal(res.baseGross, 14300);
  assert.equal(res.premium, 2860);
  assert.equal(res.gross, 17160);
  assert.equal(res.netMonthly, 17160);
  assert.equal(res.netSemiMonthly, 8580);
});

test("TipidNetPay computes JO with 2% Creditable Withholding Tax (BIR Form 2307) and voluntary contributions", () => {
  const engine = loadNetPayEngine();
  const res = engine.calculateJO({
    rateType: "monthly",
    monthlyRate: 25000,
    taxType: "ewt2",
    voluntarySSS: 1120,
    voluntaryPhilHealth: 500,
    voluntaryPagIBIG: 200
  });
  assert.equal(res.gross, 25000);
  assert.equal(res.tax, 500); // 25000 * 0.02
  assert.equal(res.voluntaryTotal, 1820);
  assert.equal(res.totalDeductions, 2320); // 500 tax + 1820 voluntary
  assert.equal(res.netMonthly, 22680); // 25000 - 2320
  assert.equal(res.netSemiMonthly, 11340);
});
