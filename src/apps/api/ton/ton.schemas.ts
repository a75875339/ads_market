import {z} from 'zod'

export const GetTopupTransactionQuerySchema = z.object({
  walletAddress: z.string().min(1),
})

export const TonApiWebhookBodySchema = z.object({
  account_id: z.string(),
  lt: z.number(),
  tx_hash: z.string(),
})

export type GetTopupTransactionQuery = z.infer<
  typeof GetTopupTransactionQuerySchema
>
export type TonApiWebhookBody = z.infer<typeof TonApiWebhookBodySchema>
