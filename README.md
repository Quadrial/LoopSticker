# LoopSticker

Turn a GIF from a public X post into an MP4 video for WhatsApp chats.

## Run locally

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Vite also hosts the media API, so no separate backend process or proxy port is
needed. Paste an X post link, create the MP4, then share it to WhatsApp as a
video or download it. MP4 videos animate in chat but are not stickers.

## Production

```sh
npm run build
npm start
```

The Node server serves the built website and the media API. Set `PORT` on the
hosting platform if it requires a specific port.

## Media handling

- The API accepts public X post links and only processes posts containing an X
  GIF.
- It uses the public `api.vxtwitter.com` resolver to locate the GIF. This is a
  third-party service and may change, rate-limit requests, or become unavailable.
- FFmpeg creates an H.264 MP4 video, capped at 720 × 720 pixels and 10 seconds.
- The `/api/sticker` endpoint remains available for animated WebP sticker-pack
  workflows; the website's main download and share options use MP4.
- Media is converted in a temporary directory and removed after the response.
- WhatsApp sticker packs must be added by a companion app. WhatsApp requires at
  least 3 stickers in a pack, and users must confirm adding the pack in WhatsApp.
  The website alone cannot install stickers into a pack.
