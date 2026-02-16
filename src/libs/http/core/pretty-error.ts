export class PrettyError extends Error {
  public readonly status?: number

  public readonly code?: string

  public readonly data?: any

  public readonly host?: string

  constructor(err: any) {
    super(err.message || 'unknown message')

    let prettyError = err

    if (err.isAxiosError) {
      prettyError = err.toJSON()

      prettyError.status = err?.response?.status
      prettyError.data = err?.response?.data

      const url = err.config.baseURL ? err.config.baseURL : err.config.url

      prettyError.host = new URL(url).host

      prettyError.stack += `${this.stack}\n`

      delete prettyError.config
    }

    Object.assign(this, prettyError)

    this.name = PrettyError.name
  }

  public isNotFound(): boolean {
    return this.status === 404
  }
}
