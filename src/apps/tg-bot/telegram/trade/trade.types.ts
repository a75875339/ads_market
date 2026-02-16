export type TradeConversationState = {
  marketId: string
  outcomeIndex: number
  outcomeName: string
  outcomePrice: number
}

export type LimitTradeConversationState = TradeConversationState & {
  limitPrice: number
}
