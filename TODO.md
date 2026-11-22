# X GIF to WhatsApp Video

## Goal

Let someone paste a link to a public X post, preview its GIF, convert it into an MP4, and share or download the video for WhatsApp chats.

## MVP checklist

- [x] Replace the starter screen with a simple page explaining the tool.
- [x] Add a field for an X post link and a button to process it.
- [x] Validate the link and show clear errors for unsupported or unavailable posts.
- [x] Retrieve a GIF from a public X post and show the converted preview.
- [x] Convert the GIF to an H.264 MP4 video (720 × 720 maximum, 10 seconds).
- [x] Show the converted video preview and let the user download it.
- [x] Offer sharing the MP4 video through the device share menu.
- [x] Explain that MP4 is shared as a video, not added as a WhatsApp sticker.
- [x] Test the full flow on desktop and mobile, including invalid links and conversion failures.
- [ ] Build Android and iOS companion apps that collect generated stickers into packs of at least three and use WhatsApp's native sticker-pack import flow.
- [ ] Support receiving sticker files from the website share sheet in each companion app.
- [ ] Validate animated sticker import and playback in WhatsApp on physical Android and iOS devices.

## Implementation notes

- The server uses the public `api.vxtwitter.com` resolver to locate media for an X post. This third-party service may change, rate-limit requests, or become unavailable.
- The `/api/sticker` endpoint still produces animated WebP for a future companion-app sticker-pack workflow. The website's current UI uses MP4 for video messages.
- The official WhatsApp iOS sticker sample warns that an app offering only sticker export may not pass App Store review; the iOS app needs additional user-facing functionality.
- Run `npm run dev` to start the website and local API together; see [README.md](./README.md) for production instructions.
