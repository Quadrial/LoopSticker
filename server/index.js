import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import ffmpegPath from 'ffmpeg-static'

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)
const maxRequestBytes = 4 * 1024
const maxSourceBytes = 20 * 1024 * 1024
const maxStickerBytes = 500 * 1024
const maxConcurrentJobs = 2
const resolverUrl = 'https://api.vxtwitter.com/Twitter/status/'
const distDir = resolve(process.cwd(), 'dist')
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
])

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

async function readJsonRequest(request) {
  if (!request.headers['content-type']?.includes('application/json')) {
    throw new HttpError(415, 'Send the X post link as JSON.')
  }

  const chunks = []
  let size = 0

  for await (const chunk of request) {
    size += chunk.length
    if (size > maxRequestBytes) {
      throw new HttpError(413, 'The request is too large.')
    }
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'The request body must be valid JSON.')
  }
}

function getPostId(value) {
  if (typeof value !== 'string' || value.length > 2048) {
    throw new HttpError(400, 'Enter a valid X post link.')
  }

  let url
  try {
    url = new URL(value.includes('://') ? value : `https://${value}`)
  } catch {
    throw new HttpError(400, 'Enter a valid X post link.')
  }

  const allowedHosts = new Set([
    'x.com',
    'www.x.com',
    'twitter.com',
    'www.twitter.com',
    'mobile.twitter.com',
  ])
  const match = url.pathname.match(
    /^\/(?:[^/]+\/status|i\/web\/status)\/(\d+)(?:\/|$)/i,
  )

  if (
    url.protocol !== 'https:' ||
    !allowedHosts.has(url.hostname.toLowerCase()) ||
    !match
  ) {
    throw new HttpError(400, 'Paste a link to an X post.')
  }

  return match[1]
}

async function getGifUrl(postId) {
  let response
  try {
    response = await fetch(`${resolverUrl}${postId}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new HttpError(502, 'Could not reach the X media resolver. Try again.')
  }

  if (response.status === 404) {
    throw new HttpError(404, 'This X post is unavailable or could not be found.')
  }
  if (response.status === 429) {
    throw new HttpError(503, 'The X media resolver is busy. Try again shortly.')
  }
  if (!response.ok) {
    throw new HttpError(502, 'Could not retrieve media from this X post.')
  }

  let post
  try {
    post = await response.json()
  } catch {
    throw new HttpError(502, 'The X media resolver returned an invalid response.')
  }

  const gif =
    post !== null &&
    typeof post === 'object' &&
    Array.isArray(post.media_extended)
    ? post.media_extended.find((media) => media.type === 'gif')
    : undefined

  if (!gif || typeof gif.url !== 'string') {
    throw new HttpError(422, 'This X post does not contain a supported GIF.')
  }

  let mediaUrl
  try {
    mediaUrl = new URL(gif.url)
  } catch {
    throw new HttpError(502, 'The X media resolver returned an invalid media URL.')
  }

  if (
    mediaUrl.protocol !== 'https:' ||
    mediaUrl.hostname.toLowerCase() !== 'video.twimg.com'
  ) {
    throw new HttpError(502, 'The X media resolver returned an unsupported media URL.')
  }

  return mediaUrl
}

async function downloadMedia(mediaUrl) {
  let response
  try {
    response = await fetch(mediaUrl, {
      signal: AbortSignal.timeout(20_000),
    })
  } catch {
    throw new HttpError(502, 'Could not download the GIF from X. Try again.')
  }

  if (!response.ok || !response.body) {
    throw new HttpError(502, 'Could not download the GIF from X.')
  }

  const contentLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxSourceBytes) {
    throw new HttpError(413, 'This GIF is too large to convert.')
  }

  const reader = response.body.getReader()
  const chunks = []
  let size = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      size += value.byteLength
      if (size > maxSourceBytes) {
        await reader.cancel()
        throw new HttpError(413, 'This GIF is too large to convert.')
      }
      chunks.push(Buffer.from(value))
    }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(502, 'The GIF download was interrupted. Try again.')
  }

  return Buffer.concat(chunks)
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, args, { windowsHide: true })
    let stderr = ''
    const timeout = setTimeout(() => process.kill(), 60_000)

    process.stderr.setEncoding('utf8')
    process.stderr.on('data', (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-4000)
    })
    process.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    process.on('close', (code) => {
      clearTimeout(timeout)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(stderr.trim() || `FFmpeg exited with code ${code}.`))
      }
    })
  })
}

async function convertToSticker(inputPath, outputPath) {
  const profiles = [
    { fps: 12, quality: 50 },
    { fps: 10, quality: 40 },
    { fps: 8, quality: 30 },
    { fps: 6, quality: 20 },
  ]

  for (const profile of profiles) {
    const filter = [
      `fps=${profile.fps}`,
      'scale=512:512:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos',
      'pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
      'format=yuva420p',
    ].join(',')

    await runFfmpeg([
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      inputPath,
      '-t',
      '10',
      '-vf',
      filter,
      '-frames:v',
      '100',
      '-an',
      '-loop',
      '0',
      '-c:v',
      'libwebp_anim',
      '-lossless',
      '0',
      '-quality',
      String(profile.quality),
      '-compression_level',
      '2',
      outputPath,
    ])

    const outputInfo = await stat(outputPath)
    if (outputInfo.size > 0 && outputInfo.size <= maxStickerBytes) {
      return readFile(outputPath)
    }
  }

  throw new HttpError(
    422,
    'This GIF is too long or complex to fit WhatsApp’s 500 KB sticker limit.',
  )
}

async function handleStickerRequest(request, response) {
  const body = await readJsonRequest(request)
  const postId = getPostId(body.url)
  const mediaUrl = await getGifUrl(postId)
  const source = await downloadMedia(mediaUrl)
  const workDir = await mkdtemp(join(tmpdir(), 'loopsticker-'))

  try {
    const inputPath = join(workDir, 'source.mp4')
    const outputPath = join(workDir, `${randomUUID()}.webp`)
    await writeFile(inputPath, source)
    const sticker = await convertToSticker(inputPath, outputPath)

    response.writeHead(200, {
      'Content-Type': 'image/webp',
      'Content-Length': sticker.length,
      'Content-Disposition': 'attachment; filename="whatsapp-sticker.webp"',
      'Cache-Control': 'no-store',
    })
    response.end(sticker)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function serveStatic(request, response, pathname) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    sendJson(response, 405, { error: 'Method not allowed.' })
    return
  }

  let decodedPath
  try {
    decodedPath = decodeURIComponent(pathname)
  } catch {
    sendJson(response, 400, { error: 'Invalid URL path.' })
    return
  }

  let filePath = resolve(distDir, `.${decodedPath}`)
  if (filePath !== distDir && !filePath.startsWith(`${distDir}${sep}`)) {
    sendJson(response, 403, { error: 'Forbidden.' })
    return
  }

  try {
    const fileInfo = await stat(filePath)
    if (fileInfo.isDirectory()) filePath = join(filePath, 'index.html')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    if (extname(filePath)) {
      sendJson(response, 404, { error: 'Not found.' })
      return
    }
    filePath = join(distDir, 'index.html')
  }

  let body
  try {
    body = await readFile(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(response, 503, { error: 'Build the frontend before starting the server.' })
      return
    }
    throw error
  }

  const extension = extname(filePath).toLowerCase()
  response.writeHead(200, {
    'Content-Type': contentTypes.get(extension) ?? 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control':
      extension === '.html'
        ? 'no-cache'
        : pathname.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
  })
  response.end(request.method === 'HEAD' ? undefined : body)
}

if (!ffmpegPath) {
  throw new Error('FFmpeg is unavailable. Reinstall the ffmpeg-static package.')
}

let activeJobs = 0

export function handleApiRequest(request, response) {
  const pathname = new URL(request.url, 'http://localhost').pathname

  if (pathname === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, { ok: true })
    return true
  }

  if (pathname === '/api/sticker') {
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Method not allowed.' })
      return true
    }

    if (activeJobs >= maxConcurrentJobs) {
      sendJson(response, 503, { error: 'The converter is busy. Try again shortly.' })
      return true
    }
    activeJobs += 1

    handleStickerRequest(request, response).catch((error) => {
      if (response.headersSent) {
        response.destroy()
        return
      }

      if (error instanceof HttpError) {
        sendJson(response, error.status, { error: error.message })
        return
      }

      console.error('Sticker conversion failed:', error)
      sendJson(response, 500, {
        error: 'Could not convert this GIF. Please try another public X post.',
      })
    }).finally(() => {
      activeJobs -= 1
    })
    return true
  }

  if (pathname.startsWith('/api/')) {
    sendJson(response, 404, { error: 'Not found.' })
    return true
  }

  return false
}

const server = createServer((request, response) => {
  if (handleApiRequest(request, response)) return

  const pathname = new URL(request.url, 'http://localhost').pathname
  serveStatic(request, response, pathname).catch((error) => {
    console.error('Static file serving failed:', error)
    sendJson(response, 500, { error: 'Could not serve the website.' })
  })
})

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  server.listen(port, process.env.HOST ?? '0.0.0.0', () => {
    console.log(`Sticker API listening on port ${port}`)
  })
}
