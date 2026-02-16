import {Controller} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../config/config.js'
import {Interval} from '../../../libs/worker/nest.js'
import {tryCatch} from '../../../simple-result.js'
import {TonPaymentWorkerService} from './ton-payment-worker.service.js'

@Controller()
export class TonPaymentWorkerController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly tonPaymentWorkerService: TonPaymentWorkerService,
  ) {
    this.logger.setContext(TonPaymentWorkerController.name)
  }

  @Interval(config.deal_worker.payment_check_interval)
  async executePendingTransactions() {
    const {data: result, error} = await tryCatch(
      this.tonPaymentWorkerService.executePendingTransactions(),
    )
    if (error) {
      this.logger.error({err: error}, 'Failed to execute pending transactions')
    } else if (result && result > 0) {
      this.logger.info({executedCount: result}, 'Executed pending transactions')
    }
  }

  @Interval(config.deal_worker.wallet_poll_interval)
  async pollDealWallets() {
    console.log('pollDealWallets')
    const {data: result, error} = await tryCatch(
      this.tonPaymentWorkerService.pollDealWalletTransactions(),
    )
    if (error) {
      this.logger.error({err: error}, 'Failed to poll deal wallets')
    } else if (result && result > 0) {
      this.logger.info({polledCount: result}, 'Polled deal wallet transactions')
    }
  }
}
