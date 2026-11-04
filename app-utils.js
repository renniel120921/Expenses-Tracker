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

  let updateAccepted = false;
  let updateReloadStarted = false;

  function showUpdatePrompt(registration, worker = registration.waiting) {
    if (!navigator.serviceWorker.controller || !worker || document.getElementById("tipid-update-prompt")) return;

    const prompt = document.createElement("aside");
    prompt.id = "tipid-update-prompt";
    prompt.className = "tipid-update-prompt";
    prompt.setAttribute("role", "status");
    prompt.setAttribute("aria-live", "polite");

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = "May bagong bersyon ng Tipid.";
    const description = document.createElement("span");
    description.textContent = "Refresh para makuha ang latest update.";
    copy.append(title, description);

    const actions = document.createElement("div");
    actions.className = "tipid-update-actions";
    const later = document.createElement("button");
    later.type = "button";
    later.className = "tipid-update-later";
    later.textContent = "Mamaya";
    later.addEventListener("click", () => prompt.remove());
    const update = document.createElement("button");
    update.type = "button";
    update.className = "tipid-update-now";
    update.textContent = "Update Now";
    update.addEventListener("click", () => {
      if (updateAccepted) return;
      updateAccepted = true;
      update.disabled = true;
      later.disabled = true;
      update.textContent = "Ina-update…";
      (registration.waiting || worker).postMessage({ type: "SKIP_WAITING" });
    });
    actions.append(later, update);
    prompt.append(copy, actions);
    document.body.appendChild(prompt);
  }

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      if (registration.waiting) showUpdatePrompt(registration);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) showUpdatePrompt(registration, worker);
        });
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }

  const TipidReminders = {
    isSupported() {
      return typeof window !== "undefined" && "Notification" in window;
    },
    getPermission() {
      if (!this.isSupported()) return "unsupported";
      return Notification.permission;
    },
    async requestPermission() {
      if (!this.isSupported()) return "unsupported";
      try {
        return await Notification.requestPermission();
      } catch (err) {
        console.warn("[TipidReminders] Notification permission request error:", err);
        return Notification.permission;
      }
    },
    async sendNotification(title, options = {}) {
      const opts = {
        icon: "/assets/logo-512.png",
        badge: "/assets/favicon-32.png",
        tag: options.tag || "tipid-reminder",
        renotify: true,
        body: options.body || "Mag-log ng iyong mga nagastos at kita ngayon sa Tipid!",
        ...options,
      };

      if (this.isSupported() && Notification.permission === "granted") {
        try {
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && typeof reg.showNotification === "function") {
              await reg.showNotification(title, opts);
              return true;
            }
          }
          new Notification(title, opts);
          return true;
        } catch (e) {
          console.warn("[TipidReminders] Native notification failed, falling back to in-app alert:", e);
        }
      }

      announce(`${title}: ${opts.body}`);
      if (window.Swal) {
        window.Swal.fire({
          title,
          text: opts.body,
          icon: "info",
          confirmButtonColor: "#1F6F54",
          customClass: { popup: "tipid-swal" },
        });
      }
      return false;
    },
    async checkAndTriggerDaily(uid, settings = {}) {
      if (!uid || settings.dailyReminders === false) return false;
      const today = manilaDateKey();
      if (!today) return false;

      let localLast = null;
      try {
        localLast = localStorage.getItem(storageKey(uid, "last_daily_reminder"));
      } catch (_) {}

      if (localLast === today || settings.lastReminderDate === today) {
        return false;
      }

      const timeStr = settings.reminderTime || "20:00";
      const parts = timeStr.split(":").map(Number);
      const schedHours = Number.isFinite(parts[0]) ? parts[0] : 20;
      const schedMins = Number.isFinite(parts[1]) ? parts[1] : 0;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();

      if (currentHours > schedHours || (currentHours === schedHours && currentMins >= schedMins)) {
        await this.sendNotification("Tipid Daily Reminder 💡", {
          body: "Kumusta ang araw mo? Huwag kalimutang i-record ang iyong mga nagastos at kita ngayon!",
          tag: "tipid-daily-reminder",
        });

        try {
          localStorage.setItem(storageKey(uid, "last_daily_reminder"), today);
        } catch (_) {}

        if (window.TipidData && typeof window.TipidData.recordReminderTriggered === "function") {
          window.TipidData.recordReminderTriggered(uid, today).catch(() => {});
        }
        return true;
      }
      return false;
    },
  };

  const TRANSLATIONS = {
    en: {
      nav_home: "Home",
      nav_bills: "Bills",
      nav_debts: "Debts",
      nav_groceries: "Groceries",
      nav_receipts: "Receipts",
      nav_budget: "Budget",
      nav_analytics: "Analytics",
      nav_history: "History",
      nav_installments: "Installments",
      nav_account: "Account",
      nav_menu: "Menu",
      nav_planning: "Planning",
      nav_settings: "Settings",
      nav_more: "More",
      nav_close: "Close",
      nav_tools: "Tools",
      nav_quick_tools: "Quick Tools",
      nav_dark_mode: "Dark Mode",
      nav_light_mode: "Light Mode",
      nav_dark: "Dark",
      nav_light: "Light",
      nav_logout: "Log out",

      dash_cockpit: "Expenses Tracker Cockpit",
      dash_greeting: "Good day",
      dash_this_month: "This Month",
      dash_this_week: "This Week",
      dash_30_days: "30 Days",
      dash_all_time: "All Time",
      dash_upcoming_bills: "Upcoming Bills",
      dash_debts_utang: "Debts & Utang",
      dash_wallets: "Accounts & Wallets",
      dash_recent_trans: "Recent Transactions",
      dash_new_trans: "New Transaction",
      dash_view_all: "View All",
      dash_add_new: "+ Add",

      common_back: "Back",
      common_save: "Save",
      common_saving: "Saving...",
      common_saved: "Saved!",
      common_cancel: "Cancel",
      common_delete: "Delete",
      common_edit: "Edit",
      common_add: "Add",
      common_confirm: "Confirm",
      common_loading: "Loading...",
      common_all: "All",
      common_success: "Success",
      common_error: "Error",

      lang_name: "English",
      lang_updated_title: "Language Updated",
      lang_updated_desc: "System language successfully updated to English."
    },
    tl: {
      nav_home: "Tahanan",
      nav_bills: "Mga Bayarin",
      nav_debts: "Utang",
      nav_groceries: "Pamilihan",
      nav_receipts: "Resibo",
      nav_budget: "Badyet",
      nav_analytics: "Pagsusuri",
      nav_history: "Kasaysayan",
      nav_installments: "Hulugan",
      nav_account: "Account",
      nav_menu: "Menu",
      nav_planning: "Pagpaplano",
      nav_settings: "Mga Setting",
      nav_more: "Iba Pa",
      nav_close: "Isara",
      nav_tools: "Mga Tool",
      nav_quick_tools: "Mabilisang Aksyon",
      nav_dark_mode: "Madilim na Mode",
      nav_light_mode: "Maliwanag na Mode",
      nav_dark: "Madilim",
      nav_light: "Maliwanag",
      nav_logout: "Mag-log out",

      dash_cockpit: "Sentro ng Pagsubaybay sa Gastos",
      dash_greeting: "Magandang araw",
      dash_this_month: "Ngayong Buwan",
      dash_this_week: "Ngayong Linggo",
      dash_30_days: "30 Araw",
      dash_all_time: "Kabuuan",
      dash_upcoming_bills: "Paparating na Bayarin",
      dash_debts_utang: "Utang at Pautang",
      dash_wallets: "Mga Account at Wallet",
      dash_recent_trans: "Kamakailang Transaksyon",
      dash_new_trans: "Bagong Transaksyon",
      dash_view_all: "Tingnan Lahat",
      dash_add_new: "+ Magdagdag",

      common_back: "Bumalik",
      common_save: "I-save",
      common_saving: "Inise-save...",
      common_saved: "Nai-save na!",
      common_cancel: "Kanselahin",
      common_delete: "Burahin",
      common_edit: "I-edit",
      common_add: "Magdagdag",
      common_confirm: "Kumpirmahin",
      common_loading: "Naglo-load...",
      common_all: "Lahat",
      common_success: "Tagumpay",
      common_error: "May Error",

      lang_name: "Tagalog",
      lang_updated_title: "Wika ay Pinalitan",
      lang_updated_desc: "Matagumpay na pinalitan ang wika sa buong system bilang Tagalog."
    }
  };

  const TipidI18n = {
    getLanguage(uid) {
      try {
        if (uid && typeof localStorage !== "undefined") {
          const userVal = localStorage.getItem(storageKey(uid, "lang"));
          if (userVal === "tl" || userVal === "en") return userVal;
        }
        if (typeof localStorage !== "undefined") {
          const globalVal = localStorage.getItem("tipid_lang");
          if (globalVal === "tl" || globalVal === "en") return globalVal;
        }
      } catch (_) {}
      return "en";
    },

    setLanguage(lang, uid) {
      const safeLang = (lang === "tl" || lang === "fil") ? "tl" : "en";
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("tipid_lang", safeLang);
          if (uid) {
            localStorage.setItem(storageKey(uid, "lang"), safeLang);
          }
        }
        if (typeof document !== "undefined" && document.documentElement) {
          document.documentElement.lang = safeLang === "tl" ? "fil" : "en";
        }
      } catch (_) {}

      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        try {
          window.dispatchEvent(new CustomEvent("tipid-language-change", { detail: { lang: safeLang } }));
        } catch (_) {}
      }
      return safeLang;
    },

    t(key, fallback = "") {
      const current = this.getLanguage(typeof window !== "undefined" ? window.TIPID_CURRENT_UID : null);
      const dict = TRANSLATIONS[current] || TRANSLATIONS.en;
      if (dict && key in dict) return dict[key];
      if (TRANSLATIONS.en && key in TRANSLATIONS.en) return TRANSLATIONS.en[key];
      return fallback || key;
    },

    getTranslations(lang) {
      const active = lang || this.getLanguage(typeof window !== "undefined" ? window.TIPID_CURRENT_UID : null);
      return TRANSLATIONS[active] || TRANSLATIONS.en;
    }
  };

  const TipidCelebration = {
    playChime() {
      if (typeof window === "undefined") return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const now = ctx.currentTime;
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.55);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.6);
        });
      } catch (_) {}
    },

    triggerHaptics() {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try {
          navigator.vibrate([30, 40, 50, 40]);
        } catch (_) {}
      }
    },

    triggerConfetti(options = {}) {
      if (typeof document === "undefined" || !document.createElement || !document.body) return;
      try {
        const existing = document.getElementById("tipid-confetti-canvas");
        if (existing) existing.remove();

        const canvas = document.createElement("canvas");
        canvas.id = "tipid-confetti-canvas";
        canvas.style.position = "fixed";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = "999999";
        document.body.appendChild(canvas);

        const ctx = canvas.getContext ? canvas.getContext("2d") : null;
        if (!ctx) {
          canvas.remove();
          return;
        }

        const width = (canvas.width = window.innerWidth || 800);
        const height = (canvas.height = window.innerHeight || 600);

        const colors = ["#1F6F54", "#52B788", "#F5A623", "#2D6A4F", "#D8F3DC", "#FFD166", "#06D6A0", "#118AB2", "#EF476F"];
        const count = options.count || 80;
        const particles = [];

        for (let i = 0; i < count; i++) {
          particles.push({
            x: width * (0.2 + Math.random() * 0.6),
            y: height * 0.35 + (Math.random() - 0.5) * 60,
            vx: (Math.random() - 0.5) * 16,
            vy: -Math.random() * 12 - 4,
            size: Math.random() * 8 + 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 12,
            wobble: Math.random() * 10,
            wobbleSpeed: Math.random() * 0.1 + 0.05,
            opacity: 1,
            shape: Math.random() > 0.4 ? "rect" : "circle"
          });
        }

        let animId = null;
        const startTime = Date.now();
        const duration = options.duration || 3500;

        const render = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed > duration) {
            cancelAnimationFrame(animId);
            canvas.remove();
            return;
          }

          ctx.clearRect(0, 0, width, height);

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.38;
            p.vx *= 0.98;
            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed;

            if (elapsed > duration - 800) {
              p.opacity = Math.max(0, (duration - elapsed) / 800);
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;

            if (p.shape === "circle") {
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
            }

            ctx.restore();
          }

          animId = requestAnimationFrame(render);
        };

        animId = requestAnimationFrame(render);
      } catch (_) {}
    },

    cheer(options = {}) {
      return this.celebrate(options);
    },

    celebrate(options = {}) {
      const title = typeof options === "string" ? options : (options.title || "Hooray! 🎉");
      const message = typeof options === "object" ? (options.message || "") : "";
      
      this.playChime();
      this.triggerHaptics();
      this.triggerConfetti(typeof options === "object" ? options : {});

      if (typeof window !== "undefined" && window.Swal && (title || message)) {
        window.Swal.fire({
          icon: "success",
          title: TipidCore.safeDialogText(title),
          text: message ? TipidCore.safeDialogText(message) : undefined,
          confirmButtonText: "Sige! / Great!",
          confirmButtonColor: "#1F6F54",
          customClass: { popup: "tipid-swal" },
          timer: 4500,
          timerProgressBar: true
        });
      }
    }
  };

  function bufferToBase64Url(buffer) {
    if (!buffer) return "";
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function base64UrlToBuffer(base64url) {
    if (!base64url) return new Uint8Array(0);
    let base64 = String(base64url).replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  const TipidBiometrics = {
    isSupported() {
      if (typeof window === "undefined" || !window.isSecureContext) return false;
      if (typeof window.PublicKeyCredential === "undefined") return false;
      if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") return false;
      // W3C WebAuthn strictly prohibits raw IP addresses (e.g. 127.0.0.1 or 192.168.x.x)
      const hostname = window.location.hostname || "";
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return false;
      return true;
    },

    async isAvailable() {
      try {
        if (!this.isSupported()) return false;
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (_) {
        return false;
      }
    },

    isEnabled(uid) {
      if (!uid || typeof localStorage === "undefined") return false;
      try {
        return localStorage.getItem(`tipid_biometrics_enabled_${uid}`) === "true";
      } catch (_) {
        return false;
      }
    },

    setEnabled(uid, enabled) {
      if (!uid || typeof localStorage === "undefined") return;
      try {
        if (enabled) {
          localStorage.setItem(`tipid_biometrics_enabled_${uid}`, "true");
        } else {
          localStorage.removeItem(`tipid_biometrics_enabled_${uid}`);
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.removeItem(`tipid_biometrics_unlocked_${uid}`);
          }
        }
      } catch (_) {}
    },

    isSessionUnlocked(uid) {
      if (!uid || typeof sessionStorage === "undefined") return true;
      if (!this.isEnabled(uid)) return true;
      try {
        return sessionStorage.getItem(`tipid_biometrics_unlocked_${uid}`) === "true";
      } catch (_) {
        return false;
      }
    },

    setSessionUnlocked(uid, unlocked) {
      if (!uid || typeof sessionStorage === "undefined") return;
      try {
        if (unlocked) {
          sessionStorage.setItem(`tipid_biometrics_unlocked_${uid}`, "true");
        } else {
          sessionStorage.removeItem(`tipid_biometrics_unlocked_${uid}`);
        }
      } catch (_) {}
    },

    hasPasscode(uid) {
      if (!uid || typeof localStorage === "undefined") return false;
      try {
        return !!localStorage.getItem(`tipid_biometrics_pin_${uid}`);
      } catch (_) {
        return false;
      }
    },

    async hashPin(uid, pin) {
      if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
        const enc = new TextEncoder();
        const buf = await window.crypto.subtle.digest("SHA-256", enc.encode(`${pin}__tipid__${uid}`));
        const arr = Array.from(new Uint8Array(buf));
        return arr.map(b => b.toString(16).padStart(2, "0")).join("");
      }
      return `${uid}_${pin}_fallback`;
    },

    async setPasscode(uid, pin) {
      if (!uid || !pin || typeof localStorage === "undefined") return false;
      try {
        const hash = await this.hashPin(uid, pin);
        localStorage.setItem(`tipid_biometrics_pin_${uid}`, hash);
        return true;
      } catch (_) {
        return false;
      }
    },

    async verifyPasscode(uid, pin) {
      if (!uid || !pin || typeof localStorage === "undefined") return false;
      try {
        const stored = localStorage.getItem(`tipid_biometrics_pin_${uid}`);
        if (!stored) return false;
        const currentHash = await this.hashPin(uid, pin);
        if (stored === currentHash) {
          this.setSessionUnlocked(uid, true);
          return true;
        }
        return false;
      } catch (_) {
        return false;
      }
    },

    async register(uid, email = "user@tipid.app") {
      const hostname = (typeof window !== "undefined" && window.location.hostname) || "";
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
        throw new Error("WebAuthn does not allow raw IP addresses (" + hostname + "). Please use 'localhost' or your domain, or use the Backup PIN Passcode.");
      }
      if (!this.isSupported()) {
        throw new Error("Biometric authentication is not supported on this connection (requires HTTPS or localhost). Please use Backup PIN Passcode.");
      }
      const available = await this.isAvailable();
      if (!available) {
        throw new Error("No platform authenticator (Face ID / Touch ID / Fingerprint) was detected on this device. Please use Backup PIN Passcode.");
      }

      const challenge = new Uint8Array(32);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(challenge);
      }

      const userId = new TextEncoder().encode(uid || "tipid_user");
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Tipid Expense Tracker", id: window.location.hostname },
          user: {
            id: userId,
            name: email,
            displayName: email.split("@")[0] || "Tipid User"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },  // ES256
            { type: "public-key", alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "preferred",
            residentKey: "preferred"
          },
          timeout: 60000
        }
      });

      if (credential) {
        const credId = credential.rawId ? bufferToBase64Url(credential.rawId) : credential.id;
        if (credId) {
          localStorage.setItem(`tipid_biometrics_cred_id_${uid}`, credId);
        }
        this.setEnabled(uid, true);
        this.setSessionUnlocked(uid, true);
        return true;
      }
      return false;
    },

    async verify(uid) {
      if (!uid) return true;
      if (!this.isEnabled(uid)) return true;
      if (!this.isSupported()) {
        if (this.hasPasscode(uid)) return "prompt_pin";
        return false;
      }

      const challenge = new Uint8Array(32);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(challenge);
      }

      const credId = localStorage.getItem(`tipid_biometrics_cred_id_${uid}`);
      const options = {
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: "preferred",
          timeout: 60000
        }
      };

      if (credId) {
        try {
          const bytes = base64UrlToBuffer(credId);
          if (bytes && bytes.length > 0) {
            options.publicKey.allowCredentials = [{
              type: "public-key",
              id: bytes
            }];
          }
        } catch (_) {}
      }

      try {
        const assertion = await navigator.credentials.get(options);
        if (assertion) {
          this.setSessionUnlocked(uid, true);
          return true;
        }
      } catch (err) {
        console.warn("[TipidBiometrics] Verification exception:", err);
        throw err;
      }
      return false;
    },

    disable(uid) {
      if (!uid) return;
      this.setEnabled(uid, false);
      try {
        localStorage.removeItem(`tipid_biometrics_cred_id_${uid}`);
        localStorage.removeItem(`tipid_biometrics_pin_${uid}`);
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem(`tipid_biometrics_unlocked_${uid}`);
        }
      } catch (_) {}
    }
  };

  window.TipidCore = Object.freeze({
    toCentavos, fromCentavos, money, sumMoney, walletBalances, cleanText, optionalText,
    assertChoice, isDateKey, manilaDateKey, entryDate, addMonthsClamped,
    storageKey, formatPeso, safeDialogText, announce, i18n: TipidI18n,
    celebration: TipidCelebration, biometrics: TipidBiometrics
  });

  window.TipidI18n = TipidI18n;

  window.TipidReminders = TipidReminders;
  window.TipidCelebration = TipidCelebration;
  window.TipidBiometrics = TipidBiometrics;

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", updateNetworkStatus);
  else updateNetworkStatus();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!updateAccepted || updateReloadStarted) return;
      updateReloadStarted = true;
      window.location.reload();
    });
    window.addEventListener("load", registerServiceWorker, { once: true });
  }
})();
