import cookie from '@fastify/cookie'
import helmet from '@fastify/helmet'
import type {NestApplicationOptions} from '@nestjs/common'
import {VersioningType} from '@nestjs/common'
import {HttpAdapterHost, NestFactory} from '@nestjs/core'
import type {NestFastifyApplication} from '@nestjs/platform-fastify'
import {FastifyAdapter} from '@nestjs/platform-fastify'
import fastifyRawBody from 'fastify-raw-body'
import {Logger, LoggerErrorInterceptor} from 'nestjs-pino'
import {GlobalExceptionsFilter} from '../../libs/common/exeption-filters/global-exeptions-filter.js'
import {fastifyAdapterOptions} from '../../libs/common/fastify-adapter-options.js'
import {registerErrorHandlers} from '../../libs/common/global-error-handlers.js'
import {config} from '../../config/config.js'
import {isDocker} from '../../config/environment.js'
import {FastifyHttpMetricsInterceptor} from '../../libs/metrics/nest.js'
import {MetricsServerModule} from '../../libs/secondary/metrics/metrics.server.module.js'
import {MetricsService} from '../../libs/secondary/metrics/metrics.service.js'
import {ApiAppModule} from './api.module.js'

export async function bootstrapApi() {
  const options: NestApplicationOptions = {
    cors: {
      origin: true,
      credentials: true,
    },
    bufferLogs: true,
  }
  const app = await NestFactory.create<NestFastifyApplication>(
    ApiAppModule,
    new FastifyAdapter(fastifyAdapterOptions),
    options,
  )

  // register raw body plugin for webhook signature verification
  await app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  })

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  })

  app.useGlobalInterceptors(new LoggerErrorInterceptor())

  const initializedLogger = app.get(Logger)
  app.useLogger(initializedLogger)

  const {httpAdapter} = app.get(HttpAdapterHost)
  app.useGlobalFilters(
    new GlobalExceptionsFilter(httpAdapter, initializedLogger),
  )

  const metricsService = app.get(MetricsService)
  app.useGlobalInterceptors(new FastifyHttpMetricsInterceptor(metricsService))

  await app.register(helmet)
  await app.register(cookie)
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
    app.listen({port: config.app.api.port, host}),
    metricsServer.listen(config.metrics.port, host),
  ])

  const appUrl = await app.getUrl()

  initializedLogger.log(`App ${config.app.name} listening on ${appUrl}`)
  initializedLogger.log(`Metrics url: ${await metricsServer.getUrl()}/metrics`)
}
