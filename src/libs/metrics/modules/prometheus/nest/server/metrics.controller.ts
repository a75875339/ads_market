import {Controller, Get, Header, Inject} from '@nestjs/common'
import {MetricsRegistryInjector} from './injectors.js'
import type {MetricsRegistryInterface} from './types.js'

@Controller('metrics')
export class MetricsController {
  constructor(
    @Inject(MetricsRegistryInjector)
    private readonly monitoringService: MetricsRegistryInterface,
  ) {}

  @Get()
  @Header('content-type', 'text/plain')
  getMetrics(): Promise<string> {
    return this.monitoringService.getMetrics()
  }
}
