// Database constants and enum-like objects

// export const UserRole = {
//   ADVERTISER: 'advertiser',
//   CHANNEL_OWNER: 'channel_owner',
//   ADMIN: 'admin',
// } as const
// export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ChannelType = {
  CHANNEL: 'channel',
  PRIVATE_CHANNEL: 'private_channel',
  GROUP: 'group',
  PRIVATE_GROUP: 'private_group',
} as const
export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType]

export const ChannelStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  TOO_SMALL: 'too_small',
  ERROR: 'error',
} as const
export type ChannelStatus = (typeof ChannelStatus)[keyof typeof ChannelStatus]

export const ManagerPermission = {
  NONE: 'none',
  VIEW: 'view',
  MANAGE_DEALS: 'manage_deals',
  MANAGE_FORMATS: 'manage_formats',
  FULL: 'full', // can manage managers
} as const
export type ManagerPermission =
  (typeof ManagerPermission)[keyof typeof ManagerPermission]

// export const StatsSource = {
//   TELEGRAM_API: 'telegram_api',
//   EXTERNAL_SERVICE: 'external_service',
//   SELF_REPORTED: 'self_reported',
// } as const
// export type StatsSource = (typeof StatsSource)[keyof typeof StatsSource]

export const AdFormatType = {
  TEST: '1/1',
  POST_1_24: '1/24',
  POST_2_48: '2/48',
  POST_3_72: '3/72',
  REPOST: 'repost',
  NO_REMOVAL: 'no_removal',
} as const
export type AdFormatType = (typeof AdFormatType)[keyof typeof AdFormatType]

export const CampaignStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const
export type CampaignStatus =
  (typeof CampaignStatus)[keyof typeof CampaignStatus]

export const ApplicationStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const
export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

export const DealStatus = {
  DRAFT: 'draft',
  DRAFT_APPLICATION: 'draft_application',
  NEGOTIATION: 'negotiation',
  // OWNER_APPROVED: 'owner_approved',
  // ADVERTISER_APPROVED: 'advertiser_approved',
  // AGREED: 'agreed',
  // ESCROW_PENDING: 'escrow_pending',
  // ESCROW_FUNDED: 'escrow_funded',
  // CREATIVE_PENDING: 'creative_pending',
  // CREATIVE_REVIEW: 'creative_review',
  // CREATIVE_APPROVED: 'creative_approved',
  SCHEDULED: 'scheduled',
  POSTED: 'posted',
  // VERIFICATION_PASSED: 'verification_passed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  // REFUNDED: 'refunded',
} as const
export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus]

export const MediaType = {
  NONE: 'none',
  PHOTO: 'photo',
  VIDEO: 'video',
  DOCUMENT: 'document',
  ANIMATION: 'animation',
} as const
export type MediaType = (typeof MediaType)[keyof typeof MediaType]

export const DealEventType = {
  DRAFT_CONFIRMED: 'draft_confirmed',
  CREATIVE_CONFIRMED: 'creative_confirmed',
  AD_PARAMETERS_CONFIRMED: 'ad_parameters_confirmed',
  CHANGE_AD_PARAMETERS: 'change_ad_parameters',
  DEPOSIT_RECEIVED: 'deposit_received',

  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  CREATIVE_SUBMITTED: 'creative_submitted',
  SCHEDULED: 'scheduled',
  POSTED: 'posted',
  DEAL_VERIFIED: 'deal_verified',
  FUNDS_RELEASED: 'funds_released',
  FUNDS_REFUNDED: 'funds_refunded',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout',
} as const
export type DealEventType = (typeof DealEventType)[keyof typeof DealEventType]

export const DealActorType = {
  ADVERTISER: 'advertiser',
  CHANNEL: 'channel',
  SYSTEM: 'system',
} as const
export type DealActorType = (typeof DealActorType)[keyof typeof DealActorType]

export const EscrowTxType = {
  DEPOSIT: 'deposit',
  RELEASE: 'release',
  REFUND: 'refund',
  FEE: 'fee',
} as const
export type EscrowTxType = (typeof EscrowTxType)[keyof typeof EscrowTxType]

export const EscrowTxStatus = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const
export type EscrowTxStatus =
  (typeof EscrowTxStatus)[keyof typeof EscrowTxStatus]

export const TopicRole = {
  ADVERTISER: 'advertiser',
  CHANNEL_MANAGER: 'channel_manager',
} as const
export type TopicRole = (typeof TopicRole)[keyof typeof TopicRole]

// Timeouts in milliseconds
export const DealTimeouts = {
  ESCROW_PAYMENT: 24 * 60 * 60 * 1000, // 24 hours to pay
  CREATIVE_SUBMISSION: 48 * 60 * 60 * 1000, // 48 hours to submit creative
  CREATIVE_REVIEW: 24 * 60 * 60 * 1000, // 24 hours to review
  DEFAULT_RETENTION_HOURS: 24, // Default post retention
} as const
