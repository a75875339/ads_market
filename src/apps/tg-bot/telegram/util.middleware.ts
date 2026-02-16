import {randomUUID} from 'node:crypto'
import type {Context, Middleware, Transformer} from 'grammy'
import {GrammyError} from 'grammy'
import type {PinoLogger} from 'nestjs-pino'
import {alsService} from '../../../libs/common/als.service.js'

export function loggingMiddleware<C extends Context>(
  logger: PinoLogger,
): Middleware<C & {correlationId: string}> {
  return async (ctx, next) => {
    const correlationId = randomUUID()

    // Attach it to context for later use
    ctx.correlationId = correlationId

    // Assign to logger context
    logger.assign({
      correlationId,
      telegramId: ctx.from?.id ?? null,
    })
    logger.debug({update: ctx.update}, `Received update.`)

    // Establish ALS context for entire request chain
    return alsService.run({correlationId}, async () => {
      await next()
    })
  }
}

export function disableLinkPreviewTransformer(): Transformer {
  return (prev, method, payload, signal) => {
    if (!payload || 'link_preview_options' in payload) {
      return prev(method, payload, signal)
    }
    if (method === 'sendMessage' || method === 'editMessageText') {
      // @ts-expect-error upper intermediate typescript
      payload.link_preview_options = {
        is_disabled: true,
      }
    }
    return prev(method, payload, signal)
  }
}

// copy-paste from https://github.com/grammyjs/parse-mode/blob/1.11.1/src/transformer.ts
export const htmlParseModeTransformer = () => {
  const parseMode = 'HTML'

  const transformer: Transformer = (prev, method, payload, signal) => {
    if (!payload || 'parse_mode' in payload) {
      return prev(method, payload, signal)
    }

    switch (method) {
      case 'editMessageMedia':
        if ('media' in payload && !('parse_mode' in payload.media)) {
          ;(payload.media as any).parse_mode = parseMode
        }
        break

      case 'answerInlineQuery':
        if ('results' in payload) {
          for (const result of payload.results) {
            if (
              'input_message_content' in result &&
              !('parse_mode' in (result.input_message_content as any))
            ) {
              ;(result.input_message_content as any).parse_mode = parseMode
            } else if (!('parse_mode' in result)) {
              ;(result as any).parse_mode = parseMode
            }
          }
        }
        break

      default:
        payload = {...payload, ...{parse_mode: parseMode}}
    }

    return prev(method, payload, signal)
  }
  return transformer
}

export function loggingTransformer(logger?: PinoLogger): Transformer {
  return async (prev, method, payload, signal) => {
    const rsp = await prev(method, payload, signal)
    logger?.debug({
      msg: 'Telegram bot API request',
      method,
      payload,
      rsp,
    })
    return rsp
  }
}

function isClientError(error: unknown): boolean {
  if (error instanceof GrammyError) {
    const errorCode = error.error_code
    return errorCode >= 400 && errorCode < 500
  }
  return false
}

export function errorHandlingMiddleware<C extends Context>(
  logger: PinoLogger,
): Middleware<C> {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      if (isClientError(error)) {
        logger.warn(
          {error, updateId: ctx.update.update_id},
          'Telegram client error (will not retry)',
        )
      } else {
        logger.error(
          {err: error, updateId: ctx.update.update_id},
          'Telegram error',
        )
        throw error
      }
    }
  }
}
