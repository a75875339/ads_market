export const startCommandMessageText =
  'Hello, world! this is a test bot. open TMA'
export const refreshedCallbackQueryAnswer = 'Refreshed'

export const channelBotPermissionsRequiredMessageText = `
The bot must have admin rights with:
• Post messages
• Edit messages
• Delete messages

Please grant these permissions to channel {{channelTitle}}.
`.trim()

export const creativeCommandPromptText = `
Send your creative message now (only text).
The next message you send will be saved as the creative and forwarded to all deal participants. for cancel adding creative send /cancel_creative
`.trim()

export const creativeOnlyInTopicText =
  'This command can only be used in a deal topic.'

export const creativeNoDealFoundText = 'No deal found for this topic.'

export const creativeSavedText =
  'Creative saved and forwarded to all deal participants. confirm creative in deal in TMA.'

export const creativeCancelledText = 'Creative submission cancelled.'

export const creativeNoPendingText = 'No pending creative to cancel.'

export const channelBotSuspendedMessageText = `
The bot was removed or its permissions were restricted in the channel {{channelTitle}}.
Channel status has been set to suspended. Please re-add the bot with required admin rights to restore service.
`.trim()

export const creativeMessageForPostingText =
  'this is creative message for posting in channel. please confirm in TMA'
