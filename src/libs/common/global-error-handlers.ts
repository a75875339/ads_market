import {Logger} from 'nestjs-pino'
import {MetricsService} from '../secondary/metrics/metrics.service.js'

export function registerErrorHandlers(
  metricsService: MetricsService,
  logger: Logger,
): void {
  process.on('unhandledRejection', (err: Error) => {
    logger.error(
      {
        err,
      },
      'unhandledRejection',
    )

    metricsService.incUnhandledErrorsCount()
  })

  process.on('uncaughtException', (err: Error) => {
    logger.error(
      {
        err,
      },
      'uncaughtException',
    )

    metricsService.incUnhandledErrorsCount()
  })
}
