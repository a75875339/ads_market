import {DateTime} from 'luxon'
import {generateTgLink} from '../../../../libs/common/b64.js'
import type {AmountUSD} from '../../../../libs/common/types/domain.types.js'
import {TopicRole} from '../../../../db/constants.js'

type DealStartMessageData = {
  dealId: bigint
  channelTitle: string
  campaignTitle: string
  draftDealMessage: string | null
  role: TopicRole
  adPriceUSD: AmountUSD | null
  adScheduleAt: Date | null
}

const roleLabel = {
  [TopicRole.ADVERTISER]: 'Advertiser',
  [TopicRole.CHANNEL_MANAGER]: 'Channel Manager',
} as const

export function formatDealTopicStartMessage(
  data: DealStartMessageData,
): string {
  const dealPath =
    data.role === TopicRole.ADVERTISER
      ? `/advertiser/deals/${data.dealId}`
      : `/channel/deals/${data.dealId}`
  const tmaUrl = generateTgLink({path: dealPath})
  const scheduleText = data.adScheduleAt
    ? DateTime.fromJSDate(data.adScheduleAt)
        .setZone('UTC')
        .toFormat('yyyy-MM-dd HH:mm')
    : 'Not scheduled yet'

  const applyMessage = data.draftDealMessage
    ? escapeHtml(data.draftDealMessage)
    : 'Not specified'
  return `
<b>Deal #${data.dealId}</b>

<b>Campaign:</b> ${escapeHtml(data.campaignTitle)}
<b>Channel:</b> ${escapeHtml(data.channelTitle)}
<b>Your role:</b> ${roleLabel[data.role]}
${data.adPriceUSD ? `<b>Price:</b> $${data.adPriceUSD}` : ''}
<b>Schedule:</b> ${scheduleText}

<b>Apply message:</b> ${applyMessage}

<a href="${tmaUrl}">Open in Mini App</a>

<i>Here in chat you can discuss the deal with the advertiser and channel manager (all messages, except commands and creative generating, will be forwarded to the deal topic).</i>

<i> For create creative for this deal, please use the command /creative (and /cancel_creative to cancel)</i>
`.trim()
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
