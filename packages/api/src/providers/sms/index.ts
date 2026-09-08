import { env } from "../../env";
import type { SmsProvider } from "./SmsProvider";
import { ConsoleSmsProvider } from "./ConsoleSmsProvider";
import { KavenegarSmsProvider } from "./KavenegarSmsProvider";

export type { SmsProvider };

export const smsProvider: SmsProvider =
  env.SMS_PROVIDER === "kavenegar" ? new KavenegarSmsProvider() : new ConsoleSmsProvider();
