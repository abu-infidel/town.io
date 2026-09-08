import type { BlockType, PageKind, ProfileTemplate } from "@mahalle/shared";

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
