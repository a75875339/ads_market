import {Injectable} from '@nestjs/common'
import type {Bot} from 'grammy'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../config/config.js'
import {
  DealActorType,
  DealEventType,
  DealStatus,
} from '../../../db/constants.js'
import {DealRepository} from '../../../db/repositories/deal.repository.js'
import {DealEventRepository} from '../../../db/repositories/deal-event.repository.js'
import {inTransaction} from '../../../db/utils.js'
import {RedisStorageService} from '../../../libs/secondary/redis/redis.service.js'
import {tryCatch} from '../../../simple-result.js'
import type {BotContext} from './telegram.context.js'

@Injectable()
export class ChannelPostHandlersService {
  private bot: Bot<BotContext> | null = null

  constructor(
    private readonly logger: PinoLogger,
    private readonly dealRepository: DealRepository,
    private readonly dealEventRepository: DealEventRepository,
    private readonly redis: RedisStorageService,
  ) {
    this.logger.setContext(ChannelPostHandlersService.name)
  }

  setBotAndRegisterHandlers(bot: Bot<BotContext>): void {
    this.bot = bot

    this.bot.on('edited_channel_post', async (ctx) => {
      await this.handleEditedChannelPost(ctx)
    })

    this.bot.on('channel_post', async (ctx) => {
      await this.handleChannelPost(ctx)
    })
  }

  /** Cancel deal if someone edits the ad post in the channel */
  private async handleEditedChannelPost(ctx: BotContext): Promise<void> {
    const post = ctx.editedChannelPost
    if (!post) return

    const chatId = BigInt(post.chat.id)
    const messageId = BigInt(post.message_id)

    const {data: result, error} = await tryCatch(
      this.dealRepository.findPostedByChannelChatIdAndMessageId(
        chatId,
        messageId,
      ),
    )

    if (error) {
      this.logger.warn(
        {
          err: error,
          chatId: chatId.toString(),
          messageId: messageId.toString(),
        },
        'Failed to check edited channel post',
      )
      return
    }

    if (!result) return

    await this.cancelDealBySystem(
      result.deals.id,
      'Ad post was edited in channel',
    )
  }

  /** Cancel deals if a new post is published before top time expires */
  private async handleChannelPost(ctx: BotContext): Promise<void> {
    const post = ctx.channelPost
    if (!post) return

    const chatId = BigInt(post.chat.id)

    const {data: postedDeals, error} = await tryCatch(
      this.dealRepository.findPostedInTopTimeByChannelChatId(chatId),
    )

    if (error) {
      this.logger.warn(
        {err: error, chatId: chatId.toString()},
        'Failed to check channel post for top time violation',
      )
      return
    }

    if (!postedDeals || postedDeals.length === 0) return

    const newMessageId = BigInt(post.message_id)
    for (const row of postedDeals) {
      // skip the deal's own posted message
      if (row.deals.postedMessageId === newMessageId) continue

      await this.cancelDealBySystem(
        row.deals.id,
        'New post published in channel before top time expired',
      )
    }
  }

  private async cancelDealBySystem(
    dealId: bigint,
    reason: string,
  ): Promise<void> {
    const lockKey = `${config.cache_redis.keys.deal_update_lock.key}:${dealId}`

    // todo: return money to advertiser
    await this.redis.inRedlock(lockKey, () =>
      inTransaction(this.dealRepository.db, async (tx) => {
        await this.dealRepository.update(
          dealId,
          {
            status: DealStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: reason,
          },
          tx,
        )

        await this.dealEventRepository.create(
          {
            dealId,
            eventType: DealEventType.CANCELLED,
            actorType: DealActorType.SYSTEM,
            metadata: {reason},
          },
          tx,
        )
      }),
    )
  }
}
