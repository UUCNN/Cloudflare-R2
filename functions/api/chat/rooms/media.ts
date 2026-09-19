function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function auth(context:any){const c=context.request.headers.get("Cookie")||"";const t=c.match(/(?:^|;\s*)chat_session=([^;]+)/)?.[1];if(!t||!context.env.CHAT_SESSIONS)return null;const v=await context.env.CHAT_SESSIONS.get(t,"json");return v?.userId||v||null}
export async function onRequestPost(context:any){
 const userId=await auth(context); if(!userId||!context.env.DB||!context.env.BUCKET)return json({error:"unauthorized or storage unavailable"},401);
 const roomId=String(context.params.room||"");
 const room:any=await context.env.DB.prepare("SELECT r.id,r.expires_at FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE r.id=? AND m.user_id=? AND r.expires_at>?").bind(roomId,userId,Date.now()).first();
 if(!room)return json({error:"room not found"},404);
 const length=Number(context.request.headers.get("content-length")||0); if(length>100*1024*1024)return json({error:"file too large"},413);
 const id=crypto.randomUUID(); const key="chat/"+roomId+"/"+id+".bin";
 await context.env.BUCKET.put(key,context.request.body,{httpMetadata:{contentType:"application/octet-stream"},customMetadata:{roomId,ownerId:userId}});
 return json({ok:true,mediaKey:key,messageId:id,expiresAt:room.expires_at});
}
export async function onRequestGet(context:any){
 const userId=await auth(context);if(!userId||!context.env.DB||!context.env.BUCKET)return new Response("unauthorized",{status:401});
 const roomId=String(context.params.room||""),key=decodeURIComponent(new URL(context.request.url).searchParams.get("key")||"");
 const member=await context.env.DB.prepare("SELECT 1 FROM room_members m JOIN rooms r ON r.id=m.room_id WHERE m.room_id=? AND m.user_id=? AND r.expires_at>?" ).bind(roomId,userId,Date.now()).first();
 if(!member||!key.startsWith("chat/"+roomId+"/"))return new Response("not found",{status:404});
 const obj=await context.env.BUCKET.get(key);if(!obj)return new Response("not found",{status:404});
 return new Response(obj.body,{headers:{"content-type":"application/octet-stream","cache-control":"private, no-store"}});
}
