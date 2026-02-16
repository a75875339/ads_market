import {z} from 'zod'
import {
  IdSchema,
  LimitSchema,
  OffsetSchema,
} from '../../../libs/common/schemas/common-schemas.js'

export const UpdateWalletBodySchema = z.object({
  walletAddress: z.string().min(6),
})

export const UpdateVisibilityBodySchema = z.object({
  isVisible: z.boolean(),
})

export const UpdateCategoryBodySchema = z.object({
  categoryId: IdSchema,
})

export const SearchCampaignsForChannelSchema = z.object({
  limit: LimitSchema,
  offset: OffsetSchema,
})
