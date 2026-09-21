function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
export async function onRequestGet(context:any){
 const c=context.request.headers.get("Cookie")||"";const t=c.match(/(?:^|;\\s*)chat_session=([^;]+)/)?.[1];const uid=t&&context.env.CHAT_SESSIONS?await context.env.CHAT_SESSIONS.get(t):null;if(!uid)return json({error:"unauthorized"},401);
 const now=Date.now();const rows=await context.env.DB.prepare("SELECT r.id,r.owner_id,r.name,r.expires_at,r.created_at FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE m.user_id=? AND r.expires_at>? ORDER BY r.created_at DESC").bind(uid,now).all();
 return json({rooms:rows.results||[]});
}
