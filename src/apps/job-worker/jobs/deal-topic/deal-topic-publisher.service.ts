import {InjectQueue} from '@nestjs/bullmq'
import {Injectable} from '@nestjs/common'
import {Queue} from 'bullmq'
import {QueueNames} from '../constants.js'
import type {DealTopicJobData} from './types.js'

@Injectable()
export class DealTopicPublisherService {
  constructor(
    @InjectQueue(QueueNames.DealTopicCreation)
    private readonly dealTopicQueue: Queue<DealTopicJobData>,
  ) {}

  async publishDealTopicCreationBatch(jobs: DealTopicJobData[]) {
    return this.dealTopicQueue.addBulk(
      jobs.map((data) => ({
        name: 'deal-topic-creation',
        data,
      })),
    )
  }
}
