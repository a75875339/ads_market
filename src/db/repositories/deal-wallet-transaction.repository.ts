import {Inject, Injectable} from '@nestjs/common'
import {and, eq, inArray} from 'drizzle-orm'
import {EscrowTxStatus, EscrowTxType} from '../constants.js'
import {DB_TOKEN, type DBType, type DbOrTransaction} from '../db.tokens.js'
import {dealWalletTransactions} from '../tables/deal-wallet-transactions.table.js'

export type DealWalletTransactionRow =
  typeof dealWalletTransactions.$inferSelect
export type DealWalletTransactionInsert =
  typeof dealWalletTransactions.$inferInsert

@Injectable()
export class DealWalletTransactionRepository {
  constructor(@Inject(DB_TOKEN) readonly db: DBType) {}

  async create(
    value: DealWalletTransactionInsert,
    db: DbOrTransaction = this.db,
  ): Promise<DealWalletTransactionRow | null> {
    const data = await db
      .insert(dealWalletTransactions)
      .values(value)
      .onConflictDoNothing({target: dealWalletTransactions.txHash})
      .returning()
    return data[0] ?? null
  }

  async findByTxHash(txHash: string): Promise<DealWalletTransactionRow | null> {
    const data = await this.db
      .select()
      .from(dealWalletTransactions)
      .where(eq(dealWalletTransactions.txHash, txHash))
    return data[0] ?? null
  }

  async findByQueryIdAndDealId(
    queryId: string,
    dealId: bigint,
  ): Promise<DealWalletTransactionRow | null> {
    const data = await this.db
      .select()
      .from(dealWalletTransactions)
      .where(
        and(
          eq(dealWalletTransactions.queryId, queryId),
          eq(dealWalletTransactions.dealId, dealId),
        ),
      )
    return data[0] ?? null
  }

  async findDepositByDealId(
    dealId: bigint,
  ): Promise<DealWalletTransactionRow | null> {
    const data = await this.db
      .select()
      .from(dealWalletTransactions)
      .where(
        and(
          eq(dealWalletTransactions.dealId, dealId),
          eq(dealWalletTransactions.txType, EscrowTxType.DEPOSIT),
          eq(dealWalletTransactions.status, EscrowTxStatus.CONFIRMED),
        ),
      )
    return data[0] ?? null
  }

  async findPendingOutgoing(): Promise<DealWalletTransactionRow[]> {
    return this.db
      .select()
      .from(dealWalletTransactions)
      .where(
        and(
          eq(dealWalletTransactions.status, EscrowTxStatus.PENDING),
          inArray(dealWalletTransactions.txType, [
            EscrowTxType.REFUND,
            EscrowTxType.RELEASE,
          ]),
        ),
      )
  }

  async existsConfirmedDepositForDeal(dealId: bigint): Promise<boolean> {
    const data = await this.db
      .select({id: dealWalletTransactions.id})
      .from(dealWalletTransactions)
      .where(
        and(
          eq(dealWalletTransactions.dealId, dealId),
          eq(dealWalletTransactions.txType, EscrowTxType.DEPOSIT),
          eq(dealWalletTransactions.status, EscrowTxStatus.CONFIRMED),
        ),
      )
      .limit(1)
    return data.length > 0
  }

  async updateStatus(
    id: bigint,
    status: EscrowTxStatus,
    txHash?: string,
    db: DbOrTransaction = this.db,
  ): Promise<DealWalletTransactionRow | null> {
    const data = await db
      .update(dealWalletTransactions)
      .set({
        status,
        ...(txHash ? {txHash} : {}),
        ...(status === EscrowTxStatus.CONFIRMED
          ? {confirmedAt: new Date()}
          : {}),
      })
      .where(eq(dealWalletTransactions.id, id))
      .returning()
    return data[0] ?? null
  }
}
