import type {ArgumentsHost, HttpServer} from '@nestjs/common'
import {Catch, HttpStatus} from '@nestjs/common'
import {AbstractHttpAdapter, BaseExceptionFilter} from '@nestjs/core'
import {Logger} from 'nestjs-pino'
import {ZodError} from 'zod'
import {isProd} from '../../../config/environment.js'
import {HttpExceptionMeta} from '../../http-server/index.js'

@Catch()
export class GlobalExceptionsFilter<
  T = unknown,
> extends BaseExceptionFilter<T> {
  logger: Logger

  constructor(applicationRef: HttpServer, logger: Logger) {
    super(applicationRef)

    this.logger = logger
  }

  catch(exception: T, host: ArgumentsHost): void {
    if (!isProd()) {
      const req = host.getArgByIndex(0)

      this.logger.error({
        err: exception,
        body: req?.body,
        params: req?.params,
        query: req?.query,
      })
    }

    super.catch(exception, host)
  }

  handleUnknownError(
    exception: T,
    host: ArgumentsHost,
    applicationRef: AbstractHttpAdapter | HttpServer,
  ): void {
    const responseBody = this.getResponseBody(exception)

    applicationRef.reply(
      host.getArgByIndex(1),
      responseBody,
      responseBody.statusCode,
    )

    const req = host.getArgByIndex(0)

    this.logger.error({
      err: exception,
      body: req?.body,
      params: req?.params,
      query: req?.query,
    })
  }

  // todo: move to http-server lib
  private getResponseBody(exception: T): {
    error: string
    description: string
    statusCode: number
    meta: HttpExceptionMeta[]
  } {
    if (exception instanceof ZodError) {
      return {
        error: exception.message,
        description: exception.message,
        statusCode: HttpStatus.BAD_REQUEST,
        // @ts-expect-error by default don't support in types
        errors: exception.issues,
      }
    }

    if (this.isHttpError(exception)) {
      return {
        error: exception.message,
        description: exception.message,
        statusCode: exception.statusCode,
        meta: [],
      }
    }

    return {
      error: 'Internal server error',
      description: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      meta: [],
    }
  }
}
