# Secure Chat V1

This branch adds the secure-chat application alongside the existing R2 drive.

## Components
- D1: users, rooms, memberships, device public keys, encrypted room-key envelopes, encrypted message metadata and expiry records.
- Durable Objects: real-time room WebSocket coordination.
- R2: encrypted media objects; clients encrypt media before upload.
- Web Crypto: client-side room/message/media encryption.
- Pages Functions: authenticated APIs and the WebSocket proxy.

## 72-hour policy
Room and message records carry an explicit expires_at timestamp. Cleanup removes expired D1 records and corresponding R2 media. R2 lifecycle rules should be configured as a second-line cleanup mechanism.

## Security
The server must never treat ciphertext as plaintext. Room keys stay client-side; the API stores only encrypted key envelopes. Passwords are stored as salted PBKDF2-SHA256 hashes. Media message keys are restricted to the current room and must resolve to an existing R2 object.

WebSocket connections must pass through the authenticated Pages Function proxy. The Durable Object also requires the private CHAT_WS_INTERNAL_SECRET; do not put this secret in source control.

Configure the secret in the Cloudflare environment used by the Pages Functions/Durable Object:

    wrangler secret put CHAT_WS_INTERNAL_SECRET

Use a long random value and keep it out of Git.

## Room key distribution
The room owner initializes the room key on the first device. The owner can publish E2E-encrypted envelopes to other devices in the room. A device that has no envelope must not generate a replacement room key, because that would make existing messages undecryptable.

## Function routing
Dynamic room APIs live under functions/api/chat/rooms/[room]/... so the deployed URLs match:
- /api/chat/rooms/:room/messages
- /api/chat/rooms/:room/media
- /api/chat/rooms/:room/keys
- /api/chat/rooms/:room/ws
- /api/chat/rooms/:room/invite


## Cloudflare deployment layout
The Pages project and the Durable Object namespace are deployed separately. Pages Functions cannot create/deploy the Durable Object Worker itself.

1. Configure the real D1, R2 and KV IDs in `wrangler.toml` (the repository keeps placeholders and does not contain account-specific IDs).
2. Deploy the dedicated Durable Object Worker with:
   ```
   npx wrangler deploy -c wrangler.chat-room.toml
   ```
3. Set `CHAT_WS_INTERNAL_SECRET` on the Durable Object Worker and on the Pages project, using the same random value:
   ```
   npx wrangler secret put CHAT_WS_INTERNAL_SECRET -c wrangler.chat-room.toml
   npx wrangler pages secret put CHAT_WS_INTERNAL_SECRET
   ```
4. Configure `CHAT_CLEANUP_SECRET` for the Pages project before invoking the cleanup endpoint.
5. Deploy the Pages project after the real bindings are filled in:
   ```
   npx wrangler pages deploy .
   ```

The Pages Wrangler binding points `CHAT_ROOMS` at the separate Worker named `secure-chat-room`. This matches Cloudflare's requirement that a Pages Durable Object binding use an external Durable Object Worker.
