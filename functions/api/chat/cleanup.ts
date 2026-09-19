export async function onRequestPost(context: any) {
  const { env } = context;
  if (!env.DB) return Response.json({ ok: false, error: "D1 binding DB is required" }, { status: 500 });
  const now = Date.now();
  await env.DB.prepare("DELETE FROM messages WHERE expires_at <= ?").bind(now).run();
  await env.DB.prepare("DELETE FROM room_members WHERE room_id IN (SELECT id FROM rooms WHERE expires_at <= ?)").bind(now).run();
  await env.DB.prepare("DELETE FROM rooms WHERE expires_at <= ?").bind(now).run();
  return Response.json({ ok: true, cleanedAt: now });
}
