# X GIF to WhatsApp Sticker

## Goal

Let someone paste a link to a public X post, preview its GIF, convert it into a WhatsApp-compatible animated sticker, and download it for adding to WhatsApp.

## MVP checklist

- [x] Replace the starter screen with a simple page explaining the tool.
- [x] Add a field for an X post link and a button to process it.
- [x] Validate the link and show clear errors for unsupported or unavailable posts.
- [x] Retrieve a GIF from a public X post and show the converted preview.
- [x] Convert the GIF to an animated WebP sticker (512 × 512 maximum, 10 seconds, 100 frames, 500 KB).
- [x] Show the converted animated sticker and let the user download it.
- [x] Offer an MP4 video download for sharing the animation in WhatsApp chats.
- [x] Explain that sharing a WebP from the website does not add it to a WhatsApp sticker pack.
- [x] Test the full flow on desktop and mobile, including invalid links and conversion failures.
- [ ] Build Android and iOS companion apps that collect generated stickers into packs of at least three and use WhatsApp's native sticker-pack import flow.
- [ ] Support receiving sticker files from the website share sheet in each companion app.
- [ ] Validate animated sticker import and playback in WhatsApp on physical Android and iOS devices.

## Implementation notes

- The server uses the public `api.vxtwitter.com` resolver to locate media for an X post. This third-party service may change, rate-limit requests, or become unavailable.
- The website can produce an animated WebP file, but it cannot add it to a WhatsApp sticker pack. A companion app is required; WhatsApp requires at least 3 stickers per pack.
- The official WhatsApp iOS sticker sample warns that an app offering only sticker export may not pass App Store review; the iOS app needs additional user-facing functionality.
- Run `npm run dev` to start the website and local API together; see [README.md](./README.md) for production instructions.
