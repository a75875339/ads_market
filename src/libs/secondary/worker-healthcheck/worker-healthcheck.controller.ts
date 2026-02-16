import {
  Controller,
  Get,
  Head,
  InternalServerErrorException,
  Param,
} from '@nestjs/common'

import {WorkerHealthcheckService} from './worker-healthcheck.service.js'

@Controller()
export class WorkerHealthcheckController {
  constructor(private readonly healthcheckService: WorkerHealthcheckService) {}

  @Get(`/healthcheck`)
  healthcheckGet(): string {
    const isValid = this.healthcheckService.isOk()

    if (isValid) {
      return 'OK'
    }

    throw new InternalServerErrorException()
  }

  @Head(`/healthcheck`)
  healthcheckHead(): string {
    const isValid = this.healthcheckService.isOk()

    if (isValid) {
      return 'OK'
    }

    throw new InternalServerErrorException()
  }

  @Get('/lastUpdateTime/:workerName')
  getLastUpdateTime(@Param('workerName') workerName: string): number {
    return this.healthcheckService.getLastProcessedTime(workerName)
  }
}
