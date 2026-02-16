import {Module} from '@nestjs/common'
import {SharedLoggerModule} from '../../libs/common/shared-dynamic-modules.js'
import {DbModule} from '../../db/db.module.js'
import {HealthcheckModule} from '../../libs/secondary/api-healthcheck/healthcheck.module.js'
import {BullmqAdMarket} from '../../libs/secondary/bullmq/bullmq.module.js'
import {MetricsModule} from '../../libs/secondary/metrics/index.js'
import {RedisModule} from '../../libs/secondary/redis/redis.module.js'
import {AdFormatModule} from './ad-format/ad-format.module.js'
import {AuthModule} from './auth/auth.module.js'
import {CampaignModule} from './campaign/campaign.module.js'
import {CategoryModule} from './category/category.module.js'
import {ChannelModule} from './channel/channel.module.js'
import {ManagerModule} from './channel-manager/manager.module.js'
import {DealModule} from './deal/deal.module.js'
import {TonModule} from './ton/ton.module.js'

@Module({
  imports: [
    SharedLoggerModule,
    MetricsModule,
    HealthcheckModule,
    RedisModule,
    DbModule,
    BullmqAdMarket,
    AuthModule,
    AdFormatModule,
    CategoryModule,
    ChannelModule,
    ManagerModule,
    CampaignModule,
    DealModule,
    TonModule,
  ],
})
export class ApiAppModule {}
