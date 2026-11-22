# LoopSticker

Turn a GIF from a public X post into an animated WebP sticker for WhatsApp.

## Run locally

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Vite also hosts the sticker API, so no separate backend process or proxy port is
needed. Paste an X post link, create the sticker, then share it to WhatsApp from
your device's share menu or download the resulting `.webp` file.

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
- Media is converted in a temporary directory and removed after the response.
- On supported mobile browsers, the share action sends the `.webp` file to the
  device share menu. Select WhatsApp there; adding it to a sticker pack may
  require a separate import step. Websites cannot directly install stickers
  into a WhatsApp pack.
