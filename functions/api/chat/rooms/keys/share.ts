function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function auth(c:any){const h=c.request.headers.get("Cookie")||"";const t=h.match(/(?:^|;\\s*)chat_session=([^;]+)/)?.[1];if(!t||!c.env.CHAT_SESSIONS)return null;const v=await c.env.CHAT_SESSIONS.get(t,"json");return v?.userId||v||null}
export async function onRequestPost(context:any){
 const uid=await auth(context);if(!uid||!context.env.DB)return json({error:"unauthorized"},401);
 const roomId=String(context.params.room||""),b=await context.request.json().catch(()=>null),deviceId=String(b?.deviceId||""),encryptedKey=String(b?.encryptedKey||"");
 if(!deviceId||!encryptedKey||encryptedKey.length>20000)return json({error:"invalid key"},400);
 const member=await context.env.DB.prepare("SELECT 1 FROM room_members WHERE room_id=? AND user_id=?").bind(roomId,uid).first();
 const target=await context.env.DB.prepare("SELECT d.id FROM devices d JOIN room_members m ON m.user_id=d.user_id WHERE d.id=? AND m.room_id=?").bind(deviceId,roomId).first();
 const room=await context.env.DB.prepare("SELECT 1 FROM rooms WHERE id=? AND expires_at>?").bind(roomId,Date.now()).first();
 if(!member||!target||!room)return json({error:"forbidden"},403);
 await context.env.DB.prepare("INSERT OR REPLACE INTO room_keys(room_id,device_id,encrypted_key,created_at) VALUES(?,?,?,?)").bind(roomId,deviceId,encryptedKey,Date.now()).run();
 return json({ok:true});
}
