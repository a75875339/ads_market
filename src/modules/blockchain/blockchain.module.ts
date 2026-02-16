import {Module} from '@nestjs/common'
import {DbModule} from '../../db/db.module.js'
import {RedisModule} from '../../libs/secondary/redis/redis.module.js'
import {TonApiService} from './ton-api.service.js'
import {TonClientService} from './ton-client.service.js'
import {TonPaymentProcessorService} from './ton-payment-processor.service.js'
import {TonWalletService} from './ton-wallet.service.js'

@Module({
  imports: [DbModule, RedisModule],
  providers: [
    TonWalletService,
    TonClientService,
    TonApiService,
    TonPaymentProcessorService,
  ],
  exports: [
    TonWalletService,
    TonClientService,
    TonApiService,
    TonPaymentProcessorService,
  ],
})
export class BlockchainModule {}
