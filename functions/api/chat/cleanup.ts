function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function deleteRoomMedia(bucket:any,roomId:string){
 let cursor:string|undefined;
 do{
  const page=await bucket.list({prefix:"chat/"+roomId+"/",...(cursor?{cursor}:{})});
  const keys=(page.objects||[]).map((x:any)=>x.key).filter(Boolean);
  if(keys.length)await bucket.delete(keys);
  cursor=page.truncated?page.cursor:undefined;
 }while(cursor);
}
export async function onRequestPost(context:any){
 const {env,request}=context;
 const secret=request.headers.get("x-chat-cleanup-secret");
 if(!env.CHAT_CLEANUP_SECRET||secret!==env.CHAT_CLEANUP_SECRET)return json({error:"forbidden"},403);
 if(!env.DB)return json({ok:false,error:"D1 binding DB is required"},500);
 const now=Date.now();
 const expired:any=await env.DB.prepare("SELECT id,room_id,media_key FROM messages WHERE expires_at<=?").bind(now).all();
 const expiredRooms:any=await env.DB.prepare("SELECT id FROM rooms WHERE expires_at<=?").bind(now).all();
 if(env.BUCKET){
  for(const room of (expiredRooms.results||[])){try{await deleteRoomMedia(env.BUCKET,room.id)}catch{}}
  for(const m of (expired.results||[])){if(m.media_key)try{await env.BUCKET.delete(m.media_key)}catch{}}
 }
 await env.DB.batch([
  env.DB.prepare("DELETE FROM messages WHERE expires_at <= ?").bind(now),
  env.DB.prepare("DELETE FROM room_keys WHERE room_id IN (SELECT id FROM rooms WHERE expires_at <= ?)").bind(now),
  env.DB.prepare("DELETE FROM room_invites WHERE room_id IN (SELECT id FROM rooms WHERE expires_at <= ?)").bind(now),
  env.DB.prepare("DELETE FROM room_members WHERE room_id IN (SELECT id FROM rooms WHERE expires_at <= ?)").bind(now),
  env.DB.prepare("DELETE FROM rooms WHERE expires_at <= ?").bind(now)
 ]);
 return json({ok:true,cleanedAt:now,deletedMessages:(expired.results||[]).length,deletedRooms:(expiredRooms.results||[]).length});
}
