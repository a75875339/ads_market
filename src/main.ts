import './patch.js'
import {AppEnum} from './config/app.enum.js'
import {config} from './config/config.js'

async function bootstrap() {
  switch (config.app.name) {
    case AppEnum.Api: {
      const {bootstrapApi} = await import('./apps/api/bootstrap.js')
      await bootstrapApi()

      break
    }

    case AppEnum.Worker: {
      const {bootstrapWorker} = await import('./apps/worker/bootstrap.js')
      await bootstrapWorker()

      break
    }

    case AppEnum.TgBot: {
      const {bootstrapTgBot} = await import('./apps/tg-bot/bootstrap.js')
      await bootstrapTgBot()

      break
    }

    case AppEnum.JobWorker: {
      const {bootstrapJobWorker} = await import(
        './apps/job-worker/bootstrap.js'
      )
      await bootstrapJobWorker()

      break
    }

    default:
      throw new Error(`Unknown app name: ${config.app.name}`)
  }
}

bootstrap()
