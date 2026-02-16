export function getTestDbUrl(): string {
  const url = process.env.TEST_DB_URL
  if (!url) {
    throw new Error(
      'TEST_DB_URL is not set. Make sure setupFilesAfterEnv.ts ran correctly.',
    )
  }
  return url
}

export function getTestAppPort(): number {
  const min = 49152
  const max = 65535
  return Math.floor(Math.random() * (max - min + 1)) + min
}
