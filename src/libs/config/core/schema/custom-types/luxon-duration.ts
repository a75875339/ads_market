import {Duration} from 'luxon'
import {z} from 'zod'
import msLibrary, {
  type StringValue as MsStringValue,
} from '../../../../ms/index.js'

export const luxonDuration = () =>
  z.string().transform((v, ctx) => {
    try {
      return Duration.fromMillis(msLibrary(v as MsStringValue))
    } catch (err) {
      ctx.addIssue({
        message: (err as Error).message,
        code: z.ZodIssueCode.custom,
      })

      return z.NEVER
    }
  })
