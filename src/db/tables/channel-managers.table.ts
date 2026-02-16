import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import {ManagerPermission} from '../constants.js'
import {createEnumCheckConstraint, timestamps} from '../utils.js'
import {channels} from './channels.table.js'
import {users} from './users.table.js'

export const channelManagers = pgTable(
  'channel_managers',
  {
    id: bigint({mode: 'bigint'}).primaryKey().generatedAlwaysAsIdentity(),
    channelId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => channels.id),
    userId: bigint({mode: 'bigint'})
      .notNull()
      .references(() => users.id),
    permissions: text()
      .$type<ManagerPermission>()
      .notNull()
      .default(ManagerPermission.NONE),
    ...timestamps,
    deletedAt: timestamp(),
  },
  (table) => [
    unique('channel_manager_unique').on(table.channelId, table.userId),
    index('channel_managers_channel_idx').on(table.channelId),
    index('channel_managers_user_idx').on(table.userId),
    createEnumCheckConstraint(
      'channel_managers_permissions_check',
      table.permissions,
      ManagerPermission,
    ),
  ],
)
