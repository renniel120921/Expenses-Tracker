/**
 * @vitest-environment happy-dom
 */
import { createApp, h, nextTick, reactive } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BillPaymentDialog, { type BillPaymentSettledResult } from "@/components/BillPaymentDialog.vue";
import type { BillRecord } from "@/types/finance";

describe("BillPaymentDialog interaction & ATM card deduction stage", () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    // Happy-DOM may not implement HTMLDialogElement.prototype.showModal/close natively
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute("open", "");
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      };
    }
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });

  it("lets the user pick an ATM card with projected balances and shows that physical card deducting on settlement", async () => {
    const bill: BillRecord = {
      id: "bill-meralco",
      title: "Meralco",
      amount: 1500,
      dueDate: "2026-11-15",
      category: "Utilities",
      recurrence: "monthly",
      status: "Unpaid",
      notes: ""
    };

    const state = reactive<{
      open: boolean;
      processing: boolean;
      paymentResult: BillPaymentSettledResult | null;
      emitted: Array<{ wallet: string | null }>;
    }>({
      open: true,
      processing: false,
      paymentResult: null,
      emitted: []
    });

    const app = createApp({
      render() {
        return h(BillPaymentDialog, {
          open: state.open,
          bill,
          wallets: ["LandBank", "GoTyme", "Cash"],
          walletBalances: { LandBank: 5000, GoTyme: 800, Cash: 200 },
          processing: state.processing,
          paymentResult: state.paymentResult,
          onConfirm: (payload: { wallet: string | null }) => {
            state.emitted.push(payload);
          },
          onClose: () => {
            state.open = false;
          }
        });
      }
    });

    app.mount(host);
    await nextTick();

    const landBankBtn = host.querySelector<HTMLButtonElement>('[data-wallet-option="LandBank"]');
    const goTymeBtn = host.querySelector<HTMLButtonElement>('[data-wallet-option="GoTyme"]');
    expect(landBankBtn).not.toBeNull();
    expect(landBankBtn?.textContent).toContain("Land Bank");
    expect(landBankBtn?.textContent).toContain("₱5,000.00");
    expect(landBankBtn?.textContent).toContain("₱3,500.00");
    expect(goTymeBtn?.textContent).toContain("Low balance");
    expect(goTymeBtn?.textContent).toContain("-₱700.00");

    landBankBtn?.click();
    await nextTick();
    expect(landBankBtn?.getAttribute("aria-checked")).toBe("true");

    const confirmBtn = host.querySelector<HTMLButtonElement>("[data-confirm-bill-payment]");
    confirmBtn?.click();
    expect(state.emitted).toEqual([{ wallet: "LandBank" }]);

    // Transition into settled ATM Card deduction view
    state.paymentResult = {
      wallet: "LandBank",
      beforeBalance: 5000,
      afterBalance: 3500,
      nextDueDate: "2026-12-15"
    };
    await nextTick();

    const stage = host.querySelector(".tipid-deduct-stage");
    expect(stage).not.toBeNull();
    expect(stage?.textContent).toContain("-₱1,500.00");
    expect(stage?.textContent).toContain("Land Bank");
    expect(stage?.textContent).toContain("₱5,000.00");
    expect(stage?.textContent).toContain("₱3,500.00");
    expect(host.querySelector(".tipid-bank-card")).not.toBeNull();
    expect(host.textContent).toContain("2026-12-15");

    const doneBtn = host.querySelector<HTMLButtonElement>("[data-payment-done]");
    doneBtn?.click();
    await nextTick();
    expect(state.open).toBe(false);

    app.unmount();
  });
});
