import {z} from 'zod'
import {Duration} from '../../../../../libs/domain/index.js'

export const duration = () =>
  z.string().transform((v, ctx) => {
    try {
      return Duration.fromFormat(v)
    } catch (err) {
      ctx.addIssue({
        message: (err as Error).message,
        code: z.ZodIssueCode.custom,
      })

      return z.NEVER
    }
  })
