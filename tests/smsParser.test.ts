/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import { parseTransactionSms } from "@/lib/smsParser";

describe("Enhanced Philippine Bank & Digital Wallet SMS Parser", () => {
  const wallets = ["MariBank", "LandBank", "SeaBank", "GCash", "Maya", "BDO", "BPI", "Cash"];

  it("parses MariBank Debit Card payment SMS with merchant, category, and last 4 digits", () => {
    const sms =
      "You have paid PHP 450.00 to Starbucks using your MariBank Debit Card ending in 1234 on 14/11/2026. Ref: MB123456.";
    const result = parseTransactionSms(sms, wallets);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe("450.00");
    expect(result?.type).toBe("expense");
    expect(result?.method).toBe("MariBank");
    expect(result?.category).toBe("Food & Dining");
    expect(result?.desc).toBe("Starbucks");
    expect(result?.cardLastDigits).toBe("1234");
    expect(result?.bankDetected).toBe("MariBank");
  });

  it("parses MariBank incoming transfer / credit SMS as income", () => {
    const sms =
      "You received PHP 1,500.00 via InstaPay from Juan Dela Cruz in your MariBank Account. Ref: MB987654.";
    const result = parseTransactionSms(sms, wallets);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe("1500.00");
    expect(result?.type).toBe("income");
    expect(result?.method).toBe("MariBank");
    expect(result?.desc).toBe("Juan Dela Cruz");
    expect(result?.bankDetected).toBe("MariBank");
  });

  it("parses LandBank ATM charge SMS at supermarket", () => {
    const sms =
      "Your LandBank ATM card ending in 4321 was charged PHP 850.00 at SM Supermarket on 14-Nov-2026.";
    const result = parseTransactionSms(sms, wallets);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe("850.00");
    expect(result?.type).toBe("expense");
    expect(result?.method).toBe("LandBank");
    expect(result?.category).toBe("Groceries");
    expect(result?.desc).toBe("SM Supermarket");
    expect(result?.cardLastDigits).toBe("4321");
  });

  it("parses SeaBank Debit Card subscription SMS", () => {
    const sms = "You paid PHP 299.00 to Netflix using SeaBank Debit Card.";
    const result = parseTransactionSms(sms, wallets);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe("299.00");
    expect(result?.type).toBe("expense");
    expect(result?.method).toBe("SeaBank");
    expect(result?.desc).toBe("Netflix");
  });

  it("parses GCash sent and received SMS notifications correctly", () => {
    const sentSms =
      "You have sent PHP 500.00 of GCash to John Doe 09171234567 on 11-14-26 14:00. Ref. No. 123456789.";
    const sentResult = parseTransactionSms(sentSms, wallets);

    expect(sentResult).not.toBeNull();
    expect(sentResult?.amount).toBe("500.00");
    expect(sentResult?.type).toBe("expense");
    expect(sentResult?.method).toBe("GCash");

    const receivedSms =
      "You have received PHP 1,000.00 of GCash from Jane Smith 09181234567. Ref. No. 987654321.";
    const receivedResult = parseTransactionSms(receivedSms, wallets);

    expect(receivedResult).not.toBeNull();
    expect(receivedResult?.amount).toBe("1000.00");
    expect(receivedResult?.type).toBe("income");
    expect(receivedResult?.method).toBe("GCash");
  });

  it("gracefully falls back to Cash or first available wallet when no specific bank is named", () => {
    const genericSms = "Amount paid: PHP 120.00 for tricycle fare.";
    const result = parseTransactionSms(genericSms, wallets);

    expect(result).not.toBeNull();
    expect(result?.amount).toBe("120.00");
    expect(result?.type).toBe("expense");
    expect(result?.method).toBe("Cash");
  });
});
