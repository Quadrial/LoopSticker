# LoopSticker

Turn a GIF from a public X post into an animated WebP sticker for WhatsApp.

## Run locally

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Vite also hosts the sticker API, so no separate backend process or proxy port is
needed. Paste an X post link, then download an animated `.webp` file for a
sticker pack or create an `.mp4` video to share in a WhatsApp chat. Sending the
WebP from a browser sends it as ordinary media; WhatsApp may display it as a
still image. It does not add it to a WhatsApp sticker pack.

## Production

```sh
npm run build
npm start
```

The Node server serves the built website and the sticker API. Set `PORT` on the
hosting platform if it requires a specific port.

## Media handling

- The API accepts public X post links and only processes posts containing an X
  GIF.
- It uses the public `api.vxtwitter.com` resolver to locate the GIF. This is a
  third-party service and may change, rate-limit requests, or become unavailable.
- FFmpeg converts the source to animated WebP, capped at 512 × 512 pixels,
  10 seconds, 100 frames, and 500 KB.
- The optional MP4 output is H.264 video, capped at 720 × 720 pixels and 10
  seconds. WhatsApp sends this as a video, not as a sticker.
- Media is converted in a temporary directory and removed after the response.
- WhatsApp sticker packs must be added by a companion app. WhatsApp requires at
  least 3 stickers in a pack, and users must confirm adding the pack in WhatsApp.
  The website alone cannot install stickers into a pack.
