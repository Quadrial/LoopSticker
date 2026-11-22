# X GIF to WhatsApp Sticker

## Goal

Let someone paste a link to a public X post, preview its GIF, convert it into a WhatsApp-compatible animated sticker, and download it for adding to WhatsApp.

## MVP checklist

- [x] Replace the starter screen with a simple page explaining the tool.
- [x] Add a field for an X post link and a button to process it.
- [x] Validate the link and show clear errors for unsupported or unavailable posts.
- [x] Retrieve a GIF from a public X post and show the converted preview.
- [x] Convert the GIF to an animated WebP sticker (512 × 512 maximum, 10 seconds, 100 frames, 500 KB).
- [x] Show the converted sticker and let the user download it.
- [x] Explain how to add the downloaded sticker to WhatsApp on their device.
- [x] Test the full flow on desktop and mobile, including invalid links and conversion failures.

## Implementation notes

- The server uses the public `api.vxtwitter.com` resolver to locate media for an X post. This third-party service may change, rate-limit requests, or become unavailable.
- A website can provide the sticker file, but adding it to a WhatsApp sticker pack may require a separate import step or a companion app, depending on the user's device.
- Run `npm run dev` to start the website and local API together; see [README.md](./README.md) for production instructions.
