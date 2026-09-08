"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/client-api";

type Step = "phone" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [needsProfile, setNeedsProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submitPhone() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطایی رخ داد");
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطایی رخ داد");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode() {
    setError(null);
    setBusy(true);
    try {
      const res = await clientFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          phone,
          code,
          ...(needsProfile ? { displayName, birthdate, neighborhood } : {}),
        }),
      });
      const data = await res.json();

      if (res.status === 422) {
        // First time we see this phone - server wants registration info.
        setNeedsProfile(true);
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? "خطایی رخ داد");

      router.push("/profile");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطایی رخ داد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 64 }}>
      <div className="card">
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>ورود به محله</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          فقط با شماره موبایلت وارد شو، خبری از رمز عبور نیست.
        </p>

        {step === "phone" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label className="muted" htmlFor="phone">
              شماره موبایل
            </label>
            <input
              id="phone"
              className="input"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
            />
            {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
            <button className="btn btn-primary" disabled={busy || !phone} onClick={submitPhone}>
              ارسال کد تایید
            </button>
          </div>
        )}

        {step === "code" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label className="muted" htmlFor="code">
              کد ۵ رقمی ارسال شده به {phone}
            </label>
            <input
              id="code"
              className="input"
              placeholder="۱۲۳۴۵"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={5}
            />

            {needsProfile && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                <div className="muted">اولین باره میای محله، بریم چند تا اطلاعات پایه بگیریم:</div>
                <input
                  className="input"
                  placeholder="نام نمایشی"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <label className="muted" htmlFor="birthdate">
                  تاریخ تولد (باید ۱۶ سال یا بیشتر داشته باشی)
                </label>
                <input
                  id="birthdate"
                  type="date"
                  className="input"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="محله / منطقه (اختیاری)"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </div>
            )}

            {error && <div style={{ color: "var(--color-danger)" }}>{error}</div>}
            <button className="btn btn-primary" disabled={busy || !code} onClick={submitCode}>
              تایید و ورود
            </button>
            <button className="btn btn-secondary" onClick={() => setStep("phone")}>
              تغییر شماره
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
