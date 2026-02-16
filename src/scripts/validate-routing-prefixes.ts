import {validateRoutingPrefixes} from '../apps/tg-bot/telegram/routing/routes.js'

try {
  validateRoutingPrefixes()
  console.error('OK')
} catch (err) {
  console.error(err)
  process.exit(1)
}
