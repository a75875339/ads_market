import {Injectable} from '@nestjs/common'
import type {Bot} from 'grammy'
import type {
  Chat,
  ChatMember,
  ChatMemberAdministrator,
  ChatMemberOwner,
  User,
} from 'grammy/types'
import {PinoLogger} from 'nestjs-pino'
import {generateTgLink} from '../../../libs/common/b64.js'
import {
  ChannelStatus,
  ChannelType,
  ManagerPermission,
} from '../../../db/constants.js'
import {ChannelRepository} from '../../../db/repositories/channel.repository.js'
import {ChannelManagerRepository} from '../../../db/repositories/channel-manager.repository.js'
import {UserService} from '../../../modules/users/users.service.js'
import {tryCatch} from '../../../simple-result.js'
import {
  channelBotPermissionsRequiredMessageText,
  channelBotSuspendedMessageText,
} from './formatters/common-messages.js'
import type {BotContext} from './telegram.context.js'

@Injectable()
export class ChannelAdminHandlersService {
  private bot: Bot<BotContext> | null = null

  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly channelRepository: ChannelRepository,
    private readonly channelManagerRepository: ChannelManagerRepository,
  ) {
    this.logger.setContext(ChannelAdminHandlersService.name)
  }

  setBotAndRegisterHandlers(bot: Bot<BotContext>): void {
    this.bot = bot

    this.bot.on('my_chat_member', async (ctx) => {
      await this.handleMyChatMember(ctx)
    })

    this.bot.on('chat_member', async (ctx) => {
      await this.handleChatMember(ctx)
    })
  }

  private async handleMyChatMember(ctx: BotContext): Promise<void> {
    const update = ctx.myChatMember
    if (!update) return

    const chat = update.chat
    const newMember = update.new_chat_member
    const oldMember = update.old_chat_member

    const isChannelOrSupergroup =
      chat.type === 'channel' || chat.type === 'supergroup'
    if (!isChannelOrSupergroup) return

    const isBot = 'user' in newMember && newMember.user.is_bot
    if (!isBot) return

    const wasAdmin =
      oldMember.status === 'administrator' || oldMember.status === 'creator'
    const isNowAdmin =
      newMember.status === 'administrator' || newMember.status === 'creator'

    if (isNowAdmin) {
      if (!this.botHasRequiredChannelPermissions(newMember)) {
        try {
          await ctx.api.sendMessage(
            update.from!.id,
            channelBotPermissionsRequiredMessageText.replace(
              '{{channelTitle}}',
              chat.username ? `@${chat.username}` : chat.title,
            ),
          )
        } catch (err) {
          this.logger.warn(
            {err, chatId: chat.id},
            'Failed to send permissions message',
          )
        }
        return
      }
      await this.syncChannelAndManagers(ctx, chat, update.from!)
      return
    }

    if (wasAdmin && !isNowAdmin) {
      await this.suspendChannelAndNotifyAdmins(BigInt(chat.id))
    }
  }

  private async handleChatMember(ctx: BotContext): Promise<void> {
    const update = ctx.chatMember
    if (!update) return

    const chat = update.chat
    const isChannelOrSupergroup =
      chat.type === 'channel' || chat.type === 'supergroup'
    if (!isChannelOrSupergroup) return

    const chatId = BigInt(chat.id)
    const channel = await this.channelRepository.findByTelegramChatId(chatId)
    if (!channel) return

    await this.syncChannelAndManagers(ctx, chat, update.from!)
  }

  private botHasRequiredChannelPermissions(member: ChatMember): boolean {
    if (member.status === 'creator') return true
    if (member.status !== 'administrator') return false
    const admin = member as ChatMemberAdministrator
    return (
      Boolean(admin.can_post_messages) &&
      Boolean(admin.can_edit_messages) &&
      Boolean(admin.can_delete_messages)
    )
  }

  private toChannelType(
    chat: Chat,
  ): (typeof ChannelType)[keyof typeof ChannelType] {
    if (chat.type === 'channel') {
      return chat.username ? ChannelType.CHANNEL : ChannelType.PRIVATE_CHANNEL
    }
    return chat.username ? ChannelType.GROUP : ChannelType.PRIVATE_GROUP
  }

  private async syncChannelAndManagers(
    ctx: BotContext,
    chat: Chat,
    fromUser: User,
  ): Promise<void> {
    const {data: admins, error: adminsError} = await tryCatch(
      ctx.api.getChatAdministrators(chat.id),
    )
    const chatId = BigInt(chat.id)

    if (adminsError || !admins?.length) {
      this.logger.warn(
        {err: adminsError, chatId: chat.id},
        'Failed to get chat administrators',
      )
      return
    }

    const creator = admins.find(
      (a): a is ChatMemberOwner => a.status === 'creator',
    )
    if (!creator) return

    const ownerUser = await this.userService.getOrCreateByTelegramId(
      BigInt(creator.user.id),
      creator.user,
    )

    let channel = await this.channelRepository.findByTelegramChatId(chatId)
    const channelType = this.toChannelType(chat)
    const title = chat.title ?? ''
    const username = chat.username ?? null

    let sendAddedMessage = false
    if (!channel) {
      // todo: add check of minimum subscribers
      channel = await this.channelRepository.create({
        telegramChatId: chatId,
        ownerId: BigInt(ownerUser.id),
        title,
        username,
        channelType,
        status: ChannelStatus.ACTIVE,
        botIsAdmin: true,
        botAdminVerifiedAt: new Date(),
      })
      sendAddedMessage = true
    } else {
      const previousOwnerId = channel.ownerId
      if (previousOwnerId.toString() !== ownerUser.id) {
        await this.channelManagerRepository.updatePermissions(
          channel.id,
          previousOwnerId,
          ManagerPermission.NONE,
        )
        await this.channelRepository.updateOwner(
          channel.id,
          BigInt(ownerUser.id),
        )
      }
      if (!channel.botIsAdmin || channel.status === ChannelStatus.SUSPENDED) {
        await this.channelRepository.updateBotAdmin(
          channel.id,
          true,
          new Date(),
          ChannelStatus.ACTIVE,
        )
        sendAddedMessage = true
      }
    }

    if (!channel) return
    const channelId = channel.id
    for (const admin of admins) {
      if (admin.user.is_bot) continue
      const user = await this.userService.getOrCreateByTelegramId(
        BigInt(admin.user.id),
        admin.user,
      )
      const permission =
        admin.status === 'creator'
          ? ManagerPermission.FULL
          : ManagerPermission.NONE
      await this.channelManagerRepository.upsert(
        channelId,
        BigInt(user.id),
        permission,
      )
    }

    if (sendAddedMessage) {
      await tryCatch(
        this.bot!.api.sendMessage(
          fromUser.id,
          'Channel added successfully. please continue setting up in channel admin panel: ' +
            generateTgLink({path: `/admin/channels/${channelId}`}),
        ),
      )
    }
  }

  private async suspendChannelAndNotifyAdmins(
    telegramChatId: bigint,
  ): Promise<void> {
    const channel =
      await this.channelRepository.findByTelegramChatId(telegramChatId)
    if (!channel) return
    await this.channelRepository.updateBotAdmin(
      channel.id,
      false,
      null,
      ChannelStatus.SUSPENDED,
      false,
    )

    const managers =
      await this.channelManagerRepository.listActiveWithUserByChannelId(
        channel.id,
      )
    for (const row of managers) {
      const telegramId = row.user.telegramId
      if (telegramId == null) continue
      await tryCatch(
        this.bot!.api.sendMessage(
          telegramId.toString(),
          channelBotSuspendedMessageText.replace(
            '{{channelTitle}}',
            channel.username ? `@${channel.username}` : channel.title,
          ),
        ),
      )
    }
  }
}
