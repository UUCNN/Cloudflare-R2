function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
export async function onRequestPost(context:any){
 const {env,request}=context;
 const secret=request.headers.get("x-chat-cleanup-secret");
 if(!env.CHAT_CLEANUP_SECRET||secret!==env.CHAT_CLEANUP_SECRET)return json({error:"forbidden"},403);
 if(!env.DB)return json({ok:false,error:"D1 binding DB is required"},500);
 const now=Date.now();
 const expired:any=await env.DB.prepare("SELECT id,media_key FROM messages WHERE expires_at<=?").bind(now).all();
 if(env.BUCKET){for(const m of (expired.results||[])){if(m.media_key)await env.BUCKET.delete(m.media_key)}}
 await env.DB.prepare("DELETE FROM messages WHERE expires_at <= ?").bind(now).run();
 await env.DB.prepare("DELETE FROM room_members WHERE room_id IN (SELECT id FROM rooms WHERE expires_at <= ?)").bind(now).run();
 await env.DB.prepare("DELETE FROM rooms WHERE expires_at <= ?").bind(now).run();
 return json({ok:true,cleanedAt:now,deletedMessages:(expired.results||[]).length});
}