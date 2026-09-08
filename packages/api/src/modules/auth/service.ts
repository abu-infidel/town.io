import { randomBytes } from "node:crypto";
import { prisma } from "../../db";
import { generateOtpCode, hashSecret, verifySecret } from "../../lib/otp";
import { smsProvider } from "../../providers/sms";
import { isOldEnough, normalizeIranPhone } from "@mahalle/shared";

const OTP_TTL_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

export class AuthError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function requestOtp(rawPhone: string) {
  const phone = normalizeIranPhone(rawPhone);
  if (!phone) throw new AuthError("شماره موبایل معتبر نیست");

  const code = generateOtpCode();
  await prisma.phoneVerification.create({
    data: {
      phone,
      codeHash: hashSecret(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  await smsProvider.sendOtp(phone, code);
}

interface VerifyOtpInput {
  phone: string;
  code: string;
  birthdate?: string;
  displayName?: string;
  neighborhood?: string;
}

function randomHandle(): string {
  return `user-${randomBytes(4).toString("hex")}`;
}

export async function verifyOtpAndAuthenticate(input: VerifyOtpInput) {
  const phone = normalizeIranPhone(input.phone);
  if (!phone) throw new AuthError("شماره موبایل معتبر نیست");

  const verification = await prisma.phoneVerification.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) throw new AuthError("کدی برای این شماره درخواست نشده است");
  if (verification.expiresAt < new Date()) throw new AuthError("کد منقضی شده است");
  if (verification.attempts >= MAX_OTP_ATTEMPTS) throw new AuthError("تعداد تلاش‌ها بیش از حد مجاز است");

  const ok = verifySecret(input.code, verification.codeHash);
  if (!ok) {
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    throw new AuthError("کد وارد شده نادرست است");
  }

  await prisma.phoneVerification.update({
    where: { id: verification.id },
    data: { consumedAt: new Date() },
  });

  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    // First time we see this phone -> registration path.
    if (!input.birthdate || !input.displayName) {
      throw new AuthError("برای ثبت‌نام، تاریخ تولد و نام نمایشی لازم است", 422);
    }
    if (!isOldEnough(input.birthdate)) {
      throw new AuthError("عضویت در این پلتفرم برای افراد زیر ۱۶ سال امکان‌پذیر نیست", 403);
    }

    user = await prisma.user.create({
      data: {
        phone,
        displayName: input.displayName,
        neighborhood: input.neighborhood,
        birthdate: new Date(input.birthdate),
        profile: {
          create: {
            handle: randomHandle(),
            pages: {
              create: [
                { kind: "about", title: "درباره من", order: 0 },
                { kind: "achievements", title: "دستاوردها", order: 1 },
                { kind: "career", title: "مسیر شغلی", order: 2 },
                { kind: "interests", title: "علایق", order: 3 },
              ],
            },
          },
        },
      },
    });
  }

  return user;
}
