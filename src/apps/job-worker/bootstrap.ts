import type {NestApplicationOptions} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import type {NestFastifyApplication} from '@nestjs/platform-fastify'
import {FastifyAdapter} from '@nestjs/platform-fastify'
import {Logger, LoggerErrorInterceptor} from 'nestjs-pino'
import {fastifyAdapterOptions} from '../../libs/common/fastify-adapter-options.js'
import {registerErrorHandlers} from '../../libs/common/global-error-handlers.js'
import {config} from '../../config/config.js'
import {isDocker} from '../../config/environment.js'
import {MetricsServerModule} from '../../libs/secondary/metrics/metrics.server.module.js'
import {MetricsService} from '../../libs/secondary/metrics/metrics.service.js'
import {JobWorkerAppModule} from './job-worker.module.js'

export async function bootstrapJobWorker() {
  const options: NestApplicationOptions = {
    bufferLogs: true,
  }
  const app = await NestFactory.create<NestFastifyApplication>(
    JobWorkerAppModule,
    new FastifyAdapter(fastifyAdapterOptions),
    options,
  )

  app.useGlobalInterceptors(new LoggerErrorInterceptor())

  const initializedLogger = app.get(Logger)
  app.useLogger(initializedLogger)

  const metricsService = app.get(MetricsService)

  app.enableShutdownHooks()

  const metricsServer = await NestFactory.create(
    MetricsServerModule,
    new FastifyAdapter(),
    {
      logger: initializedLogger,
    },
  )
  registerErrorHandlers(metricsService, initializedLogger)

  const host = isDocker() ? '0.0.0.0' : 'localhost'

  await Promise.all([
    app.listen({port: config.app.job_worker.port, host}),
    metricsServer.listen(config.metrics.port, host),
  ])

  const appUrl = await app.getUrl()

  initializedLogger.log(`App ${config.app.name} listening on ${appUrl}`)
  initializedLogger.log(`Metrics url: ${await metricsServer.getUrl()}/metrics`)
}
