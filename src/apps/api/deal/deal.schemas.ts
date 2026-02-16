import {z} from 'zod'
import {
  IdSchema,
  LimitSchema,
  OffsetSchema,
  USDAmountSchema,
} from '../../../libs/common/schemas/common-schemas.js'
import {config} from '../../../config/config.js'
import {DealEventType, DealStatus} from '../../../db/constants.js'

const TEXT_MAX = config.marketplace.text_max_length

export const CreateDealBodySchema = z.object({
  channelId: IdSchema,
  campaignId: IdSchema,
  adFormatId: IdSchema,
  adPriceUSD: USDAmountSchema,
  adScheduleAt: z.coerce.date().optional(),
  draftDealMessage: z.string().max(TEXT_MAX).optional(),
})

export const ListDealsQuerySchema = z.object({
  status: z.enum(Object.values(DealStatus) as [string, ...string[]]).optional(),
  limit: LimitSchema,
  offset: OffsetSchema,
})

export const UpdateDealParamsBodySchema = z.object({
  adFormatId: IdSchema.optional(),
  adPriceUSD: USDAmountSchema.optional(),
  adScheduleAt: z.coerce.date().optional(),
})

export const ConfirmDealBodySchema = z.object({
  eventType: z.enum([
    DealEventType.DRAFT_CONFIRMED,
    DealEventType.CREATIVE_CONFIRMED,
    DealEventType.AD_PARAMETERS_CONFIRMED,
  ]),
})

export const CancelDealBodySchema = z.object({
  reason: z.string().max(TEXT_MAX).optional(),
})

export type CreateDealBody = z.infer<typeof CreateDealBodySchema>
export type UpdateDealParamsBody = z.infer<typeof UpdateDealParamsBodySchema>
export type ConfirmDealBody = z.infer<typeof ConfirmDealBodySchema>
