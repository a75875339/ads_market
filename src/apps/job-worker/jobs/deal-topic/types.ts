import type {AmountUSD} from '../../../../libs/common/types/domain.types.js'
import type {TopicRole} from '../../../../db/constants.js'

export type DealTopicJobData = {
  dealId: string
  userId: string
  role: TopicRole
  channelTitle: string
  campaignTitle: string
  draftDealMessage: string | null
  adPriceUSD: AmountUSD | null
  adScheduleAt: string | null
}
