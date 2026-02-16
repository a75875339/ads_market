import {AdFormatType} from './constants.js'

export const formatPresets: Record<
  (typeof AdFormatType)[keyof typeof AdFormatType],
  {description: string; retentionHours: number; topHours: number}
> = {
  [AdFormatType.TEST]: {
    description: 'Test format (1 hour in top, 1 hour in channel)',
    retentionHours: 1,
    topHours: 1,
  },
  [AdFormatType.POST_1_24]: {
    description: '1 hour in top, 24 hours in channel',
    retentionHours: 24,
    topHours: 1,
  },
  [AdFormatType.POST_2_48]: {
    description: '2 hours in top, 48 hours in channel',
    retentionHours: 48,
    topHours: 2,
  },
  [AdFormatType.POST_3_72]: {
    description: '3 hours in top, 72 hours in channel',
    retentionHours: 72,
    topHours: 3,
  },
  [AdFormatType.REPOST]: {
    description: 'Repost in channel, 24 hours in channel, 1 hour in top',
    retentionHours: 24,
    topHours: 1,
  },
  [AdFormatType.NO_REMOVAL]: {
    description: 'No removal, 1 hour in top',
    retentionHours: 96, // it could not be -1 as channel admins have to receive money
    topHours: 0,
  },
}
