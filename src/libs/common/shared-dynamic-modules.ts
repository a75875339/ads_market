import {RequestMethod} from '@nestjs/common'
import {LoggerModule} from 'nestjs-pino'
import {getLoggerOptions} from './logger.js'

export const SharedLoggerModule = LoggerModule.forRoot({
  pinoHttp: getLoggerOptions(),
  exclude: [{method: RequestMethod.ALL, path: '/healthcheck'}],
})
