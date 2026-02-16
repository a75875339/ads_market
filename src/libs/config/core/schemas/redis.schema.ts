import {ZodType} from 'zod'

import {s} from '../schema/schema.js'

export const key = s.object({
  key: s.string(),
  ttl: s.duration(),
})

export const keyWithMaxElements = key.extend({
  max_elements: s.int(),
})

export const schema = <T extends ZodType>(keys: T) => {
  return s
    .object({
      host: s.host(),
      port: s.int(),
      username: s.string(),
      password: s.string(),
      db: s.int(),
      tls: s.options(['off', 'on']),
    })
    .extend(
      s.object({
        keys,
      }),
    )
}
