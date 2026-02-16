import {BullModule} from '@nestjs/bullmq'
import {Module} from '@nestjs/common'
import {DbModule} from '../../../../db/db.module.js'
import {dealTopicQueueOptions} from './common.js'
import {DealTopicJobService} from './deal-topic-job.service.js'

@Module({
  imports: [BullModule.registerQueue(dealTopicQueueOptions), DbModule],
  providers: [DealTopicJobService],
})
export class DealTopicJobModule {}
