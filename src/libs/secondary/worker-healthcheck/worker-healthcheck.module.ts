import {Module} from '@nestjs/common'
import {WorkerHealthcheckController} from './worker-healthcheck.controller.js'
import {WorkerHealthcheckService} from './worker-healthcheck.service.js'

@Module({
  controllers: [WorkerHealthcheckController],
  providers: [WorkerHealthcheckService],
  exports: [WorkerHealthcheckService],
})
export class WorkerHealthcheckModule {}
