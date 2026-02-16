import {Inject, Injectable} from '@nestjs/common'
import {Bot} from 'grammy'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../config/config.js'
import {
  DealActorType,
  DealEventType,
  DealStatus,
} from '../../../db/constants.js'
import {DB_TOKEN, type DBType} from '../../../db/db.tokens.js'
import {
  ChannelRepository,
  type ChannelRow,
} from '../../../db/repositories/channel.repository.js'
import {
  DealRepository,
  type DealRow,
} from '../../../db/repositories/deal.repository.js'
import {DealEventRepository} from '../../../db/repositories/deal-event.repository.js'
import {inTransaction} from '../../../db/utils.js'
import {TonPaymentProcessorService} from '../../../modules/blockchain/ton-payment-processor.service.js'
import {tryCatch} from '../../../simple-result.js'

@Injectable()
export class DealWorkerService {
  private readonly bot: Bot

  constructor(
    private readonly logger: PinoLogger,
    @Inject(DB_TOKEN) private readonly db: DBType,
    private readonly dealRepository: DealRepository,
    private readonly dealEventRepository: DealEventRepository,
    readonly _channelRepository: ChannelRepository,
    private readonly tonPaymentProcessor: TonPaymentProcessorService,
  ) {
    this.logger.setContext(DealWorkerService.name)
    this.bot = new Bot(config.bot.token)
  }

  async findAndCancelOverdueDeals(): Promise<number> {
    let cancelledCount = 0

    // Case 1: paid + AD_PARAMETERS_CONFIRMED + adScheduleAt < now() + status NEGOTIATION
    const negotiationDeals =
      await this.dealRepository.findOverduePaidNegotiationDeals()

    for (const deal of negotiationDeals) {
      await this.cancelDealBySystem(deal.id, {
        reason: 'Ad schedule time passed while in negotiation',
      })
      cancelledCount++
    }

    // Case 2: paid + no AD_PARAMETERS_CONFIRMED + paidAt + 1 day < now()
    const paidNoParamsDeals =
      await this.dealRepository.findPaidWithoutParamsOverdue()

    for (const deal of paidNoParamsDeals) {
      await this.cancelDealBySystem(deal.id, {
        reason: 'Payment timeout: ad parameters not confirmed within 24 hours',
      })
      cancelledCount++
    }

    return cancelledCount
  }

  async findAndPostScheduledDeals(): Promise<number> {
    const readyDeals = await this.dealRepository.findScheduledReadyToPost()
    let postedCount = 0

    for (const deal of readyDeals) {
      const {data, error} = await tryCatch(
        this.postDealToChannel(deal.deals, deal.channels!),
      )
      if (error) {
        this.logger.error(
          {err: error, dealId: String(deal.deals.id)},
          'Failed to post deal to channel',
        )
        continue
      }
      if (data) {
        postedCount++
      }
    }

    return postedCount
  }

  async findAndCompletePostedDeals(): Promise<number> {
    const postedDeals = await this.dealRepository.findPostedReadyToComplete()
    let completedCount = 0

    for (const deal of postedDeals) {
      await tryCatch(
        this.bot.api.deleteMessage(
          deal.channels!.telegramChatId.toString(),
          +deal.deals.postedMessageId!.toString(),
        ),
      )

      await inTransaction(this.db, async (tx) => {
        await this.dealRepository.update(
          deal.deals.id,
          {
            status: DealStatus.COMPLETED,
            completedAt: new Date(),
          },
          tx,
        )

        await this.dealEventRepository.create(
          {
            dealId: deal.deals.id,
            eventType: DealEventType.STATUS_CHANGED,
            actorType: DealActorType.SYSTEM,
            metadata: {
              from: DealStatus.POSTED,
              to: DealStatus.COMPLETED,
            },
          },
          tx,
        )

        const channelWallet = deal.channels?.rewardWalletAddress
        if (channelWallet && deal.deals.adPriceUSD) {
          const {error: releaseError} = await tryCatch(
            this.tonPaymentProcessor.createPendingRelease(
              deal.deals.id,
              channelWallet,
              deal.deals.adPriceUSD,
              tx,
            ),
          )
          if (releaseError) {
            this.logger.error(
              {err: releaseError, dealId: String(deal.deals.id)},
              'Failed to create pending release transaction',
            )
          }
        }
      })

      completedCount++
    }

    return completedCount
  }

  private async postDealToChannel(deal: DealRow, channel: ChannelRow) {
    const creative = deal.creativeData as {content: any} | null
    if (!creative?.content) {
      this.logger.warn(
        {dealId: String(deal.id)},
        'No creative content for deal',
      )
      return false
    }

    // todo: send in queue with retry
    const {data: result, error} = await tryCatch(
      // todo: do normal send message
      this.bot.api.sendMessage(
        channel.telegramChatId.toString(),
        creative.content.text ?? creative.content.caption ?? 'empty text post',
        {
          parse_mode: 'HTML',
        },
      ),
    )
    if (error || !result) {
      this.logger.error(
        {err: error, dealId: String(deal.id)},
        'Failed to send message to channel',
      )

      await this.cancelDealBySystem(deal.id, {
        reason: 'Failed to send message to channel',
        error: error?.message,
      })
      return false
    }

    const messageId = BigInt(result.message_id)
    const now = new Date()

    await inTransaction(this.db, async (tx) => {
      await this.dealRepository.update(
        deal.id,
        {
          status: DealStatus.POSTED,
          postedAt: now,
          postedMessageId: messageId ? BigInt(messageId) : null,
        },
        tx,
      )

      await this.dealEventRepository.create(
        {
          dealId: deal.id,
          eventType: DealEventType.POSTED,
          actorType: DealActorType.SYSTEM,
          metadata: {
            messageId,
            postedAt: now.toISOString(),
          },
        },
        tx,
      )
    })

    return true
  }

  async cancelDealBySystem(
    dealId: bigint,
    metadata: {reason: string; error?: string},
  ) {
    await inTransaction(this.db, async (tx) => {
      await this.dealRepository.update(
        dealId,
        {
          status: DealStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: metadata.reason,
        },
        tx,
      )

      await this.dealEventRepository.create(
        {
          dealId,
          eventType: DealEventType.CANCELLED,
          actorType: DealActorType.SYSTEM,
          metadata,
        },
        tx,
      )
    })

    // todo: do cancelation in queue with retry and put createPendingRefund in transaction
    const {error: refundError} = await tryCatch(
      this.tonPaymentProcessor.createPendingRefund(dealId),
    )
    if (refundError) {
      this.logger.error(
        {err: refundError, dealId: String(dealId)},
        'Failed to create pending refund transaction',
      )
    }
  }
}
