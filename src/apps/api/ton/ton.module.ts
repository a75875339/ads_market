import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {BlockchainModule} from '../../../modules/blockchain/blockchain.module.js'
import {AuthGuardModule} from '../guards/auth/auth-guard.module.js'
import {DealGuardModule} from '../guards/deal-guard/deal-guard.module.js'
import {TonController} from './ton.controller.js'
import {TonService} from './ton.service.js'

@Module({
  imports: [DbModule, BlockchainModule, AuthGuardModule, DealGuardModule],
  controllers: [TonController],
  providers: [TonService],
})
export class TonModule {}
