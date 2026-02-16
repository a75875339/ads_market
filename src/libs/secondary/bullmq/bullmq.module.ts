import {BullModule} from '@nestjs/bullmq'
import {
  adMarketConfig,
  getAdMarketRedisConnectionOptions,
} from './connection-options.js'

export const BullmqAdMarket = BullModule.forRoot(adMarketConfig, {
  connection: getAdMarketRedisConnectionOptions(),
})
