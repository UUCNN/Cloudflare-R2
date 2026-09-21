function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function auth(context:any){
 const c=context.request.headers.get("Cookie")||"";
 const t=c.match(/(?:^|;\\s*)chat_session=([^;]+)/)?.[1];
 if(!t||!context.env.CHAT_SESSIONS)return null;
 const v=await context.env.CHAT_SESSIONS.get(t,"json");
 return v?.userId||v||null;
}
export async function onRequestGet(context:any){
 const userId=await auth(context);
 if(!userId||!context.env.DB)return json({error:"unauthorized"},401);
 const roomId=String(context.params.room||"");
 const member=await context.env.DB.prepare("SELECT r.id FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE r.id=? AND m.user_id=? AND r.expires_at>?").bind(roomId,userId,Date.now()).first();
 if(!member)return json({error:"room not found"},404);
 if(!context.env.CHAT_ROOMS||!context.env.CHAT_WS_INTERNAL_SECRET)return json({error:"websocket unavailable"},503);
 const stub=context.env.CHAT_ROOMS.get(context.env.CHAT_ROOMS.idFromName(roomId));
 return stub.fetch("https://chat-room/ws",{
   method:"GET",
   headers:{
     "x-chat-user":userId,
     "x-chat-room":roomId,
     "x-chat-internal-secret":context.env.CHAT_WS_INTERNAL_SECRET
   }
 });
}
