import {s} from '../schema/schema.js'

export const key = s.object({
  key: s.string(),
  ttl: s.duration(),
})

export const keyWithMaxElements = key.extend({
  max_elements: s.int(),
})

export const schema = () =>
  s.object({
    host: s.host(),
    port: s.int(),
    prefix: s.string().min(1),
  })
