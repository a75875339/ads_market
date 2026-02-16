export type Key =
  | {path: string[]; type: 'record'}
  | {path: string[]; type: 'recordWithOverwrite'}
  | {path: string[]; type: 'basic'}

export type KeyType = Key['type']

export type Keys = Key[]
