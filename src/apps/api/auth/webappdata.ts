import {createHmac, timingSafeEqual} from 'node:crypto'

export type TelegramUser = {
  id: number
  language_code?: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

export type TelegramUserSession = {
  user: TelegramUser
  authDate: Date
}

export function validateWebAppData(
  raw: string,
  token: string,
): TelegramUserSession {
  const query = new URLSearchParams(raw)

  const hash = query.get('hash')
  if (!hash) {
    throw new Error('missing hash')
  }

  query.sort()
  const dataCheckStringParts: string[] = []
  for (const [k, v] of query.entries()) {
    if (k === 'hash') {
      continue
    }
    dataCheckStringParts.push(`${k}=${v}`)
  }
  const dataCheckString = dataCheckStringParts.join('\n')

  const secretKey = hmac(token, Buffer.from('WebAppData', 'utf8'))
  const actualHash = hmac(dataCheckString, secretKey)

  if (!timingSafeEqual(Buffer.from(hash, 'hex'), actualHash)) {
    throw new Error('hash mismatch')
  }

  return {
    user: JSON.parse(query.get('user') || '{}'),
    // biome-ignore lint/correctness/useParseIntRadix: idk
    authDate: new Date(parseInt(query.get('auth_date') || '0') * 1000),
    queryId: query.get('query_id') || '',
  } as TelegramUserSession
}

export function encodeTgRawData(
  data: Record<string, any>,
  token: string,
): string {
  const query = new URLSearchParams()
  for (const key in data) {
    query.set(key, data[key])
  }
  query.sort()

  const dataCheckStringParts: string[] = []
  for (const [k, v] of query.entries()) {
    dataCheckStringParts.push(`${k}=${v}`)
  }
  const dataCheckString = dataCheckStringParts.join('\n')

  const secretKey = hmac(token, Buffer.from('WebAppData', 'utf8'))
  const hash = hmac(dataCheckString, secretKey).toString('hex')

  query.set('hash', hash)
  return query.toString()
}

function hmac(data: string, secret: Buffer): Buffer {
  return createHmac('sha256', secret).update(Buffer.from(data, 'utf8')).digest()
}
