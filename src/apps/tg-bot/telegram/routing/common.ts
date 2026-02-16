import type {RoutingPrefix} from './routes.js'

export function encodeCallbackData(
  prefix: RoutingPrefix,
  args: string[] = [],
  skipValidate = false,
) {
  const parts = [prefix, ...args]

  if (!skipValidate) {
    for (const part of parts) {
      if (!/^[A-Za-z0-9-]*$/.test(part)) {
        throw new Error(
          `callback data part contains illegal character: ${part} (prefix=${prefix})`,
        )
      }
    }
  }

  const encoded = parts.join('_')
  if (!skipValidate && encoded.length > 64) {
    throw new Error(`callback data too long: "${encoded}"`)
  }

  return encoded
}

export function decodeCallbackData(data: string): {
  prefix: RoutingPrefix
  args: string[]
} {
  const [prefix, ...args] = data.split('_')
  return {prefix: prefix as RoutingPrefix, args}
}
