export async function onRequestGet() {
  return Response.json({ ok: true, service: "secure-chat", version: "v1" });
}
