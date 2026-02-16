import {
  bigint,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import type {AmountUSD} from '../../libs/common/types/domain.types.js'
import type {EscrowTxStatus, EscrowTxType} from '../constants.js'
import {deals} from './deals.table.js'

export const dealWalletTransactions = pgTable(
  'deal_wallet_transactions',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    dealId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => deals.id),
    txType: text().$type<EscrowTxType>().notNull(),
    txHash: text(),
    amountNanotons: bigint({mode: 'bigint'}).notNull(),
    amountUsdt: numeric({precision: 18, scale: 6}).$type<AmountUSD>(),
    fromAddress: text(),
    toAddress: text(),
    status: text().$type<EscrowTxStatus>().notNull().default('pending'),
    queryId: text(),
    confirmedAt: timestamp(),
    processedAt: timestamp(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (table) => [
    index('deal_wallet_tx_deal_idx').on(table.dealId),
    unique('escrow_tx_hash_idx').on(table.txHash),
    unique('deal_wallet_tx_idempotency_key_idx').on(
      table.queryId,
      table.dealId,
    ),
    index('escrow_tx_status_idx').on(table.status),
  ],
)
