import {Controller, Get, Head} from '@nestjs/common'

@Controller()
export class HealthcheckController {
  @Get('/healthcheck')
  healthcheck(): {status: string} {
    return {status: 'OK'}
  }

  @Head('/healthcheck')
  healthcheckHead(): void {
    return
  }
}
