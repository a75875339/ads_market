import type {ZodTypeAny} from 'zod'
import {z} from 'zod'
import type {AmountUSD} from '../../../common/types/domain.types.js'
import {NumberRegex} from './constants.js'
import {duration} from './custom-types/duration.js'
import {luxonDuration} from './custom-types/luxon-duration.js'
import {recordWithOverwrite} from './custom-types/record-with-overwrite.js'

export type EnumValue = string | number
export type EnumLike = Readonly<Record<string, EnumValue>>

const array = <T extends ZodTypeAny>(schema: T) =>
  z.preprocess((v) => {
    if (typeof v === 'string') {
      try {
        const arr = JSON.parse(v)

        if (Array.isArray(arr)) {
          return arr
        }
      } catch {
        // try split
      }

      if (v === '') {
        return []
      }

      return v.split(',')
    }

    return v
  }, z.array(schema))

const boolean = () =>
  z.preprocess((v) => {
    if (v === 'false') {
      return false
    }

    if (v === 'true') {
      return true
    }

    return v
  }, z.boolean())

const enm = <T extends EnumLike>(en: T) => {
  const isNumberLike = Object.values(en).some((v) => typeof v === 'number')

  if (isNumberLike) {
    return z.preprocess((v) => {
      return Number(v)
    }, z.enum(en))
  }

  return z.enum(en)
}

const host = () => z.string()

export const s = {
  string: z.string,
  token_addr: () => z.string(),
  wallet_address: () => z.string(),
  array,
  /**
   * string which contains decimal number
   */
  bignumber: () => z.string().regex(NumberRegex),
  int: () => z.coerce.number().int(),
  /**
   * float in interval [0, 1]
   */
  fraction: () => z.coerce.number().gte(0).lte(1),
  /**
   * float in interval [0, 100]
   */
  percent: () => z.coerce.number().gte(0).lte(100),
  float: () => z.coerce.number(),
  amount_usd: () => z.coerce.string().transform((v) => v as AmountUSD),
  // amount_usd_n: () => z.coerce.number().transform((v) => v as AmountUSDNumber),
  bigint: () => z.coerce.bigint(),
  object: z.object,
  enum: enm,
  options: z.enum,
  url: () => z.string().url(),
  host,
  boolean,
  literal: z.literal,
  record: z.record,
  recordWithOverwrite: recordWithOverwrite,
  duration,
  lDuration: luxonDuration,
}
