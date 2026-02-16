import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {RedisModule} from '../../../libs/secondary/redis/redis.module.js'
import {BlockchainModule} from '../../../modules/blockchain/blockchain.module.js'
import {DealTopicPublisherModule} from '../../job-worker/jobs/deal-topic/deal-topic-publisher.module.js'
import {AuthGuardModule} from '../guards/auth/auth-guard.module.js'
import {ChannelManagerGuardModule} from '../guards/channel-manager-guard/channel-manager-guard.module.js'
import {DealGuardModule} from '../guards/deal-guard/deal-guard.module.js'
import {DealController} from './deal.controller.js'
import {DealService} from './deal.service.js'

@Module({
  imports: [
    DbModule,
    RedisModule,
    BlockchainModule,
    AuthGuardModule,
    ChannelManagerGuardModule,
    DealGuardModule,
    DealTopicPublisherModule,
  ],
  controllers: [DealController],
  providers: [DealService],
  exports: [DealService],
})
export class DealModule {}
