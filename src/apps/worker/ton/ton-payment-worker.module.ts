import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {BlockchainModule} from '../../../modules/blockchain/blockchain.module.js'
import {TonPaymentWorkerController} from './ton-payment-worker.controller.js'
import {TonPaymentWorkerService} from './ton-payment-worker.service.js'

@Module({
  imports: [DbModule, BlockchainModule],
  controllers: [TonPaymentWorkerController],
  providers: [TonPaymentWorkerService],
})
export class TonPaymentWorkerModule {}
