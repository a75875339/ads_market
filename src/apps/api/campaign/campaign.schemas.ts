import {z} from 'zod'
import {
  IdSchema,
  LimitSchema,
  OffsetSchema,
  PositivePercentSchema,
  USDAmountSchema,
} from '../../../libs/common/schemas/common-schemas.js'
import {config} from '../../../config/config.js'
import {AdFormatType, CampaignStatus} from '../../../db/constants.js'

const TEXT_MAX = config.marketplace.text_max_length

const UsdAmountSchema = USDAmountSchema.optional()
const PositiveIntSchema = z.number().int().positive().optional()
const PercentSchema = PositivePercentSchema.optional()
const DateSchema = z.coerce.date().optional()

const OptionalUsdRangeSchema = z
  .object({
    min: UsdAmountSchema,
    max: UsdAmountSchema,
  })
  .optional()
const OptionalIntRangeSchema = z
  .object({
    min: z.number().int().nonnegative().optional(),
    max: z.number().int().positive().optional(),
  })
  .optional()
const OptionalPercentRangeSchema = z
  .object({
    min: PercentSchema,
    max: PercentSchema,
  })
  .optional()

// request schemas
export const SearchChannelsQuerySchema = z.object({
  text: z.string().optional(),
  formatType: z
    .enum(Object.values(AdFormatType) as [string, ...string[]])
    .transform((v) => v as AdFormatType)
    .optional(),
  price: OptionalUsdRangeSchema,
  CPM: OptionalUsdRangeSchema,
  categoryId: z.coerce.bigint().positive().optional(),
  subscribers: OptionalIntRangeSchema,
  avgViews: OptionalIntRangeSchema,
  erPercent: OptionalPercentRangeSchema,
  limit: LimitSchema,
  offset: OffsetSchema,
})

export const CreateCampaignBodySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(TEXT_MAX).nullable().optional(),
  acceptApplications: z.boolean().optional(),

  ApplicationMinPriceUSD: UsdAmountSchema,
  ApplicationMaxPriceUSD: UsdAmountSchema,
  ApplicationMinCPMUSD: UsdAmountSchema,
  ApplicationMaxCPMUSD: UsdAmountSchema,

  ApplicationFormatType: z
    .enum(Object.values(AdFormatType) as [string, ...string[]])
    .nullable()
    .optional()
    .transform((v) => v as AdFormatType | null | undefined),
  ApplicationCategoryId: IdSchema.nullable().optional(),
  ApplicationMinSubscribers: PositiveIntSchema,
  ApplicationMaxSubscribers: PositiveIntSchema,
  ApplicationMinAvgViews: PositiveIntSchema,
  ApplicationMaxAvgViews: PositiveIntSchema,
  ApplicationMinErPercent: PercentSchema,
  ApplicationMaxErPercent: PercentSchema,
  ApplicationPublicationDatetimeFrom: DateSchema,
  ApplicationPublicationDatetimeTo: DateSchema,

  notes: z.string().max(TEXT_MAX).nullable().optional(),
})

export const UpdateCampaignBodySchema = CreateCampaignBodySchema.partial()

export const ListCampaignsQuerySchema = z.object({
  status: z
    .enum(Object.values(CampaignStatus) as [string, ...string[]])
    .optional(),
})

export type CreateCampaignBody = z.infer<typeof CreateCampaignBodySchema>
export type UpdateCampaignBody = z.infer<typeof UpdateCampaignBodySchema>
export type SearchChannelsQuery = z.infer<typeof SearchChannelsQuerySchema>
