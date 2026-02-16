import {HASH_METHOD} from './constants.js'

export type HashValue = string | number

export type Hashable =
  | {
      [HASH_METHOD](): HashValue
      toString(): string
    }
  | number
  | string
