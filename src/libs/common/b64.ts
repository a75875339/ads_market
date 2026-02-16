import {config} from '../../config/config.js'

export const encodeBase64safe = (base64: string) => {
  return base64
    .replace(/\+/g, '-') // Convert '+' to '-'
    .replace(/\//g, '_') // Convert '/' to '_'
    .replace(/=+$/, '') // Remove ending '='
}

export const decodeBase64Safe = (safe: string) => {
  let base64 = safe
    .replace(/-/g, '+') // Convert '-' to '+'
    .replace(/_/g, '/') // Convert '_' to '/'

  // Pad with '=' to make length a multiple of 4
  while (base64.length % 4 !== 0) {
    base64 += '='
  }

  return base64
}

export function generateTgLink({path}: {path?: string}) {
  const encoded = encodeBase64safe(
    btoa(
      JSON.stringify({
        path,
      }),
    ),
  )
  const startParam = `${encoded}`
  return `https://t.me/${config.bot.username}/${config.bot.tma}?startapp=${startParam}`
}
