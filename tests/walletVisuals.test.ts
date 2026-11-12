import { describe, it, expect } from "vitest";
import { createApp, h, nextTick } from "vue";
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
      expect(visual.surfaceMid).toMatch(/^#[0-9A-F]{6}$/i);
      expect(visual.surfaceEnd).toMatch(/^#[0-9A-F]{6}$/i);
      expect(visual.stripeColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(visual.inkColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(["brushed-metal", "satin-matte", "pearl-foil", "carbon-weave", "guilloche"]).toContain(visual.material);
      expect(["VISA", "MC", "INSTAPAY", "BANCNET", "CASH"]).toContain(visual.network);
      expect(["wave", "prism", "rings", "mesh", "horizon"]).toContain(visual.motif);
      expect(visual.cardLast4).toMatch(/^\d{4}$/);
      expect(visual.cardNumberGroups).toHaveLength(4);
      expect(visual.cardNumberGroups.join("")).toMatch(/^\d{16}$/);
      expect(visual.cardNumberGroups[3]).toBe(visual.cardLast4);
      expect(visual.validThru).toMatch(/^(0[1-9]|1[0-2])\/\d{2}$/);
      expect(visual.cvc).toMatch(/^\d{3}$/);
      expect(visual.issuerNotice.length).toBeGreaterThan(5);
    }
  });

  it("assigns signature physical card materials and payment networks to Digital Banks", () => {
    const gotyme = resolveWalletVisual("GoTyme");
    const maya = resolveWalletVisual("Maya");
    const seabank = resolveWalletVisual("SeaBank");
    const unionDigital = resolveWalletVisual("UnionDigital");
    const cimb = resolveWalletVisual("CIMB");

    expect(gotyme.kind).toBe("digital");
    expect(gotyme.material).toBe("satin-matte");
    expect(gotyme.network).toBe("VISA");
    expect(maya.material).toBe("carbon-weave");
    expect(maya.network).toBe("VISA");
    expect(seabank.network).toBe("MC");
    expect(unionDigital.material).toBe("brushed-metal");
    expect(cimb.material).toBe("pearl-foil");
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
          h(WalletCard, { method: "GCash", balance: 500, totalPositiveBalance: 600, balanceHidden: true }),
          h(WalletCard, { method: "GoTyme", balance: 1250, totalPositiveBalance: 2000 }),
          h(WalletCard, { method: "Maya", balance: 450, totalPositiveBalance: 2000 }),
          h(WalletCard, { method: "SeaBank", balance: 300, totalPositiveBalance: 2000 })
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
    expect(html).toContain("VISA");
    expect(host.querySelectorAll('button[aria-label="Adjust Land Bank balance"]')).toHaveLength(1);
    expect(host.querySelectorAll('.tipid-bank-card[data-material="satin-matte"]')).toHaveLength(2);
    expect(host.querySelectorAll('.tipid-bank-card[data-material="carbon-weave"]')).toHaveLength(1);
    expect(host.querySelectorAll(".tipid-card-texture")).toHaveLength(7);

    const grads = Array.from(host.querySelectorAll("linearGradient")).map((el) => el.id);
    expect(grads.length).toBeGreaterThanOrEqual(8);
    expect(new Set(grads).size).toBe(grads.length);

    app.unmount();
    host.remove();
  });

  it("flips between front and back ATM card faces on click, shows card number/expiry/CVC, and isolates Edit button", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const edited: string[] = [];

    const gotyme = resolveWalletVisual("GoTyme");
    const app = createApp({
      render() {
        return h("div", [
          h(WalletCard, {
            method: "GoTyme",
            balance: 2400,
            totalPositiveBalance: 2400,
            onEdit: (m: string) => edited.push(m)
          }),
          h(WalletCard, {
            method: "Maya",
            balance: 1000,
            totalPositiveBalance: 2400,
            balanceHidden: true
          }),
          h(WalletCard, {
            method: "SeaBank",
            balance: 500,
            totalPositiveBalance: 2400,
            isDeckInactive: true
          })
        ]);
      }
    });

    app.mount(host);
    await nextTick();

    const cards = Array.from(host.querySelectorAll<HTMLElement>(".tipid-bank-card"));
    const gotymeCard = cards[0]!;
    const mayaCard = cards[1]!;
    const seabankCard = cards[2]!;

    expect(gotymeCard.classList.contains("is-flipped")).toBe(false);
    expect(gotymeCard.querySelector(".tipid-card-back")?.getAttribute("aria-hidden")).toBe("true");
    expect(seabankCard.querySelector(".tipid-card-flip-hit")).toBeNull();

    // Edit button must trigger onEdit without flipping the card
    const editBtn = gotymeCard.querySelector<HTMLButtonElement>('button[aria-label="Adjust GoTyme Bank balance"]')!;
    editBtn.click();
    await nextTick();
    expect(edited).toEqual(["GoTyme"]);
    expect(gotymeCard.classList.contains("is-flipped")).toBe(false);

    // Clicking the card flips smoothly to the ATM card back
    const flipFrontBtn = gotymeCard.querySelector<HTMLButtonElement>(".tipid-card-front .tipid-card-flip-hit")!;
    flipFrontBtn.click();
    await nextTick();

    expect(gotymeCard.classList.contains("is-flipped")).toBe(true);
    expect(gotymeCard.querySelector(".tipid-card-front")?.getAttribute("aria-hidden")).toBe("true");
    expect(gotymeCard.querySelector(".tipid-card-back")?.hasAttribute("aria-hidden")).toBe(false);
    expect(gotymeCard.querySelector(".tipid-card-magstripe")).toBeTruthy();
    expect(gotymeCard.querySelector(".tipid-card-sigstrip")).toBeTruthy();
    expect(gotymeCard.textContent).toContain(gotyme.cardNumberGroups.join("  "));
    expect(gotymeCard.textContent).toContain(gotyme.validThru);
    expect(gotymeCard.textContent).toContain(gotyme.cvc);

    // Flipping back returns cleanly to front
    const flipBackBtn = gotymeCard.querySelector<HTMLButtonElement>(".tipid-card-back .tipid-card-flip-hit")!;
    flipBackBtn.click();
    await nextTick();
    expect(gotymeCard.classList.contains("is-flipped")).toBe(false);

    // Privacy-hidden card masks 16-digit PAN prefix, VALID THRU, and CVC on the back
    mayaCard.querySelector<HTMLButtonElement>(".tipid-card-front .tipid-card-flip-hit")!.click();
    await nextTick();
    const mayaBackText = mayaCard.querySelector(".tipid-card-back")?.textContent ?? "";
    expect(mayaBackText).toContain("••••  ••••  ••••");
    expect(mayaBackText).toContain("••/••");
    expect(mayaBackText).toContain("•••");

    app.unmount();
    host.remove();
  });
});
