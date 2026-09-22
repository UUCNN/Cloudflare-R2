function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function sessionUserId(context:any){const c=context.request.headers.get("Cookie")||"";const t=c.match(/(?:^|;\s*)chat_session=([^;]+)/)?.[1];if(!t||!context.env.CHAT_SESSIONS)return null;const data=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));const hash=Array.from(new Uint8Array(data)).map(b=>b.toString(16).padStart(2,"0")).join("");return context.env.CHAT_SESSIONS.get("session:"+hash)}async function member(env:any,roomId:string,userId:string){return env.DB.prepare("SELECT r.id,r.expires_at FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE r.id=? AND m.user_id=? AND r.expires_at>?").bind(roomId,userId,Date.now()).first()}
export async function onRequestPost(context:any){
 const userId=await sessionUserId(context);if(!userId||!context.env.DB||!context.env.BUCKET)return json({error:"unauthorized or storage unavailable"},401);
 const roomId=String(context.params.room||""),room:any=await member(context.env,roomId,userId);if(!room)return json({error:"room not found"},404);
 const length=Number(context.request.headers.get("content-length")||0);if(!Number.isFinite(length)||length<=0)return json({error:"content-length required"},411);if(length>100*1024*1024)return json({error:"file too large"},413);
 const id=crypto.randomUUID(),key="chat/"+roomId+"/"+id+".bin";await context.env.BUCKET.put(key,context.request.body,{httpMetadata:{contentType:"application/octet-stream"},customMetadata:{roomId,ownerId:userId}});return json({ok:true,mediaKey:key,uploadId:id,expiresAt:room.expires_at})
}
export async function onRequestDelete(context:any){
 const userId=await sessionUserId(context);if(!userId||!context.env.DB||!context.env.BUCKET)return json({error:"unauthorized or storage unavailable"},401);
 const roomId=String(context.params.room||""),room=await member(context.env,roomId,userId);if(!room)return json({error:"room not found"},404);
 const key=decodeURIComponent(new URL(context.request.url).searchParams.get("key")||"");if(!key.startsWith("chat/"+roomId+"/"))return json({error:"invalid media key"},400);
 const obj=await context.env.BUCKET.head(key);if(!obj)return json({ok:true});
 if(obj.customMetadata?.ownerId!==userId)return json({error:"forbidden"},403);
 await context.env.BUCKET.delete(key);return json({ok:true})
}
export async function onRequestGet(context:any){
 const userId=await sessionUserId(context);if(!userId||!context.env.DB||!context.env.BUCKET)return new Response("unauthorized",{status:401});
 const roomId=String(context.params.room||""),key=decodeURIComponent(new URL(context.request.url).searchParams.get("key")||"");
 const m=await member(context.env,roomId,userId);if(!m||!key.startsWith("chat/"+roomId+"/"))return new Response("not found",{status:404});
 const obj=await context.env.BUCKET.get(key);if(!obj)return new Response("not found",{status:404});
 return new Response(obj.body,{headers:{"content-type":"application/octet-stream","cache-control":"private, no-store"}})
}
