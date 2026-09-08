export interface SmsProvider {
  /** phone is already normalized to +989XXXXXXXXX */
  sendOtp(phone: string, code: string): Promise<void>;
}
