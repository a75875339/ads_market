import {Module} from '@nestjs/common'
import {DbModule} from '../../../db/db.module.js'
import {BlockchainModule} from '../../../modules/blockchain/blockchain.module.js'
import {DealWorkerController} from './deal-worker.controller.js'
import {DealWorkerService} from './deal-worker.service.js'

@Module({
  imports: [DbModule, BlockchainModule],
  controllers: [DealWorkerController],
  providers: [DealWorkerService],
})
export class DealWorkerModule {}
