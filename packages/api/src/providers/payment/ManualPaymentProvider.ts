import { randomBytes } from "node:crypto";
import { env } from "../../env";
import type { ChargeInstructions, ChargeRequest, PaymentProvider } from "./PaymentProvider";

/**
 * No live payment gateway: the payer transfers money manually using the
 * card/Sheba number in .env and enters the reference code shown here; an
 * admin marks the charge paid once they see it land in the account. Good
 * enough to launch ads/donations/charity before a real PSP is set up.
 */
export class ManualPaymentProvider implements PaymentProvider {
  async createCharge(req: ChargeRequest): Promise<ChargeInstructions> {
    const referenceCode = randomBytes(4).toString("hex").toUpperCase();
    const card = env.MANUAL_PAYMENT_CARD_NUMBER || "(شماره کارت در تنظیمات سرور ثبت نشده)";
    const sheba = env.MANUAL_PAYMENT_SHEBA || "";
    const owner = env.MANUAL_PAYMENT_OWNER_NAME || "";

    return {
      kind: "manual",
      referenceCode,
      instructions:
        `مبلغ ${req.amountToman.toLocaleString("fa-IR")} تومان را به شماره کارت ${card}` +
        (sheba ? ` (شبا: ${sheba})` : "") +
        (owner ? ` به نام ${owner}` : "") +
        ` واریز کنید و کد پیگیری «${referenceCode}» را در رسید یادداشت کنید. پس از تایید مدیر، فعال می‌شود.`,
    };
  }
}
