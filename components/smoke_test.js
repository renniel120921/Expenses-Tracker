const fs = require('fs');
const { JSDOM } = require('jsdom');
const babel = require('@babel/core');

const html = fs.readFileSync('dashboard.html', 'utf8');
const re = /<script type="text\/babel">([\s\S]*?)<\/script>/g;
const blocks = [];
let m;
while ((m = re.exec(html)) !== null) blocks.push(m[1]);
if (blocks.length !== 2) throw new Error('Expected 2 inline babel blocks, got ' + blocks.length);

const combinedSource = blocks[0] + '\n' + blocks[1];
const { code } = babel.transformSync(combinedSource, { presets: [[require.resolve('@babel/preset-react'), { runtime: 'classic' }]] });

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.localStorage = dom.window.localStorage;

global.React = require('react');
global.ReactDOM = { ...require('react-dom'), ...require('react-dom/client') };
window.React = global.React;
window.ReactDOM = global.ReactDOM;

// ---- Mocks for everything this file expects to exist externally ----
global.Swal = {
  fire: () => Promise.resolve({ isConfirmed: false, value: null }),
  mixin: () => ({ fire: () => {} }),
};
window.Swal = global.Swal;

const fakeUser = { uid: 'u1', displayName: 'Kimberly Test', email: 'kim@example.com', photoURL: null };

window.TipidAuth = { onChange: (cb) => { cb(fakeUser); return () => {}; }, logOut: async () => {} };

const today = new Date();
const thisMonthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 10);

const fakeEntries = [
  { id: '1', type: 'income', amount: 20000, date: thisMonthStr(today), method: 'Cash', category: null },
  { id: '2', type: 'expense', amount: 1500, date: thisMonthStr(today), method: 'GCash', category: 'Pagkain' },
  { id: '3', type: 'expense', amount: 800, date: thisMonthStr(today), method: 'Cash', category: 'Pamasahe' },
  { id: '4', type: 'expense', amount: 500, date: thisMonthStr(today), method: 'Cash' }, // no category -> "Iba pa"
  { id: '5', type: 'expense', amount: 3000, date: thisMonthStr(lastMonthDate), method: 'Cash', category: 'Bills' },
  { id: '6', type: 'expense', amount: 100, date: 'not-a-date', method: 'Cash', category: 'Bills' }, // malformed date guard
];

window.TipidData = {
  subscribeEntries: (uid, onData) => { onData(fakeEntries); return () => {}; },
  subscribeBudget: (uid, cb) => { cb({ amount: 8000 }); return () => {}; },
};

// Stub the external component scripts we don't have on hand.
window.Navbar = () => React.createElement('nav', { 'data-testid': 'navbar' });
window.SmartSummary = () => React.createElement('div', { 'data-testid': 'smart-summary' });
window.ExpenseChart = () => React.createElement('div', { 'data-testid': 'expense-chart' });
window.AddEntryForm = () => React.createElement('div', { 'data-testid': 'add-entry-form' });
window.EntryList = () => React.createElement('div', { 'data-testid': 'entry-list' });
window.ExpenseItem = () => null;
window.OnboardingModal = () => React.createElement('div', { 'data-testid': 'onboarding' });

// localStorage: mark onboarding as already done so that branch is inert for this smoke test.
window.localStorage.setItem('tipid_onboarded_u1', '1');

global.IS_REACT_ACT_ENVIRONMENT = true;
const { act } = require('react-dom/test-utils');

let caughtError = null;
window.addEventListener('error', (e) => { caughtError = e.error || e.message; });

try {
  act(() => { eval(code); });
} catch (e) {
  caughtError = e;
}

// Let any remaining effects/microtasks flush.
setTimeout(() => {
  if (caughtError) {
    console.log('RUNTIME ERROR:', caughtError.stack || caughtError);
    process.exit(1);
  }
  const root = document.getElementById('root');
  const html = root.innerHTML;
  const checks = {
    'Hero balance rendered': /Kasalukuyang Balanse/.test(html),
    'Month delta pill rendered': /ngayong buwan/.test(html),
    'Overview section title rendered': /Sa Isang Tingin/.test(html),
    'KPI: Kita ngayong buwan': /Kita ngayong buwan/.test(html),
    'KPI: Gastos ngayong buwan': /Gastos ngayong buwan/.test(html),
    'KPI: Naipon (Net)': /Naipon \(Net\)/.test(html),
    'KPI: Savings Rate': /Savings Rate/.test(html),
    'Budget pace card rendered': /Bilis ng Paggasta/.test(html),
    'Top categories card rendered': /Pinakamalaking Gastos/.test(html),
    'Category Pagkain shown': /Pagkain/.test(html),
    'Fallback category Iba pa shown': /Iba pa/.test(html),
    'Navbar stub mounted': /data-testid="navbar"/.test(html),
    'SmartSummary stub mounted': /data-testid="smart-summary"/.test(html),
    'ExpenseChart stub mounted': /data-testid="expense-chart"/.test(html),
    'AddEntryForm stub mounted': /data-testid="add-entry-form"/.test(html),
    'EntryList stub mounted': /data-testid="entry-list"/.test(html),
  };
  let allPass = true;
  for (const [k, v] of Object.entries(checks)) {
    console.log((v ? 'PASS' : 'FAIL') + ' - ' + k);
    if (!v) allPass = false;
  }
  console.log(allPass ? '\nALL SMOKE CHECKS PASSED' : '\nSOME CHECKS FAILED');
  process.exit(allPass ? 0 : 1);
}, 50);
