import type {RegisterQueueOptions} from '@nestjs/bullmq'
import {config} from '../../../../config/config.js'
import {adMarketConfig} from '../../../../libs/secondary/bullmq/connection-options.js'
import {QueueNames} from '../constants.js'

export const dealTopicQueueOptions: RegisterQueueOptions = {
  configKey: adMarketConfig,
  name: QueueNames.DealTopicCreation,
  defaultJobOptions: {
    attempts: config.queues.deal_topic_queue.task_max_attempts,
    backoff: {
      type: 'fixed',
      delay: config.queues.deal_topic_queue.retry_delay.toMilliseconds(),
    },
    removeOnComplete: config.queues.deal_topic_queue.remove_on_complete,
    removeOnFail: config.queues.deal_topic_queue.remove_on_fail,
  },
}
