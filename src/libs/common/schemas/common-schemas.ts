import {z} from 'zod'
import {BigDecimal} from '../bigdecimal.js'
import type {AmountUSD, Percent} from '../types/domain.types.js'

export const IdSchema = z.coerce.bigint().positive()
export const TelegramChatIdSchema = z.coerce.bigint()

const MIN_PRICE_USD = 0.01
export const USDAmountSchema = z
  .string()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    'Must be a valid USD amount with up to 2 decimal places',
  )
  .refine(
    (v) => new BigDecimal(v).gte(MIN_PRICE_USD),
    `Must be at least ${MIN_PRICE_USD} USD`,
  )
  .transform((v) => v as AmountUSD)

export const PositivePercentSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/)
  .refine(
    (v) => new BigDecimal(v).gte(0) && new BigDecimal(v).lte(100),
    'Must be a valid percent between 0 and 100',
  )
  .transform((v) => v as Percent)

export const LimitSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(100)
  .optional()
export const OffsetSchema = z.coerce.number().int().nonnegative().optional()
