/** An error whose status/code are safe to expose to the client. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message = code,
    readonly headers?: Record<string, string>,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const badRequest = (code = 'bad_request') => new HttpError(400, code)
export const unauthorized = (code = 'unauthorized') => new HttpError(401, code)
export const forbidden = (code = 'forbidden') => new HttpError(403, code)
export const notFound = (code = 'not_found') => new HttpError(404, code)
