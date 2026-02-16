import {Injectable} from '@nestjs/common'
import {Address, toNano} from '@ton/core'
import {PinoLogger} from 'nestjs-pino'
import {BigDecimal} from '../../libs/common/bigdecimal.js'
import type {AmountUSD} from '../../libs/common/types/domain.types.js'
import {config} from '../../config/config.js'
import {
  DealActorType,
  DealEventType,
  EscrowTxStatus,
  EscrowTxType,
} from '../../db/constants.js'
import {type DbOrTransaction} from '../../db/db.tokens.js'
import {DealEventRepository} from '../../db/repositories/deal-event.repository.js'
import {DealWalletTransactionRepository} from '../../db/repositories/deal-wallet-transaction.repository.js'
import {inTransaction} from '../../db/utils.js'
import {RedisStorageService} from '../../libs/secondary/redis/redis.service.js'
import {
  JETTON_TRANSFER_GAS_NANOTON,
  USDT_NANO_MULTIPLIER,
} from './ton.constants.js'
import type {TonApiEvent, TonApiJettonTransfer} from './ton-api.service.js'
import {TonApiService} from './ton-api.service.js'

export type DealPaymentInfo = {
  id: bigint
  dealWallet: string
  adPriceUSD: string
}

@Injectable()
export class TonPaymentProcessorService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly redis: RedisStorageService,
    private readonly dealEventRepository: DealEventRepository,
    private readonly dealWalletTransactionRepository: DealWalletTransactionRepository,
    private readonly tonApiService: TonApiService,
  ) {
    this.logger.setContext(TonPaymentProcessorService.name)
  }

  // async processWebhookTransaction(
  //   deal: DealPaymentInfo,
  //   txHash: string,
  //   lt: number,
  // ): Promise<void> {
  //   const events = await this.tonApiService.getAccountEvents(
  //     deal.dealWallet,
  //     10,
  //   )
  //   const event = events.find((e) => e.lt === lt || e.event_id === txHash)
  //   if (!event) return

  //   await this.processEvent(deal, event)
  // }

  async pollWalletTransactions(deal: DealPaymentInfo): Promise<void> {
    const events = await this.tonApiService.getAccountEvents(
      deal.dealWallet,
      20,
    )

    for (const event of events) {
      await this.processEvent(deal, event)
    }
  }

  private async processEvent(
    deal: DealPaymentInfo,
    event: TonApiEvent,
  ): Promise<void> {
    if (event.in_progress) return

    for (const action of event.actions ?? []) {
      if (action.type !== 'JettonTransfer' || action.status !== 'ok') continue

      const transfer = action.JettonTransfer
      if (!transfer?.jetton?.address) continue
      if (!this.isUsdtJetton(transfer.jetton.address)) continue

      const isIncoming = this.addressesEqual(
        transfer.recipient?.address,
        deal.dealWallet,
      )
      const isOutgoing = this.addressesEqual(
        transfer.sender?.address,
        deal.dealWallet,
      )

      if (isIncoming) {
        await this.handleIncomingUsdt(deal, event, transfer)
      } else if (isOutgoing) {
        await this.handleOutgoingUsdt(deal, event.event_id)
      }
    }
  }

  /**
   * Handle an incoming USDT transfer to a deal wallet.
   * Checks amounts, then in redlock creates deposit + DEPOSIT_RECEIVED event.
   */
  private async handleIncomingUsdt(
    deal: DealPaymentInfo,
    event: TonApiEvent,
    transfer: TonApiJettonTransfer,
  ): Promise<void> {
    const amountUsdt = Number(transfer.amount) / USDT_NANO_MULTIPLIER

    // Check USDT amount >= deal price
    if (!new BigDecimal(amountUsdt.toFixed(6)).gte(deal.adPriceUSD)) {
      this.logger.debug(
        {
          dealId: String(deal.id),
          received: amountUsdt.toFixed(6),
          required: deal.adPriceUSD,
        },
        'Insufficient USDT in transaction',
      )
      return
    }

    // Check TON balance >= MIN_TON_AMOUNT
    const accountInfo = await this.tonApiService.getAccountInfo(deal.dealWallet)
    const tonBalance = BigInt(accountInfo.balance)
    const minTonNano = toNano(config.ton.min_ton_amount)

    if (tonBalance < minTonNano) {
      this.logger.debug(
        {dealId: String(deal.id), tonBalance: tonBalance.toString()},
        'Insufficient TON balance',
      )
      return
    }

    const lockKey = `${config.cache_redis.keys.deposit_lock.key}:${deal.id}`
    await this.redis.inRedlock(lockKey, async () => {
      // Check if deposit already exists for this deal
      const exists =
        await this.dealWalletTransactionRepository.existsConfirmedDepositForDeal(
          deal.id,
        )
      if (exists) return

      await inTransaction(
        this.dealWalletTransactionRepository.db,
        async (tx) => {
          await this.dealWalletTransactionRepository.create(
            {
              dealId: deal.id,
              txType: EscrowTxType.DEPOSIT,
              txHash: event.event_id,
              amountNanotons: 0n,
              amountUsdt: amountUsdt.toFixed(6) as AmountUSD,
              fromAddress: transfer.sender?.address ?? null,
              toAddress: deal.dealWallet,
              status: EscrowTxStatus.CONFIRMED,
              confirmedAt: new Date(event.timestamp * 1000),
            },
            tx,
          )

          await this.dealEventRepository.create(
            {
              dealId: deal.id,
              eventType: DealEventType.DEPOSIT_RECEIVED,
              actorType: DealActorType.SYSTEM,
              metadata: {
                amountUsdt: amountUsdt.toFixed(6),
                tonBalance: tonBalance.toString(),
                txHash: event.event_id,
              },
            },
            tx,
          )
        },
      )

      this.logger.info(
        {dealId: String(deal.id), amountUsdt: amountUsdt.toFixed(6)},
        'Deal deposit confirmed',
      )
    })
  }

  /**
   * Handle an outgoing USDT transfer from a deal wallet.
   * Matches by queryId, updates status, creates confirmation event.
   */
  private async handleOutgoingUsdt(
    deal: DealPaymentInfo,
    txHash: string,
  ): Promise<void> {
    // Get full transaction to extract queryId from out_msg decoded body
    const txDetails = await this.tonApiService.getBlockchainTransaction(txHash)
    if (!txDetails.success) return

    const queryId = this.extractQueryId(txDetails)
    if (!queryId) {
      this.logger.debug(
        {dealId: String(deal.id), txHash},
        'No queryId found in outgoing transaction',
      )
      return
    }

    const pendingTx =
      await this.dealWalletTransactionRepository.findByQueryIdAndDealId(
        queryId,
        deal.id,
      )
    if (!pendingTx) return

    await inTransaction(this.dealWalletTransactionRepository.db, async (tx) => {
      await this.dealWalletTransactionRepository.updateStatus(
        pendingTx.id,
        EscrowTxStatus.CONFIRMED,
        txHash,
        tx,
      )

      const eventType =
        pendingTx.txType === EscrowTxType.REFUND
          ? DealEventType.FUNDS_REFUNDED
          : DealEventType.FUNDS_RELEASED

      await this.dealEventRepository.create(
        {
          dealId: deal.id,
          eventType,
          actorType: DealActorType.SYSTEM,
          metadata: {
            txType: pendingTx.txType,
            amountUsdt: pendingTx.amountUsdt,
            txHash,
            queryId,
          },
        },
        tx,
      )
    })

    this.logger.info(
      {dealId: String(deal.id), txType: pendingTx.txType, txHash},
      'Outgoing transaction confirmed',
    )
  }

  /**
   * Create a pending REFUND transaction when a deal is cancelled.
   * The worker will pick it up and execute it.
   */
  async createPendingRefund(
    dealId: bigint,
    tx?: DbOrTransaction,
  ): Promise<void> {
    const deposit =
      await this.dealWalletTransactionRepository.findDepositByDealId(dealId)
    if (!deposit) return

    const refundAddress = deposit.fromAddress
    if (!refundAddress || deposit.amountUsdt === '0') return

    const queryId = generateQueryId()
    await this.dealWalletTransactionRepository.create(
      {
        dealId,
        txType: EscrowTxType.REFUND,
        amountNanotons: JETTON_TRANSFER_GAS_NANOTON,
        amountUsdt: deposit.amountUsdt as AmountUSD,
        toAddress: refundAddress,
        status: EscrowTxStatus.PENDING,
        queryId,
      },
      tx,
    )

    this.logger.info(
      {
        dealId: String(dealId),
        amountUsdt: deposit.amountUsdt,
        toAddress: refundAddress,
      },
      'Pending refund transaction created',
    )
  }

  /**
   * Create a pending RELEASE transaction when a deal is completed.
   * The worker will pick it up and execute it.
   */
  async createPendingRelease(
    dealId: bigint,
    channelWalletAddress: string,
    amountUsdt: string,
    tx?: DbOrTransaction,
  ): Promise<void> {
    const queryId = generateQueryId()
    await this.dealWalletTransactionRepository.create(
      {
        dealId,
        txType: EscrowTxType.RELEASE,
        amountNanotons: JETTON_TRANSFER_GAS_NANOTON,
        amountUsdt: amountUsdt as AmountUSD,
        toAddress: channelWalletAddress,
        status: EscrowTxStatus.PENDING,
        queryId,
      },
      tx,
    )

    this.logger.info(
      {dealId: String(dealId), amountUsdt, toAddress: channelWalletAddress},
      'Pending release transaction created',
    )
  }

  private extractQueryId(
    tx: Awaited<ReturnType<TonApiService['getBlockchainTransaction']>>,
  ): string | null {
    for (const msg of tx.out_msgs ?? []) {
      const qid = msg.decoded_body?.query_id
      if (qid != null) return String(qid)
    }
    return null
  }

  private isUsdtJetton(jettonAddress: string): boolean {
    return this.addressesEqual(jettonAddress, config.ton.usdt_master_address)
  }

  private addressesEqual(
    a: string | undefined,
    b: string | undefined,
  ): boolean {
    if (!a || !b) return false
    try {
      return Address.parse(a).equals(Address.parse(b))
    } catch {
      return a.toLowerCase() === b.toLowerCase()
    }
  }
}

function generateQueryId(): string {
  return String(
    BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000)),
  )
}
