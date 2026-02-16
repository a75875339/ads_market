import {Injectable} from '@nestjs/common'
import {Address} from '@ton/core'
import {PinoLogger} from 'nestjs-pino'
import {DealStatus, EscrowTxStatus} from '../../../db/constants.js'
import {DealRepository} from '../../../db/repositories/deal.repository.js'
import {DealWalletTransactionRepository} from '../../../db/repositories/deal-wallet-transaction.repository.js'
import {USDT_NANO_MULTIPLIER} from '../../../modules/blockchain/ton.constants.js'
import {TonClientService} from '../../../modules/blockchain/ton-client.service.js'
import {TonPaymentProcessorService} from '../../../modules/blockchain/ton-payment-processor.service.js'
import {tryCatch} from '../../../simple-result.js'

const POLL_STATUSES = [DealStatus.DRAFT, DealStatus.NEGOTIATION] as const

@Injectable()
export class TonPaymentWorkerService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly dealRepository: DealRepository,
    private readonly dealWalletTransactionRepository: DealWalletTransactionRepository,
    private readonly tonClientService: TonClientService,
    private readonly tonPaymentProcessor: TonPaymentProcessorService,
  ) {
    this.logger.setContext(TonPaymentWorkerService.name)
  }

  async executePendingTransactions(): Promise<number> {
    const pendingTxs =
      await this.dealWalletTransactionRepository.findPendingOutgoing()
    let executedCount = 0

    for (const tx of pendingTxs) {
      if (!tx.toAddress || !tx.amountUsdt || !tx.queryId) continue

      const deal = await this.dealRepository.findById(tx.dealId)
      if (!deal) {
        this.logger.warn(
          {txId: String(tx.id), dealId: String(tx.dealId)},
          'Deal not found for pending transaction',
        )
        await this.dealWalletTransactionRepository.updateStatus(
          tx.id,
          EscrowTxStatus.FAILED,
        )
        continue
      }

      // Update status to executing
      await this.dealWalletTransactionRepository.updateStatus(
        tx.id,
        EscrowTxStatus.EXECUTING,
      )

      const usdtAmountNano = BigInt(
        Math.round(Number.parseFloat(tx.amountUsdt) * USDT_NANO_MULTIPLIER),
      )

      const {error} = await tryCatch(
        this.tonClientService.sendUsdt(
          deal.campaignId,
          deal.id,
          Address.parse(tx.toAddress),
          usdtAmountNano,
          BigInt(tx.queryId),
        ),
      )

      if (error) {
        this.logger.error(
          {err: error, txId: String(tx.id), dealId: String(tx.dealId)},
          'Failed to execute outgoing transaction',
        )
        // Revert to pending for retry
        await this.dealWalletTransactionRepository.updateStatus(
          tx.id,
          EscrowTxStatus.PENDING,
        )
        continue
      }

      this.logger.info(
        {
          txId: String(tx.id),
          dealId: String(tx.dealId),
          txType: tx.txType,
          amountUsdt: tx.amountUsdt,
        },
        'Outgoing transaction sent',
      )
      executedCount++
    }

    return executedCount
  }

  async pollDealWalletTransactions(): Promise<number> {
    const dealsWithWallets = await this.dealRepository.findWithWalletInStatuses(
      [...POLL_STATUSES],
    )
    let processedCount = 0

    for (const deal of dealsWithWallets) {
      if (!deal.dealWallet || !deal.adPriceUSD) continue

      const {error} = await tryCatch(
        this.tonPaymentProcessor.pollWalletTransactions({
          id: deal.id,
          dealWallet: deal.dealWallet,
          adPriceUSD: deal.adPriceUSD,
        }),
      )
      if (error) {
        this.logger.error(
          {err: error, dealId: String(deal.id)},
          'Failed to poll wallet transactions',
        )
        continue
      }
      processedCount++
    }

    return processedCount
  }
}
