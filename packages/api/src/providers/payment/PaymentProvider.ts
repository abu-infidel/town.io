export interface ChargeRequest {
  amountToman: number;
  description: string;
  payerUserId: string;
}

export interface ChargeInstructions {
  /** "manual" charges have no redirect; the UI shows `instructions` instead. */
  kind: "manual" | "redirect";
  referenceCode: string;
  instructions?: string;
  redirectUrl?: string;
}

/**
 * Ads, donations, and charity contributions all go through this interface.
 * MVP ships `ManualPaymentProvider` (bank transfer + admin confirms by hand).
 * Swap PAYMENT_PROVIDER=zarinpal once you have merchant credentials - only
 * this file's factory (index.ts) needs to change, not the ads/donation/
 * charity modules that call it.
 */
export interface PaymentProvider {
  createCharge(req: ChargeRequest): Promise<ChargeInstructions>;
}
