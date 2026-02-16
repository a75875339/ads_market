import {type Api, GrammyError, type RawApi} from 'grammy'
import type {Message} from 'grammy/types'

// to be used in bot.callbackQuery, e.g.
// bot.callbackQuery(callbackDataWithArgs(RoutingPrefix.Foo), async (ctx) => {...})
export function callbackDataWithArgs(data: string, allowEmpty = false) {
  return new RegExp(`^${data}(_.*)${allowEmpty ? '*' : '+'}`)
}

export async function safeEditMessageText<R extends RawApi>(
  api: Api<R>,
  message: Message.CommonMessage,
  text: string,
  other?: Parameters<Api<R>['editMessageText']>[3],
) {
  return api
    .editMessageText(message.chat.id, message.message_id, text, other)
    .catch((error) => {
      if (
        error instanceof GrammyError &&
        error.message.includes('message is not modified')
      ) {
        return message
      }
      throw error
    })
}
