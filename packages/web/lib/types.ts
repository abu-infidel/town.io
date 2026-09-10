import type { BlockType, BusinessCategory, PageKind, ProfileTemplate } from "@mahalle/shared";

export interface ProfileBlockDto {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  order: number;
}

export interface ProfilePageDto {
  id: string;
  kind: PageKind;
  title: string;
  order: number;
  blocks: ProfileBlockDto[];
}

export interface CareerEntryDto {
  id: string;
  organization: string;
  title: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

export interface FullProfileDto {
  id: string;
  handle: string;
  template: ProfileTemplate;
  accentColor: string;
  coverMediaId: string | null;
  avatarMediaId: string | null;
  instagramHandle: string | null;
  pages: ProfilePageDto[];
  careerEntries: CareerEntryDto[];
}

export interface PublicProfileDto {
  userId: string;
  handle: string;
  displayName: string;
  neighborhood: string | null;
  template: ProfileTemplate;
  accentColor: string;
  coverMediaId: string | null;
  avatarMediaId: string | null;
  instagramHandle: string | null;
  pages: ProfilePageDto[];
  careerEntries: CareerEntryDto[];
}

// ---------------------------------------------------------------------------
// Phase 2: social core
// ---------------------------------------------------------------------------

export interface PostAuthorDto {
  id: string;
  displayName: string;
  handle: string | null;
  neighborhood: string | null;
}

export interface PostDto {
  id: string;
  text: string;
  createdAt: string;
  author: PostAuthorDto;
  media: string[];
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
  sameNeighborhood: boolean;
}

export interface ReelDto {
  id: string;
  caption: string | null;
  createdAt: string;
  videoUrl: string | null;
  pending: boolean;
  author: { id: string; displayName: string; handle: string | null };
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
}

export interface CommentDto {
  id: string;
  text: string;
  createdAt: string;
  authorId: string;
  author: { displayName: string; profile: { handle: string } | null };
}

export interface ConversationSummaryDto {
  conversationId: string;
  otherUser: { id: string; displayName: string; profile: { handle: string } | null } | null;
  lastMessage: { text: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

export interface DirectMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Phase 3: business directory
// ---------------------------------------------------------------------------

// Structurally identical to ProfileBlockDto (same BlockType/content shape) -
// aliased so business-editor code reads as its own domain.
export type BusinessBlockDto = ProfileBlockDto;

export interface BusinessPageDto {
  id: string;
  title: string;
  order: number;
  blocks: BusinessBlockDto[];
}

export interface ProductMediaRow {
  id: string;
  mediaId: string;
  order: number;
}

export interface OwnedProductDto {
  id: string;
  name: string;
  description: string | null;
  priceToman: number | null;
  isOffer: boolean;
  originalPriceToman: number | null;
  active: boolean;
  moderationStatus: string;
  media: ProductMediaRow[];
}

export interface OwnedBusinessDto {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  summary: string | null;
  coverMediaId: string | null;
  logoMediaId: string | null;
  instagramHandle: string | null;
  moderationStatus: string;
  pages: BusinessPageDto[];
  products: OwnedProductDto[];
}

export interface BusinessListItemDto {
  id: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  neighborhood: string | null;
  moderationStatus: string;
}

export interface PublicProductDto {
  id: string;
  name: string;
  description: string | null;
  priceToman: number | null;
  isOffer: boolean;
  originalPriceToman: number | null;
  media: string[];
}

export interface PublicBusinessDto {
  id: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  summary: string | null;
  instagramHandle: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  pages: BusinessPageDto[];
  products: PublicProductDto[];
}

export interface DirectoryBusinessDto {
  slug: string;
  name: string;
  category: BusinessCategory;
  neighborhood: string | null;
  summary: string | null;
  logoUrl: string | null;
}

export interface PublicProductDetailDto extends PublicProductDto {
  business: { slug: string; name: string };
}

// ---------------------------------------------------------------------------
// Phase 4: civic features - news, events, polls
// ---------------------------------------------------------------------------

export interface NewsItemDto {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { id: string; displayName: string };
  coverUrl: string | null;
}

export interface EventListItemDto {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startAt: string;
  endAt: string | null;
  creator: { id: string; displayName: string };
  coverUrl: string | null;
  rsvpCount: number;
}

export interface EventDetailDto extends EventListItemDto {
  viewerGoing: boolean;
}

export interface EventPostDto {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; displayName: string };
  media: string[];
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
}

export interface PollOptionDto {
  id: string;
  text: string;
  voteCount: number | null;
}

export interface PollDto {
  id: string;
  question: string;
  description: string | null;
  closesAt: string | null;
  closed: boolean;
  createdAt: string;
  viewerVotedOptionId: string | null;
  totalVotes: number | null;
  options: PollOptionDto[];
}

export interface PublicPollResultsDto {
  id: string;
  question: string;
  description: string | null;
  closed: boolean;
  totalVotes: number;
  options: { text: string; voteCount: number }[];
}
