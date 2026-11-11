import { describe, it, expect } from "vitest";
import { createApp, h } from "vue";
import { SUPPORTED_WALLETS } from "@/lib/core";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { getCategoryIcon, getWalletKindIcon } from "@/lib/categoryIcons";
import WalletCard from "@/components/WalletCard.vue";

describe("Wallet visual identity & realistic card metadata", () => {
  it("resolves every supported institution by canonical ID without falling back to Account", () => {
    for (const wallet of SUPPORTED_WALLETS) {
      const visual = resolveWalletVisual(wallet.id);
      expect(visual.id).toBe(wallet.id);
      expect(visual.displayName).toBe(wallet.name);
      expect(visual.kind).toBe(wallet.type);
      expect(visual.kindLabel).not.toBe("Account");
      expect(visual.monogram.length).toBeGreaterThanOrEqual(1);
      expect(visual.surfaceStart).toMatch(/^#[0-9A-F]{6}$/i);
      expect(visual.surfaceEnd).toMatch(/^#[0-9A-F]{6}$/i);
      expect(visual.cardLast4).toMatch(/^\d{4}$/);
    }
  });

  it("matches LandBank variants case-insensitively and preserves bank classification", () => {
    for (const alias of ["LandBank", "landbank", "Land Bank"]) {
      const v = resolveWalletVisual(alias);
      expect(v.id).toBe("LandBank");
      expect(v.displayName).toBe("Land Bank");
      expect(v.kind).toBe("bank");
      expect(v.kindLabel).toBe("Bank");
      expect(v.monogram).toBe("LB");
      expect(v.chipFinish).toBe("gold");
    }
  });

  it("handles unknown custom account names safely with fallback finish", () => {
    const custom = resolveWalletVisual("Cooperative Vault");
    expect(custom.displayName).toBe("Cooperative Vault");
    expect(custom.kind).toBe("bank");
    expect(custom.monogram).toBe("COO");
    expect(custom.cardLast4).toMatch(/^\d{4}$/);
  });

  it("maps categories and wallet kinds to real vector icon components", () => {
    const dining = getCategoryIcon("Food & Dining", "expense");
    const diningTl = getCategoryIcon("Pagkain", "expense");
    const bnpl = getCategoryIcon("Credit Card & BNPL");
    const income = getCategoryIcon("Salary", "income");

    expect(dining).toBeTruthy();
    expect(dining).toBe(diningTl);
    expect(bnpl).toBeTruthy();
    expect(income).not.toBe(dining);
    expect(getWalletKindIcon("cash")).not.toBe(getWalletKindIcon("bank"));
    expect(getWalletKindIcon("ewallet")).not.toBe(getWalletKindIcon("cash"));
  });

  it("renders WalletCard instances with unique EMV chip gradient IDs, masked mode, and overdrawn labels", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const app = createApp({
      render() {
        return h("div", [
          h(WalletCard, { method: "Cash", balance: 0, totalPositiveBalance: 100 }),
          h(WalletCard, { method: "LandBank", balance: 100, totalPositiveBalance: 100 }),
          h(WalletCard, { method: "BDO", balance: -45.5, totalPositiveBalance: 100 }),
          h(WalletCard, { method: "GCash", balance: 500, totalPositiveBalance: 600, balanceHidden: true })
        ]);
      }
    });

    app.mount(host);

    const html = host.innerHTML;
    expect(html).toContain("Land Bank");
    expect(html).toContain("CASH ON HAND");
    expect(html).toContain("100% share");
    expect(html).toContain("Overdrawn");
    expect(html).toContain("₱••••••");
    expect(host.querySelectorAll('button[aria-label="Adjust Land Bank balance"]')).toHaveLength(1);

    const grads = Array.from(host.querySelectorAll("linearGradient")).map((el) => el.id);
    expect(grads.length).toBeGreaterThanOrEqual(2);
    expect(new Set(grads).size).toBe(grads.length);

    app.unmount();
    host.remove();
  });
});
