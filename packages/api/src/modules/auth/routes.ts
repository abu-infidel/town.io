import { Router } from "express";
import { requestOtpSchema, verifyOtpSchema } from "@mahalle/shared";
import { AuthError, requestOtp, verifyOtpAndAuthenticate } from "./service";
import { otpRequestLimiter, otpVerifyLimiter } from "../../middleware/rateLimit";
import { clearSessionCookie, createSession, setSessionCookie } from "../../lib/session";
import { requireAuth } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/request-otp", otpRequestLimiter, async (req, res, next) => {
  try {
    const { phone } = requestOtpSchema.parse(req.body);
    await requestOtp(phone);
    // Deliberately generic response either way, so this endpoint can't be
    // used to enumerate which phone numbers are already registered.
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

authRouter.post("/verify-otp", otpVerifyLimiter, async (req, res, next) => {
  try {
    const input = verifyOtpSchema.parse(req.body);
    const user = await verifyOtpAndAuthenticate(input);
    const { token, expiresAt } = await createSession(user.id, req);
    setSessionCookie(res, token, expiresAt);
    res.json({ user: { id: user.id, displayName: user.displayName, phone: user.phone } });
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = req.user!;
  res.json({ user: { id: user.id, displayName: user.displayName, phone: user.phone, role: user.role } });
});
