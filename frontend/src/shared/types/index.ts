// ===== Enums =====

export type DealStatus =
  | 'draft'
  | 'draft_application'
  | 'negotiation'
  | 'scheduled'
  | 'posted'
  | 'completed'
  | 'cancelled';

export type ChannelStatus = 'pending' | 'active' | 'suspended' | 'too_small' | 'error';

export type ChannelType = 'channel' | 'private_channel' | 'group' | 'private_group';

export type AdFormatType = '1/1' | '1/24' | '2/48' | '3/72' | 'repost' | 'no_removal';

export type CampaignStatus = 'active' | 'archived';

export type ManagerPermission = 'none' | 'view' | 'manage_deals' | 'manage_formats' | 'full';

export type DealEventType =
  | 'draft_confirmed'
  | 'creative_confirmed'
  | 'ad_parameters_confirmed'
  | 'deposit_received'
  | 'created'
  | 'status_changed'
  | 'creative_submitted'
  | 'scheduled'
  | 'posted'
  | 'deal_verified'
  | 'funds_released'
  | 'funds_refunded'
  | 'cancelled'
  | 'timeout';

export type ActorType = 'advertiser' | 'channel' | 'system';

// ===== Common =====

export type DealConfirmation = {
  advertiser: boolean;
  channel: boolean;
};

// ===== Entities =====

export interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  emoji: string;
}

export interface ChannelStats {
  subscribers: number;
  avgViews: number;
  avgReach: number;
  erPercent: string;
  premiumPercent: string | null;
  languageDistribution: Record<string, number> | null;
  genderDistribution: Record<string, number> | null;
}

export interface Channel {
  id: string;
  telegramChatId: string;
  ownerId: string;
  title: string;
  username: string | null;
  description: string | null;
  channelType: ChannelType;
  categoryId: string | null;
  status: ChannelStatus;
  botIsAdmin: boolean;
  avatarUrl: string | null;
  language: string;
  rewardWalletAddress: string | null;
  isVisible: boolean;
  stats?: ChannelStats;
  adFormats?: AdFormat[];
  createdAt: string;
  updatedAt: string;
}

export interface AdFormat {
  id: string;
  channelId: string;
  formatType: AdFormatType;
  description: string | null;
  priceUSD: string;
  retentionHours: number | null;
  topHours: number | null;
  CPM: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  advertiserId: string;
  title: string;
  description: string | null;
  status: CampaignStatus;
  acceptApplications: boolean;
  ApplicationMinPriceUSD: string | null;
  ApplicationMaxPriceUSD: string | null;
  ApplicationMinCPMUSD: string | null;
  ApplicationMaxCPMUSD: string | null;
  ApplicationFormatType: AdFormatType | null;
  ApplicationCategoryId: string | null;
  ApplicationMinSubscribers: number | null;
  ApplicationMaxSubscribers: number | null;
  ApplicationMinAvgViews: number | null;
  ApplicationMaxAvgViews: number | null;
  ApplicationMinErPercent: string | null;
  ApplicationMaxErPercent: string | null;
  ApplicationPublicationDatetimeFrom: string | null;
  ApplicationPublicationDatetimeTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  creatorId: string;
  channelId: string;
  campaignId: string | null;
  draftDealMessage: string | null;
  status: DealStatus;
  adFormatId: string | null;
  adPriceUSD: string | null;
  adScheduleAt: string | null;
  creativeData: Record<string, unknown> | null;
  dealWallet: string | null;
  scheduledAt: string | null;
  postedAt: string | null;
  postedMessageId: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledById: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  // Detail fields (from mapDealWithDetails)
  draftConfirmed?: DealConfirmation;
  adParamsConfirmed?: DealConfirmation;
  creativeConfirmed?: DealConfirmation;
  isPaid?: boolean;
  depositReceivedAt?: string | null;
  // Joined fields
  channel?: Channel;
  campaign?: Campaign;
  adFormat?: AdFormat;
}

export interface ChannelManager {
  id: string;
  permissions: ManagerPermission;
  user: {
    id: string;
    telegramId: string | null;
    firstName: string;
    lastName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export interface DealEvent {
  id: string;
  dealId: string;
  eventType: DealEventType;
  actorId: string | null;
  actorType: ActorType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ===== Search types =====

export interface ChannelSearchResult {
  id: string;
  title: string;
  username: string | null;
  description: string | null;
  categoryId: string | null;
  avatarUrl: string | null;
  stats: ChannelStats;
  formats: AdFormat[];
}

export interface ChannelSearchResponse {
  channels?: Channel[];
  offset?: number;
}

export interface ChannelSearchParams {
  text?: string;
  formatType?: AdFormatType;
  price?: { min?: string; max?: string };
  CPM?: { min?: string; max?: string };
  categoryId?: string;
  subscribers?: { min?: number; max?: number };
  avgViews?: { min?: number; max?: number };
  erPercent?: { min?: string; max?: string };
  limit?: number;
  offset?: number;
}

// ===== Request types =====

export interface CreateDealRequest {
  channelId: string;
  campaignId?: string;
  adFormatId: string;
  adPriceUSD: string;
  adScheduleAt?: string;
  draftDealMessage?: string;
}

export interface UpdateDealParamsRequest {
  adFormatId?: string;
  adPriceUSD?: string;
  adScheduleAt?: string;
}

export interface ConfirmDealRequest {
  eventType: 'draft_confirmed' | 'creative_confirmed' | 'ad_parameters_confirmed';
}

export interface CancelDealRequest {
  reason?: string;
}

export interface CreateCampaignRequest {
  title: string;
  description?: string;
  acceptApplications?: boolean;
  ApplicationMinPriceUSD?: string;
  ApplicationMaxPriceUSD?: string;
  ApplicationMinCPMUSD?: string;
  ApplicationMaxCPMUSD?: string;
  ApplicationFormatType?: AdFormatType;
  ApplicationCategoryId?: string;
  ApplicationMinSubscribers?: number;
  ApplicationMaxSubscribers?: number;
  ApplicationMinAvgViews?: number;
  ApplicationMaxAvgViews?: number;
  ApplicationMinErPercent?: string;
  ApplicationMaxErPercent?: string;
  ApplicationPublicationDatetimeFrom?: string;
  ApplicationPublicationDatetimeTo?: string;
  notes?: string;
}

export type UpdateCampaignRequest = Partial<CreateCampaignRequest>;

export interface CreateAdFormatRequest {
  formatType: AdFormatType;
  priceUSD: string;
}

export interface UpdateAdFormatRequest {
  priceUSD?: string;
  isActive?: boolean;
}

export interface UpdateWalletRequest {
  walletAddress: string;
}

export interface UpdateVisibilityRequest {
  isVisible: boolean;
}

export interface UpdateCategoryRequest {
  categoryId: number | null;
}

export interface UpdateManagerPermissionsRequest {
  permissions: ManagerPermission;
}

// ===== TON Connect =====

export type TonConnectMessage = {
  address: string;
  amount: string;
  payload?: string;
};

export type TonConnectTransaction = {
  validUntil: number;
  messages: TonConnectMessage[];
};

// ===== App role =====

export type AppRole = 'advertiser' | 'channel_admin';
