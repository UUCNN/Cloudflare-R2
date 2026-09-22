async function sha256(value:string){const data=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(data)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
export async function onRequestGet(context:any){
 const {env,request}=context;const cookie=request.headers.get("Cookie")||"";const token=cookie.match(/(?:^|;\s*)chat_session=([^;]+)/)?.[1];
 if(!token||!env.CHAT_SESSIONS||!env.DB)return json({user:null},401);
 const uid=await env.CHAT_SESSIONS.get("session:"+await sha256(token));if(!uid)return json({user:null},401);
 const user=await env.DB.prepare("SELECT id,email,nickname,avatar_url FROM users WHERE id=?").bind(uid).first();
 return json({user});
}
