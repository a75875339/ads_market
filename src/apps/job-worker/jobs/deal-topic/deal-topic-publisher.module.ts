import {BullModule} from '@nestjs/bullmq'
import {Module} from '@nestjs/common'
import {dealTopicQueueOptions} from './common.js'
import {DealTopicPublisherService} from './deal-topic-publisher.service.js'

@Module({
  imports: [BullModule.registerQueue(dealTopicQueueOptions)],
  providers: [DealTopicPublisherService],
  exports: [DealTopicPublisherService],
})
export class DealTopicPublisherModule {}
