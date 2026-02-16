import {Controller} from '@nestjs/common'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../config/config.js'
import {Interval} from '../../../libs/worker/nest.js'
import {tryCatch} from '../../../simple-result.js'
import {DealWorkerService} from './deal-worker.service.js'

@Controller()
export class DealWorkerController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly dealWorkerService: DealWorkerService,
  ) {
    this.logger.setContext(DealWorkerController.name)
  }

  @Interval(config.deal_worker.cancel_interval)
  async cancelOverdueDeals() {
    const {data: result, error} = await tryCatch(
      this.dealWorkerService.findAndCancelOverdueDeals(),
    )
    if (error) {
      this.logger.error({err: error}, 'Failed to cancel overdue deals')
    } else if (result && result > 0) {
      this.logger.info({cancelledCount: result}, 'Cancelled overdue deals')
    }
  }

  @Interval(config.deal_worker.post_interval)
  async postScheduledDeals() {
    const {data: result, error} = await tryCatch(
      this.dealWorkerService.findAndPostScheduledDeals(),
    )
    if (error) {
      this.logger.error({err: error}, 'Failed to post scheduled deals')
    } else if (result && result > 0) {
      this.logger.info({postedCount: result}, 'Posted scheduled deals')
    }
  }

  @Interval(config.deal_worker.complete_interval)
  async completePostedDeals() {
    const {data: result, error} = await tryCatch(
      this.dealWorkerService.findAndCompletePostedDeals(),
    )
    if (error) {
      this.logger.error({err: error}, 'Failed to complete posted deals')
    } else if (result && result > 0) {
      this.logger.info({completedCount: result}, 'Completed posted deals')
    }
  }
}
