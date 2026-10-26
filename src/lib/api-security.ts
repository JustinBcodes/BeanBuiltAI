import { NextResponse } from 'next/server'

class ApiRequestError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

/** Cookie-authenticated mutations must originate from this application. */
export function validateMutationRequest(request: Request): NextResponse | null {
  const origin = request.headers.get('origin')
  const fetchSite = request.headers.get('sec-fetch-site')
  let allowedOrigin: string
  try {
    if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) throw new Error('Missing origin')
    const configuredUrl = new URL(process.env.NEXTAUTH_URL || request.url)
    if (process.env.NODE_ENV === 'production' && configuredUrl.protocol !== 'https:') throw new Error('HTTPS required')
    allowedOrigin = configuredUrl.origin
  } catch {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
  }
  if (fetchSite === 'cross-site' || fetchSite === 'same-site' ||
      (origin ? origin !== allowedOrigin : fetchSite !== 'same-origin' || new URL(request.url).origin !== allowedOrigin)) {
    return NextResponse.json({ error: 'Request origin is not allowed' }, { status: 403 })
  }
  return null
}

/** Bound actual bytes read, including requests without a Content-Length header. */
export async function readJsonBody(request: Request, maxBytes = 256 * 1024): Promise<unknown> {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new ApiRequestError('Content-Type must be application/json', 415)
  }
  if (Number(request.headers.get('content-length')) > maxBytes) {
    throw new ApiRequestError('Request body is too large', 413)
  }
  const reader = request.body?.getReader()
  if (!reader) throw new ApiRequestError('A JSON request body is required', 400)
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        throw new ApiRequestError('Request body is too large', 413)
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) }
  catch { throw new ApiRequestError('Request body must be valid JSON', 400) }
}

export function requestErrorResponse(error: unknown): NextResponse | null {
  return error instanceof ApiRequestError
    ? NextResponse.json({ error: error.message }, { status: error.status })
    : null
}
