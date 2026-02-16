export const defaultConfig = {
  host: 'localhost',
  port: 6379,
  username: 'default',
  password: '',
  db: 0,
  tls: false,
}

export const getRedisUrl = (
  config: {
    host: string
    port: number
    username: string
    password: string
    db: number
    tls: boolean
  } = defaultConfig,
): string => {
  const {host, port, username, password, db, tls} = config
  const redisPrefix = tls ? 'rediss' : 'redis'

  return `${redisPrefix}://${username}:${encodeURIComponent(password)}@${host}:${port}/${db}`
}
