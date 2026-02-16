import {z} from 'zod'
import {
  IdSchema,
  USDAmountSchema,
} from '../../../libs/common/schemas/common-schemas.js'
import {AdFormatType} from '../../../db/constants.js'

export const CreateAdFormatBodySchema = z.object({
  formatType: z.enum(Object.values(AdFormatType)),
  priceUSD: USDAmountSchema,
})

export const UpdateAdFormatBodySchema = z.object({
  priceUSD: USDAmountSchema.optional(),
  isActive: z.boolean().optional(),
})

export const SelectFormatSchema = z.object({
  channelId: IdSchema,
  formatId: IdSchema,
})

export type CreateAdFormatBody = z.infer<typeof CreateAdFormatBodySchema>
export type UpdateAdFormatBody = z.infer<typeof UpdateAdFormatBodySchema>
