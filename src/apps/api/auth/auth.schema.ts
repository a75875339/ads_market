import {z} from 'zod'

export const LoginBodySchema = z.object({
  telegramRawData: z.string(),
})
