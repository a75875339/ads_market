import pino from 'pino'
import type {Options as LoggerOptions} from 'pino-http'
import {isDev} from '../../config/environment.js'
import {PrettyError} from '../http/index.js'

export function getLoggerOptions(): LoggerOptions {
  const logLevel = process.env.LOG_LEVEL || 'debug'

  const options: LoggerOptions = {
    level: logLevel,
    formatters: {
      level: (label): Record<string, string> => {
        return {level: label}
      },
    },
    serializers: {
      error: serializeError,
      err: serializeError,
    },
    autoLogging: false,
    quietReqLogger: true,
    quietResLogger: true,
    stream: pino.destination({
      minLength: 4096, // Buffer before writing
      sync: false, // Asynchronous logging
    }),
  }

  if (isDev()) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'UTC:dd.mm.yyyy, h:MM:ss Z',
      },
    }
  }

  return options
}

const serializeError = (error: any) => {
  if (error.isPrettyError) {
    const prettyError = error as PrettyError
    return {
      name: prettyError.name,
      status: prettyError.status,
      code: prettyError.code,
      data: prettyError.data,
      host: prettyError.host,
      message: prettyError.message,
      stack: prettyError.stack,
    }
  } else if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  try {
    return JSON.stringify(error)
  } catch {
    return error.toString()
  }
}
