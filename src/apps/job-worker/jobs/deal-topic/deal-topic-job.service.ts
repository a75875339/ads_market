import {Processor, WorkerHost} from '@nestjs/bullmq'
import {Job} from 'bullmq'
import {Bot} from 'grammy'
import type {InlineKeyboardMarkup} from 'grammy/types'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../../config/config.js'
import {DealTopicRepository} from '../../../../db/repositories/deal-topic.repository.js'
import {UserRepository} from '../../../../db/repositories/user.repository.js'
import {tryCatch} from '../../../../simple-result.js'
import {QueueNames} from '../constants.js'
import {formatDealTopicStartMessage} from './deal-topic.formatter.js'
import type {DealTopicJobData} from './types.js'

@Processor(QueueNames.DealTopicCreation, {
  concurrency: config.queues.deal_topic_queue.concurrency,
})
export class DealTopicJobService extends WorkerHost {
  private readonly bot: Bot

  constructor(
    private readonly logger: PinoLogger,
    private readonly dealTopicRepository: DealTopicRepository,
    private readonly userRepository: UserRepository,
  ) {
    super()
    this.logger.setContext(DealTopicJobService.name)
    this.bot = new Bot(config.bot.token)
  }

  async process(job: Job<DealTopicJobData>) {
    const {dealId, userId, role, ...rest} = job.data
    this.logger.info(
      {jobId: job.id, dealId, userId},
      'Processing deal topic creation job',
    )

    const user = await this.userRepository.findById(BigInt(userId))
    if (!user || !user.telegramId) {
      this.logger.debug({userId}, 'User has no telegram ID, skipping')
      return
    }

    const topicName = `Deal #${dealId}`
    const telegramId = user.telegramId.toString()

    const topic = await this.bot.api.createForumTopic(telegramId, topicName)

    const startMessage = formatDealTopicStartMessage({
      dealId: BigInt(dealId),
      channelTitle: rest.channelTitle,
      campaignTitle: rest.campaignTitle,
      draftDealMessage: rest.draftDealMessage,
      role,
      adPriceUSD: rest.adPriceUSD,
      adScheduleAt: rest.adScheduleAt ? new Date(rest.adScheduleAt) : null,
    })

    const {data: message, error: msgError} = await tryCatch(
      this.sendTopicMessage(telegramId, topic.message_thread_id, startMessage),
    )

    if (msgError) {
      this.logger.warn(
        {err: msgError, dealId, topicId: topic.message_thread_id},
        'Failed to send start message in topic',
      )
    }

    await this.dealTopicRepository.create({
      dealId: BigInt(dealId),
      userId: BigInt(userId),
      topicId: topic.message_thread_id,
      role,
      startMessageId: message?.message_id ?? null,
    })

    this.logger.info(
      {jobId: job.id, dealId, topicId: topic.message_thread_id},
      'Deal topic creation job completed',
    )
  }

  private async sendTopicMessage(
    telegramId: string,
    topicId: number,
    text: string,
    reply_markup?: InlineKeyboardMarkup,
  ) {
    return this.bot.api.sendMessage(telegramId, text, {
      message_thread_id: topicId,
      parse_mode: 'HTML',
      reply_markup,
      link_preview_options: {is_disabled: true},
    })
  }
}
