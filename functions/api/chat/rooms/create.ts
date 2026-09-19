function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function uid(context:any){const c=context.request.headers.get("Cookie")||"";const t=c.match(/(?:^|;\\s*)chat_session=([^;]+)/)?.[1];return t&&context.env.CHAT_SESSIONS?context.env.CHAT_SESSIONS.get(t):null}
export async function onRequestPost(context:any){
 const userId=await uid(context);if(!userId)return json({error:"unauthorized"},401);if(!context.env.DB)return json({error:"D1 binding DB is required"},500);
 const body=await context.request.json().catch(()=>null);const name=String(body?.name||"新交流房").trim().slice(0,80);const id=crypto.randomUUID();const now=Date.now(),expires=now+72*60*60*1000;
 await context.env.DB.batch([
  context.env.DB.prepare("INSERT INTO rooms(id,owner_id,name,expires_at,created_at) VALUES(?,?,?,?,?)").bind(id,userId,name,expires,now),
  context.env.DB.prepare("INSERT INTO room_members(room_id,user_id,role,joined_at) VALUES(?,?,?,?)").bind(id,userId,"owner",now)
 ]);
 return json({ok:true,room:{id,name,expiresAt:expires}});
}
