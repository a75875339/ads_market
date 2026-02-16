import {Injectable} from '@nestjs/common'
import type {Bot, CommandContext} from 'grammy'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../config/config.js'
import {DealActorType, DealEventType, TopicRole} from '../../../db/constants.js'
import {DealRepository} from '../../../db/repositories/deal.repository.js'
import {DealEventRepository} from '../../../db/repositories/deal-event.repository.js'
import {
  DealTopicRepository,
  type ForwardingTarget,
} from '../../../db/repositories/deal-topic.repository.js'
import {RedisStorageService} from '../../../libs/secondary/redis/redis.service.js'
import {tryCatchRetry} from '../../../retry.js'
import {tryCatch} from '../../../simple-result.js'
import {
  creativeCancelledText,
  creativeCommandPromptText,
  creativeMessageForPostingText,
  creativeNoDealFoundText,
  creativeNoPendingText,
  creativeOnlyInTopicText,
  creativeSavedText,
} from './formatters/common-messages.js'
import type {BotContext} from './telegram.context.js'

type CreativePending = {
  dealId: string
  role: string
}

@Injectable()
export class DealTopicHandlersService {
  private bot: Bot<BotContext> | null = null

  constructor(
    private readonly logger: PinoLogger,
    private readonly dealTopicRepository: DealTopicRepository,
    private readonly dealRepository: DealRepository,
    private readonly dealEventRepository: DealEventRepository,
    private readonly redis: RedisStorageService,
  ) {
    this.logger.setContext(DealTopicHandlersService.name)
  }

  setBotAndRegisterHandlers(bot: Bot<BotContext>): void {
    this.bot = bot

    this.bot.command('creative', async (ctx) => {
      await this.handleCreativeCommand(ctx)
    })

    this.bot.command('cancel_creative', async (ctx) => {
      await this.handleCancelCreativeCommand(ctx)
    })

    this.bot.on('message', async (ctx, next) => {
      const topicId = ctx.message.message_thread_id
      if (!topicId) return next()

      const creativeHandled = await this.handleCreativeCapture(ctx, topicId)
      if (creativeHandled) return

      if (!ctx.message.from?.id || ctx.message.from?.id !== ctx.chat?.id) return

      const telegramId = BigInt(ctx.user.telegramId)
      const targets = await this.dealTopicRepository.findForwardingTargets(
        topicId,
        telegramId,
      )
      await this.forwardToTargets(ctx, targets)
    })
  }

  private async handleCreativeCommand(
    ctx: CommandContext<BotContext>,
  ): Promise<void> {
    const topicId = ctx.message?.message_thread_id
    if (!topicId) {
      await ctx.reply(creativeOnlyInTopicText)
      return
    }

    const dealTopic = await this.dealTopicRepository.findByTopicIdAndTelegramId(
      topicId,
      BigInt(ctx.user.telegramId),
    )

    if (!dealTopic) {
      await ctx.reply(creativeNoDealFoundText)
      return
    }

    const redisKey = this.creativePendingKey(ctx.chat!.id, topicId)
    const pending: CreativePending = {
      dealId: dealTopic.dealId.toString(),
      role: dealTopic.role,
    }

    await this.redis.set(
      redisKey,
      pending,
      config.cache_redis.keys.creative_pending.ttl,
    )

    await ctx.reply(creativeCommandPromptText)
  }

  private async handleCancelCreativeCommand(
    ctx: CommandContext<BotContext>,
  ): Promise<void> {
    const topicId = ctx.message?.message_thread_id
    if (!topicId) {
      await ctx.reply(creativeOnlyInTopicText)
      return
    }

    const redisKey = this.creativePendingKey(ctx.chat!.id, topicId)
    const pending = await this.redis.getAndDelete<CreativePending>(redisKey)

    if (!pending) {
      await ctx.reply(creativeNoPendingText)
      return
    }

    await ctx.reply(creativeCancelledText)
  }

  private async handleCreativeCapture(
    ctx: BotContext,
    topicId: number,
  ): Promise<boolean> {
    if (!ctx.chat) return false

    const redisKey = this.creativePendingKey(ctx.chat.id, topicId)
    const pending = await this.redis.getAndDelete<CreativePending>(redisKey)
    if (!pending) return false

    const dealId = BigInt(pending.dealId)
    const creativeContent = this.extractCreativeContent(ctx)

    const {error: updateError} = await tryCatch(
      this.dealRepository.update(dealId, {
        creativeData: {content: creativeContent},
      }),
    )

    if (updateError) {
      this.logger.warn(
        {err: updateError, dealId: dealId.toString()},
        'Failed to save creative data to deal',
      )
      return true
    }

    await tryCatch(
      this.dealEventRepository.deleteByDealAndTypeAndActor(
        dealId,
        DealEventType.CREATIVE_CONFIRMED,
      ),
    )

    const actorType =
      pending.role === TopicRole.ADVERTISER
        ? DealActorType.ADVERTISER
        : DealActorType.CHANNEL

    await tryCatch(
      this.dealEventRepository.create({
        dealId,
        eventType: DealEventType.CREATIVE_SUBMITTED,
        actorType,
        actorId: BigInt(ctx.user.id),
      }),
    )

    const telegramId = BigInt(ctx.user.telegramId)
    const targets = await this.dealTopicRepository.findForwardingTargets(
      topicId,
      telegramId,
    )
    await this.forwardToTargets(ctx, targets, creativeMessageForPostingText)

    await ctx.reply(creativeSavedText)
    return true
  }

  private extractCreativeContent(ctx: BotContext): Record<string, unknown> {
    const msg = ctx.message
    if (!msg) return {}

    const content: Record<string, unknown> = {}

    if (msg.text) {
      content.text = msg.text
    }

    if (msg.caption) {
      content.caption = msg.caption
    }

    if (msg.photo && msg.photo.length > 0) {
      content.photo = msg.photo.map((p) => ({
        file_id: p.file_id,
        file_unique_id: p.file_unique_id,
        width: p.width,
        height: p.height,
      }))
    }

    if (msg.video) {
      content.video = {
        file_id: msg.video.file_id,
        file_unique_id: msg.video.file_unique_id,
        width: msg.video.width,
        height: msg.video.height,
        duration: msg.video.duration,
      }
    }

    if (msg.document) {
      content.document = {
        file_id: msg.document.file_id,
        file_unique_id: msg.document.file_unique_id,
        file_name: msg.document.file_name,
        mime_type: msg.document.mime_type,
      }
    }

    if (msg.animation) {
      content.animation = {
        file_id: msg.animation.file_id,
        file_unique_id: msg.animation.file_unique_id,
        width: msg.animation.width,
        height: msg.animation.height,
        duration: msg.animation.duration,
      }
    }

    content.messageId = msg.message_id
    content.chatId = ctx.chat!.id

    return content
  }

  private async forwardToTargets(
    ctx: BotContext,
    targets: ForwardingTarget[],
    extraMessage?: string,
  ): Promise<void> {
    if (!ctx.message || !ctx.chat) return

    for (const target of targets) {
      const {error} = await tryCatchRetry(() =>
        this.bot!.api.forwardMessage(
          target.telegramId,
          ctx.chat!.id,
          ctx.message!.message_id,
          {message_thread_id: target.topicId},
        ),
      )

      if (error) {
        this.logger.warn(
          {
            err: error,
            targetTelegramId: target.telegramId,
            topicId: target.topicId,
          },
          'Failed to forward deal topic message',
        )
      }

      if (extraMessage) {
        const {error} = await tryCatchRetry(() =>
          this.bot!.api.sendMessage(target.telegramId, extraMessage, {
            message_thread_id: target.topicId,
          }),
        )
        if (error) {
          this.logger.warn(
            {
              err: error,
              targetTelegramId: target.telegramId,
              topicId: target.topicId,
            },
            'Failed to send extra message',
          )
        }
      }
    }
  }

  private creativePendingKey(chatId: number, topicId: number): string {
    return `${config.cache_redis.keys.creative_pending.key}:${chatId}:${topicId}`
  }
}
