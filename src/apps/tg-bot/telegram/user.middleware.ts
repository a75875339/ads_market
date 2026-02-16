import type {Context, Middleware} from 'grammy'
import type {PinoLogger} from 'nestjs-pino'
import type {UserService} from '../../../modules/users/users.service.js'
import type {CachedUser} from '../../../modules/users/users.types.js'
import {tryCatch} from '../../../simple-result.js'

export interface UserFlavor {
  user: CachedUser
  correlationId: string
}

export function userMiddleware<C extends Context>(
  userService: UserService,
  logger: PinoLogger,
): Middleware<C & UserFlavor> {
  return async (ctx, next) => {
    if (ctx.from == null) {
      return // Stop processing
    }

    const {data: user, error} = await tryCatch(
      userService.getOrCreateByTelegramId(BigInt(ctx.from.id), ctx.from),
    )

    if (error) {
      logger.error({err: error}, 'Failed to resolve user')
      return // Stop processing
    }

    logger.assign({userId: user.id})
    ctx.user = user

    return next()
  }
}
