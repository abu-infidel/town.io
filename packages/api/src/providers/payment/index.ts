import type { PaymentProvider } from "./PaymentProvider";
import { ManualPaymentProvider } from "./ManualPaymentProvider";

export type * from "./PaymentProvider";

// PAYMENT_PROVIDER=zarinpal is reserved for when real merchant credentials
// exist; only ManualPaymentProvider is implemented in this phase.
export const paymentProvider: PaymentProvider = new ManualPaymentProvider();
