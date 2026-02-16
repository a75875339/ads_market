import type {Context} from 'grammy'
import type {UserFlavor} from './user.middleware.js'

export type BotContext = Context & UserFlavor
