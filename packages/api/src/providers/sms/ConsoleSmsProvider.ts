import type { SmsProvider } from "./SmsProvider";

/**
 * Default provider when no real SMS gateway is configured yet. Prints the
 * OTP to the api container's logs so the whole registration/login flow can
 * be built and tested end-to-end before a Kavenegar (or similar) account
 * exists. Never use this in a real deployment - swap SMS_PROVIDER=kavenegar
 * in .env once you have gateway credentials.
 */
export class ConsoleSmsProvider implements SmsProvider {
  async sendOtp(phone: string, code: string): Promise<void> {
    console.log(`[sms:console] OTP for ${phone}: ${code}`);
  }
}
