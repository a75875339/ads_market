import {encodeCallbackData} from './common.js'

/*
ALWAYS make sure values of RoutingPrefix are unique,
and try to make them as short as possible while maintaining
uniqueness and some kind of readability
*/
export enum RoutingPrefix {
  // (keyboard only) routes same as /start command
  MainMenu = 'start',
  // (keyboard only) deletes message with this button
  Delete = 'delete',
  // (keyboard only) no-op, just answers callback query
  Nop = 'nop',

  Event = 'evt',
  Market = 'mkt',

  BuyMarket = 'bmk',
  BuyMarketCustomAmount = 'bmkca',
  SubmitBuyMarket = 'sbm',

  BuyLimitSetPrice = 'blp',
  BuyLimit = 'blm',
  BuyLimitCustomAmount = 'blmca',
  SubmitBuyLimit = 'sbl',

  Wallet = 'wlt',
  Positions = 'pos',
  LimitOrders = 'lmo',
  Referrals = 'ref',
  Settings = 'set',
  SettingsEditPreset = 'sep',
  Withdraw = 'wdr',
  WithdrawPercentPreset = 'wdrpp',
  WithdrawAmount = 'wdra',
  WithdrawCustomPercent = 'wdrcp',
  WithdrawCustomAmount = 'wdrca',
  WithdrawConfirm = 'wdrc',
  WithdrawSubmit = 'wdrs',
  ExportSeedPhrase = 'esp',
}

export function eventCallbackData(eventId: string) {
  return encodeCallbackData(RoutingPrefix.Event, [eventId])
}

export function marketCallbackData(marketId: string) {
  return encodeCallbackData(RoutingPrefix.Market, [marketId])
}

export function validateRoutingPrefixes() {
  const valueToKey = new Map<string, string>()

  for (const [key, value] of Object.entries(RoutingPrefix)) {
    const existing = valueToKey.get(value)
    if (existing) {
      throw new Error(
        `Duplicate RoutingPrefix value "${value}" found in keys: ${existing}, ${key}`,
      )
    }
    valueToKey.set(value, key)
  }
}
