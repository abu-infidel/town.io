import type { SmsProvider } from "./SmsProvider";
import { env } from "../../env";

/**
 * Targets Kavenegar's "Verify Lookup" OTP endpoint, which is representative
 * of the Iranian SMS gateways (Kavenegar/Ghasedak/Melipayamak/ippanel all
 * expose a similar template-based verify-SMS REST call). If you use a
 * different gateway, this is the one file to swap - everything else in the
 * app only ever talks to the SmsProvider interface.
 */
export class KavenegarSmsProvider implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    if (!env.KAVENEGAR_API_KEY) {
      throw new Error("KAVENEGAR_API_KEY is not set");
    }
    const receptor = phone.replace(/^\+98/, "0"); // Kavenegar expects local format
    const url = new URL(`https://api.kavenegar.com/v1/${env.KAVENEGAR_API_KEY}/verify/lookup.json`);
    url.searchParams.set("receptor", receptor);
    url.searchParams.set("token", code);
    url.searchParams.set("template", env.KAVENEGAR_TEMPLATE ?? "mahalle-otp");

    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Kavenegar OTP send failed: ${res.status} ${body}`);
    }
  }
}
