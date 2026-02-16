import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type {Request, Response} from 'express'
import {Observable} from 'rxjs'
import {tap} from 'rxjs/operators'
import {Timer} from '../../../../../domain/index.js'
import type {HttpCallResult, HttpMetrics} from './types.js'

export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: HttpMetrics) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> | Promise<Observable<unknown>> {
    const timer = new Timer()

    return next.handle().pipe(
      tap({
        error: (err?: Error) => this.observe(context, timer, {err}),
        next: (response) => this.observe(context, timer, {response}),
      }),
    )
  }

  private observe(
    ctx: ExecutionContext,
    timer: Timer,
    info: {response?: unknown; err?: Error},
  ): void {
    const meta = this.getCallMetadata(ctx, info.err)

    this.metrics.registerInboundRequestLatency({
      ...meta,
      ...info,
      duration: timer.elapsed(),
    })
  }

  private getCallMetadata(
    ctx: ExecutionContext,
    err?: any,
  ): Omit<HttpCallResult, 'duration' | 'err'> {
    const httpCtx = ctx.switchToHttp()
    const response = httpCtx.getResponse<Response>()
    const request = httpCtx.getRequest<Request>()

    const status = err
      ? err?.status || err?.response?.statusCode || 500
      : response.statusCode

    const path = request.route.path
    const method = request.method

    return {
      status,
      method,
      path,
      request,
    }
  }
}
