# محله (Mahalle)

یک شبکه اجتماعی محلی برای اهالی یک شهر - به زبان فارسی، خودمیزبانی‌شده، و طراحی‌شده برای دور هم جمع کردن مردم یک شهر کوچک به‌جای مصرف وقتشان.

این پروژه در چند فاز ساخته می‌شود؛ آنچه در این نسخه پیاده‌سازی شده: **ورود با تایید پیامکی** و **صفحه/وبلاگ شخصی قابل شخصی‌سازی**. نقشه کامل فازهای بعدی (ریلز، کسب‌وکارها، اخبار، رویدادها، نظرسنجی، تعدیل محتوا با هوش مصنوعی، تبلیغات/کمک مالی/خیریه، نشان‌های افتخار) در فایل پلن پروژه مستند شده است.

## راه‌اندازی سریع (سرور شهر)

پیش‌نیاز: یک سرور لینوکسی با [Docker](https://docs.docker.com/engine/install/) و Docker Compose نصب‌شده.

```bash
cp .env.example .env
# فایل .env را باز کن و مقادیر زیر را حتما پر کن:
#   SESSION_SECRET      -> با: openssl rand -hex 32
#   POSTGRES_PASSWORD   -> یک رمز قوی
#   PUBLIC_DOMAIN        -> دامنه واقعی سرور (برای HTTPS خودکار لازم است)
docker compose up -d --build
```

همین! دیتابیس، صف پردازش تصویر/ویدیو، بک‌اند، فرانت‌اند و پراکسی HTTPS همه با یک دستور بالا می‌آیند.

بدون تنظیم `SMS_PROVIDER`، سامانه کد تایید پیامکی را در لاگ کانتینر `api` چاپ می‌کند (`docker compose logs -f api`) تا بتوانی کل مسیر ثبت‌نام را بدون داشتن حساب پیامکی واقعی تست کنی. وقتی به یک سرویس پیامک ایرانی (کاوه‌نگار یا مشابه) دسترسی داشتی، مقادیر `SMS_PROVIDER=kavenegar` و `KAVENEGAR_API_KEY` را در `.env` تنظیم کن.

## توسعه محلی (Development)

این ریپو یک monorepo با npm workspaces است:

```
packages/
  shared/   انواع و اسکیمای zod مشترک بین api و web
  api/      Express + Prisma + BullMQ
  web/      Next.js (App Router)
```

```bash
npm install
npm run prisma:generate
npm run dev:api      # http://localhost:4000
npm run dev:worker   # پردازش صف تصویر/ویدیو (نیاز به Redis محلی دارد)
npm run dev:web      # http://localhost:3000
```

توسعه محلی به یک Postgres و Redis در دسترس نیاز دارد (ساده‌ترین راه: همان `docker compose up postgres redis` از این ریپو).

---

## Mahalle (English summary)

A Persian-language, self-hosted local social platform for a single town. This initial build ships **Phase 0 (foundations)** and the **start of Phase 1 (profile/blog page builder)**: phone/SMS-OTP auth with a 16+ age gate, a block-based personal page builder (long bio, achievements, career timeline with organization/title search, interests, unlimited custom pages), image/video upload with server-side re-encoding + pluggable LLM-assisted moderation, and an Instagram post-embed block. See the project plan for the full phased roadmap (reels, businesses, news, events, polls, ads/donations/charity, badges, and the anti-scraping hardening pass).

`docker compose up -d --build` after copying `.env.example` to `.env` is the entire self-hosting story - see the Persian section above for the exact steps.
