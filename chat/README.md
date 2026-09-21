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
