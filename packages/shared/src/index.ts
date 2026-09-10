import { z } from "zod";

/**
 * Types and validation schemas shared between the API and the web app, so
 * both sides agree on shapes without duplicating definitions.
 */

// ---------------------------------------------------------------------------
// Phone / OTP auth
// ---------------------------------------------------------------------------

// Accepts 09xxxxxxxxx or +989xxxxxxxxx / 00989xxxxxxxxx and normalizes to +98...
const IRAN_MOBILE_RE = /^(?:\+98|0098|0)9(\d{9})$/;

export function normalizeIranPhone(input: string): string | null {
  const trimmed = input.replace(/[\s-]/g, "");
  const match = IRAN_MOBILE_RE.exec(trimmed);
  if (!match) return null;
  return `+989${match[1]}`;
}

export const phoneSchema = z.string().refine((v) => normalizeIranPhone(v) !== null, {
  message: "شماره موبایل معتبر نیست",
});

export const otpCodeSchema = z
  .string()
  .regex(/^\d{5}$/, "کد تایید باید ۵ رقم باشد");

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
  // Only required the first time (registration): birthdate is used for the
  // 16+ age gate and is otherwise not collected or shown anywhere.
  birthdate: z.string().date().optional(),
  displayName: z.string().min(2).max(60).optional(),
  neighborhood: z.string().min(2).max(80).optional(),
});

export const MIN_AGE_YEARS = 16;

export function isOldEnough(birthdateIso: string, minYears = MIN_AGE_YEARS): boolean {
  const birth = new Date(birthdateIso);
  if (Number.isNaN(birth.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= minYears;
}

// ---------------------------------------------------------------------------
// Profile pages & blocks (the "blog designer")
// ---------------------------------------------------------------------------

export const PAGE_KINDS = [
  "about", // long bio: story, achievements intro
  "achievements",
  "career",
  "interests",
  "custom",
] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export const BLOCK_TYPES = [
  "heading",
  "text",
  "image",
  "gallery",
  "video",
  "quote",
  "link",
  "achievement",
  "timelineItem",
  "instagramEmbed",
  "divider",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const blockContentSchemas = {
  heading: z.object({ text: z.string().min(1).max(120) }),
  text: z.object({ text: z.string().min(1).max(8000) }),
  image: z.object({ mediaId: z.string(), caption: z.string().max(300).optional() }),
  gallery: z.object({ mediaIds: z.array(z.string()).min(1).max(20) }),
  video: z.object({ mediaId: z.string(), caption: z.string().max(300).optional() }),
  quote: z.object({ text: z.string().min(1).max(500), attribution: z.string().max(120).optional() }),
  link: z.object({ url: z.string().url(), label: z.string().min(1).max(80) }),
  achievement: z.object({
    title: z.string().min(1).max(120),
    date: z.string().optional(),
    description: z.string().max(1000).optional(),
    mediaId: z.string().optional(),
  }),
  timelineItem: z.object({
    title: z.string().min(1).max(120),
    organization: z.string().max(120).optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().max(1000).optional(),
  }),
  instagramEmbed: z.object({ postUrl: z.string().url() }),
  divider: z.object({}),
} satisfies Record<BlockType, z.ZodTypeAny>;

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), content: blockContentSchemas.heading }),
  z.object({ type: z.literal("text"), content: blockContentSchemas.text }),
  z.object({ type: z.literal("image"), content: blockContentSchemas.image }),
  z.object({ type: z.literal("gallery"), content: blockContentSchemas.gallery }),
  z.object({ type: z.literal("video"), content: blockContentSchemas.video }),
  z.object({ type: z.literal("quote"), content: blockContentSchemas.quote }),
  z.object({ type: z.literal("link"), content: blockContentSchemas.link }),
  z.object({ type: z.literal("achievement"), content: blockContentSchemas.achievement }),
  z.object({ type: z.literal("timelineItem"), content: blockContentSchemas.timelineItem }),
  z.object({ type: z.literal("instagramEmbed"), content: blockContentSchemas.instagramEmbed }),
  z.object({ type: z.literal("divider"), content: blockContentSchemas.divider }),
]);

export const createPageSchema = z.object({
  kind: z.enum(PAGE_KINDS),
  title: z.string().min(1).max(60),
});

export const reorderBlocksSchema = z.object({
  pageId: z.string(),
  orderedBlockIds: z.array(z.string()).min(1),
});

export const careerEntrySchema = z.object({
  organization: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// Profile theme (constrained customization - no raw CSS/JS from users)
// ---------------------------------------------------------------------------

export const PROFILE_TEMPLATES = ["classic", "cardStack", "magazine"] as const;
export type ProfileTemplate = (typeof PROFILE_TEMPLATES)[number];

export const profileThemeSchema = z.object({
  template: z.enum(PROFILE_TEMPLATES).default("classic"),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#2f6f4f"),
  coverMediaId: z.string().optional(),
  avatarMediaId: z.string().optional(),
});

export type ProfileTheme = z.infer<typeof profileThemeSchema>;

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const MEDIA_KINDS = ["image", "video"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MODERATION_STATUSES = [
  "pending",
  "auto_approved",
  "auto_rejected",
  "needs_human_review",
  "approved",
  "rejected",
] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

// ---------------------------------------------------------------------------
// Phase 2: social core - short posts, reels, comments, follows, DMs
// ---------------------------------------------------------------------------

export const createPostSchema = z.object({
  text: z.string().min(1, "متن نمی‌تواند خالی باشد").max(500, "حداکثر ۵۰۰ نویسه"),
  mediaIds: z.array(z.string()).max(4, "حداکثر ۴ تصویر").optional(),
});

export const createReelSchema = z.object({
  mediaId: z.string(),
  caption: z.string().max(500).optional(),
});

export const createCommentSchema = z.object({
  text: z.string().min(1, "متن نمی‌تواند خالی باشد").max(500, "حداکثر ۵۰۰ نویسه"),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1, "پیام نمی‌تواند خالی باشد").max(2000, "حداکثر ۲۰۰۰ نویسه"),
});

// ---------------------------------------------------------------------------
// Phase 3: business directory (dedicated tab, SEO-visible - req 3, 18)
// ---------------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const businessSlugSchema = z
  .string()
  .min(3, "حداقل ۳ نویسه")
  .max(40, "حداکثر ۴۰ نویسه")
  .regex(SLUG_RE, "فقط حروف انگلیسی کوچک، عدد و خط تیره (مثل: nanvaei-sar-mahalle)");

export const BUSINESS_CATEGORIES = ["food", "retail", "services", "health", "education", "beauty", "auto", "home", "other"] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const BUSINESS_CATEGORY_LABELS_FA: Record<BusinessCategory, string> = {
  food: "خوراکی و رستوران",
  retail: "فروشگاه",
  services: "خدمات",
  health: "سلامت و درمان",
  education: "آموزش",
  beauty: "زیبایی و آرایشی",
  auto: "خودرو",
  home: "خانه و ساختمان",
  other: "سایر",
};

export const createBusinessSchema = z.object({
  slug: businessSlugSchema,
  name: z.string().min(2, "حداقل ۲ نویسه").max(80, "حداکثر ۸۰ نویسه"),
  category: z.enum(BUSINESS_CATEGORIES),
  neighborhood: z.string().max(80).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  summary: z.string().max(200).optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  category: z.enum(BUSINESS_CATEGORIES).optional(),
  neighborhood: z.string().max(80).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  summary: z.string().max(200).optional(),
  instagramHandle: z.string().max(60).optional(),
  coverMediaId: z.string().optional(),
  logoMediaId: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "نام کالا لازم است").max(120),
  description: z.string().max(2000).optional(),
  priceToman: z.number().int().min(0).optional(),
  isOffer: z.boolean().optional(),
  originalPriceToman: z.number().int().min(0).optional(),
  mediaIds: z.array(z.string()).max(6, "حداکثر ۶ تصویر").optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  active: z.boolean().optional(),
});

// A page never returns more than this many rows, and pagination moves via an
// opaque cursor rather than a raw offset/id - deliberately unfriendly to bulk
// scraping (see architecture plan req 14) without punishing normal browsing.
export const MAX_PAGE_SIZE = 30;

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});
