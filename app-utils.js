(function () {
  "use strict";

  const MAX_MONEY_CENTAVOS = 100000000000000;
  const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

  function toCentavos(value, options = {}) {
    const number = typeof value === "string" && value.trim() === "" ? NaN : Number(value);
    if (!Number.isFinite(number)) throw new TypeError("Invalid monetary amount");
    const centavos = Math.round((number + Number.EPSILON) * 100);
    const allowZero = options.allowZero === true;
    const allowNegative = options.allowNegative === true;
    if ((!allowNegative && ((!allowZero && centavos <= 0) || (allowZero && centavos < 0))) || Math.abs(centavos) > MAX_MONEY_CENTAVOS) {
      throw new RangeError("Monetary amount is outside the allowed range");
    }
    return centavos;
  }

  function fromCentavos(value) { return value / 100; }
  function money(value, options) { return fromCentavos(toCentavos(value, options)); }
  function sumMoney(values) { return fromCentavos(values.reduce((sum, value) => sum + toCentavos(value, { allowZero: true, allowNegative: true }), 0)); }

  function walletBalances(entries, baseBalances = {}) {
    const cents = {};
    Object.entries(baseBalances || {}).forEach(([method, amount]) => {
      try { cents[method] = toCentavos(amount, { allowZero: true, allowNegative: true }); } catch (_) { cents[method] = 0; }
    });
    (Array.isArray(entries) ? entries : []).forEach(entry => {
      const method = String(entry?.method || "Cash");
      let amount = 0;
      try { amount = toCentavos(entry?.amount, { allowZero: true }); } catch (_) { return; }
      cents[method] = (cents[method] || 0) + (entry?.type === "income" ? amount : -amount);
    });
    return Object.fromEntries(Object.entries(cents).map(([method, amount]) => [method, fromCentavos(amount)]));
  }

  function cleanText(value, label, maxLength) {
    const text = String(value == null ? "" : value).trim();
    if (!text || text.length > maxLength) throw new TypeError(`${label} must contain 1-${maxLength} characters`);
    return text;
  }

  function optionalText(value, maxLength) {
    const text = String(value == null ? "" : value).trim();
    if (text.length > maxLength) throw new TypeError(`Text must not exceed ${maxLength} characters`);
    return text;
  }

  function assertChoice(value, choices, label) {
    if (!choices.includes(value)) throw new TypeError(`Invalid ${label}`);
    return value;
  }

  function isDateKey(value) {
    if (!DATE_KEY_RE.test(String(value || ""))) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function manilaDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date).reduce((out, part) => ({ ...out, [part.type]: part.value }), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function entryDate(entry) {
    if (!entry) return null;
    if (isDateKey(entry.date)) return new Date(`${entry.date}T00:00:00+08:00`);
    const raw = entry.createdAt || entry.timestamp;
    if (raw && typeof raw.toDate === "function") return raw.toDate();
    if (raw && typeof raw.toMillis === "function") return new Date(raw.toMillis());
    if (raw instanceof Date) return raw;
    if (typeof raw === "string" || typeof raw === "number") {
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  function addMonthsClamped(value, months) {
    const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + Number(months));
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(day, lastDay));
    return date;
  }

  function storageKey(uid, name) {
    const safeUid = String(uid || "").replace(/[^A-Za-z0-9_-]/g, "");
    const safeName = String(name || "").replace(/[^A-Za-z0-9_-]/g, "");
    if (!safeUid || !safeName) throw new TypeError("A user and storage key are required");
    return `tipid_user_${safeUid}_${safeName}`;
  }

  function formatPeso(value, uid = window.TIPID_CURRENT_UID) {
    let amount;
    try { amount = money(value, { allowZero: true, allowNegative: true }); } catch (_) { amount = 0; }
    let hideCentavos = false;
    try { hideCentavos = Boolean(uid) && localStorage.getItem(storageKey(uid, "hide_centavos")) === "1"; } catch (_) {}
    return amount.toLocaleString("en-PH", {
      minimumFractionDigits: hideCentavos ? 0 : 2,
      maximumFractionDigits: hideCentavos ? 0 : 2
    });
  }

  function safeDialogText(title, text, options = {}) {
    if (!window.Swal) return Promise.resolve({ isConfirmed: false });
    return window.Swal.fire({ title: String(title), text: String(text), customClass: { popup: "tipid-swal" }, ...options });
  }

  function announce(message) {
    let live = document.getElementById("tipid-live-region");
    if (!live) {
      live = document.createElement("div");
      live.id = "tipid-live-region";
      live.className = "tipid-sr-live";
      live.setAttribute("role", "status");
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }
    live.textContent = "";
    setTimeout(() => { live.textContent = String(message); }, 20);
  }

  function updateNetworkStatus() {
    let banner = document.getElementById("tipid-offline-status");
    if (navigator.onLine === false) {
      if (!banner) {
        banner = document.createElement("div");
        banner.id = "tipid-offline-status";
        banner.className = "tipid-offline";
        banner.setAttribute("role", "status");
        banner.textContent = "Offline mode — isi-sync ang pagbabago kapag may internet na.";
        document.body.appendChild(banner);
      }
    } else if (banner) {
      banner.remove();
      announce("Online na ulit.");
    }
  }

  window.TipidCore = Object.freeze({
    toCentavos, fromCentavos, money, sumMoney, walletBalances, cleanText, optionalText,
    assertChoice, isDateKey, manilaDateKey, entryDate, addMonthsClamped,
    storageKey, formatPeso, safeDialogText, announce
  });

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", updateNetworkStatus);
  else updateNetworkStatus();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}), { once: true });
  }
})();
