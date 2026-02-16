import {Injectable, type OnModuleInit} from '@nestjs/common'
import type {FastifyReply, FastifyRequest} from 'fastify'
import {Bot, type CommandContext, webhookCallback} from 'grammy'
import {PinoLogger} from 'nestjs-pino'
import {config} from '../../../config/config.js'
import {isDev, isTest} from '../../../config/environment.js'
import {UserService} from '../../../modules/users/users.service.js'
import {ChannelAdminHandlersService} from './channel-admin-handlers.service.js'
import {ChannelPostHandlersService} from './channel-post-handlers.service.js'
import {DealTopicHandlersService} from './deal-topic-handlers.service.js'
import {startCommandMessageText} from './formatters/common-messages.js'
import {RoutingPrefix} from './routing/routes.js'
import type {BotContext} from './telegram.context.js'
import {userMiddleware} from './user.middleware.js'
import {
  disableLinkPreviewTransformer,
  errorHandlingMiddleware,
  htmlParseModeTransformer,
  loggingMiddleware,
  loggingTransformer,
} from './util.middleware.js'

type WebhookHandler = (
  req: FastifyRequest,
  res: FastifyReply,
) => Promise<void> | void

@Injectable()
export class TelegramService implements OnModuleInit {
  public readonly bot: Bot<BotContext>

  private readonly handleUpdateFn: WebhookHandler

  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly channelAdminHandlers: ChannelAdminHandlersService,
    private readonly channelPostHandlers: ChannelPostHandlersService,
    private readonly dealTopicHandlers: DealTopicHandlersService,
  ) {
    this.logger.setContext(TelegramService.name)
    this.bot = new Bot<BotContext>(config.bot.token)

    this.registerHandlers()
    this.channelAdminHandlers.setBotAndRegisterHandlers(this.bot)
    this.channelPostHandlers.setBotAndRegisterHandlers(this.bot)

    this.handleUpdateFn = webhookCallback(this.bot, 'fastify', {
      secretToken: config.bot.webhook_secret || undefined,
    }) as WebhookHandler
  }

  private registerHandlers() {
    this.bot.use(
      loggingMiddleware(this.logger),
      errorHandlingMiddleware(this.logger),
      userMiddleware(this.userService, this.logger),
    )
    this.bot.api.config.use(
      loggingTransformer(this.logger),
      htmlParseModeTransformer(),
      disableLinkPreviewTransformer(),
    )

    this.bot.command('start', async (ctx) => {
      await this.handleStartCommand(ctx)
    })

    this.dealTopicHandlers.setBotAndRegisterHandlers(this.bot)

    if (isDev() || isTest()) {
    }

    this.bot.on('message:text', async (ctx) => {
      await this.handleTextInput(ctx)
    })

    this.bot.callbackQuery(RoutingPrefix.MainMenu, async (ctx) => {
      await ctx.answerCallbackQuery()
      await this.handleWelcome(ctx)
    })

    this.bot.callbackQuery(RoutingPrefix.Delete, async (ctx) => {
      await ctx.deleteMessage()
    })
  }

  async onModuleInit() {
    await this.setupWebhook()
  }

  private async setupWebhook() {
    this.logger.info({url: config.bot.webhook_url}, 'Setting up webhook')

    await this.bot.api.setWebhook(config.bot.webhook_url, {
      secret_token: config.bot.webhook_secret || undefined,
      allowed_updates: [
        'message',
        'callback_query',
        'my_chat_member',
        'chat_member',
        'channel_post',
        'edited_channel_post',
      ],
    })

    await this.bot.api.setMyCommands([
      {command: 'start', description: 'main menu'},
      {command: 'creative', description: 'submit creative for a deal'},
      {
        command: 'cancel_creative',
        description: 'cancel pending creative submission',
      },
    ])

    const me = await this.bot.api.getMe()
    this.logger.info(
      {username: me.username, webhook_url: config.bot.webhook_url},
      'Bot webhook configured',
    )
  }

  async handleUpdate(req: FastifyRequest, res: FastifyReply): Promise<void> {
    await this.handleUpdateFn(req, res)
  }

  async getHealth(): Promise<{ok: boolean; username?: string}> {
    try {
      const me = await this.bot.api.getMe()
      return {ok: true, username: me.username}
    } catch {
      return {ok: false}
    }
  }

  private async handleStartCommand(
    ctx: CommandContext<BotContext>,
  ): Promise<void> {
    await this.handleWelcome(ctx)
  }

  private async handleWelcome(ctx: BotContext): Promise<void> {
    await ctx.reply(startCommandMessageText)
  }

  private async handleTextInput(ctx: BotContext): Promise<void> {
    await ctx.reply(startCommandMessageText)
  }
}
