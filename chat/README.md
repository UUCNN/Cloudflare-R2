# Secure Chat V1

This branch adds the foundation for a Cloudflare Pages/Workers secure chat application while preserving the existing R2 drive.

## Components
- D1: users, rooms, memberships, encrypted message metadata and expiry records.
- Durable Objects: real-time room WebSocket coordination (to be wired in the next phase).
- R2: encrypted media objects; clients encrypt media before upload.
- Web Crypto: client-side room/message encryption.

## 72-hour policy
Room and message records carry an explicit expires_at timestamp. Application cleanup must remove expired D1 records and corresponding R2 media. R2 lifecycle rules should be configured as a second-line cleanup mechanism.

## Security
The server must never treat ciphertext as plaintext. Room keys stay client-side; the API only distributes public/device keys and encrypted key envelopes. Passwords are stored as slow password hashes, never plaintext.
