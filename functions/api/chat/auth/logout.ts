function json(data:any,status=200,headers:any={}){return Response.json(data,{status,headers:{"cache-control":"no-store",...headers}})}
export async function onRequestPost(context:any){
 const {env,request}=context;
 const cookie=request.headers.get("Cookie")||"";
 const token=cookie.match(/(?:^|;\s*)chat_session=([^;]+)/)?.[1];
 if(token&&env.CHAT_SESSIONS) await env.CHAT_SESSIONS.delete(token);
 return json({ok:true},{status:200});
}
