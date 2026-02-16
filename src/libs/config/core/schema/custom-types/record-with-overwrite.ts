import type {ZodTypeAny} from 'zod'
import {ZodRecord, ZodString, z} from 'zod'

export function recordWithOverwrite<Value extends ZodTypeAny>(
  valueType: Value,
): ZodRecord<ZodString, Value> {
  return z
    .record(z.string(), valueType)
    .associateMetadata({type: 'recordWithOverwrite'})
}
