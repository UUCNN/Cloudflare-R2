async function sha256(value:string){const data=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(data)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function json(data:any,status=200,headers:any={}){return Response.json(data,{status,headers:{"cache-control":"no-store",...headers}})}
export async function onRequestPost(context:any){
 const {env,request}=context;const cookie=request.headers.get("Cookie")||"";const token=cookie.match(/(?:^|;\\s*)chat_session=([^;]+)/)?.[1];
 if(token&&env.CHAT_SESSIONS)await env.CHAT_SESSIONS.delete("session:"+await sha256(token));
 return json({ok:true},200,{"set-cookie":"chat_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"});
}
