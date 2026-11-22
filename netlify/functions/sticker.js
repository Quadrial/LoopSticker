import { Readable } from 'node:stream'
import { handleApiRequest } from '../../server/index.js'

export default async (request) => {
  const url = new URL(request.url)
  const body =
    request.method === 'POST'
      ? Buffer.from(await request.arrayBuffer())
      : Buffer.alloc(0)

  const incoming = Readable.from(body.length ? [body] : [])
  Object.assign(incoming, {
    method: request.method,
    url: url.pathname,
    headers: Object.fromEntries(request.headers.entries()),
  })

  return new Promise((resolve) => {
    const outgoingHeaders = new Headers()
    let statusCode = 200
    let settled = false

    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(new Response(value, { status: statusCode, headers: outgoingHeaders }))
    }

    const outgoing = {
      headersSent: false,
      writeHead(status, headers = {}) {
        statusCode = status
        for (const [name, value] of Object.entries(headers)) {
          outgoingHeaders.set(name, String(value))
        }
        this.headersSent = true
      },
      end(value) {
        finish(
          value === undefined
            ? undefined
            : typeof value === 'string'
              ? value
              : Buffer.from(value),
        )
      },
      destroy() {
        if (!settled) finish(JSON.stringify({ error: 'Could not create a sticker.' }))
      },
    }

    if (!handleApiRequest(incoming, outgoing)) {
      finish(JSON.stringify({ error: 'Not found.' }))
    }
  })
}
