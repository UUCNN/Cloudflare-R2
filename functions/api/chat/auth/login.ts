async function hashPassword(password:string){const data=new TextEncoder().encode(password);const hash=await crypto.subtle.digest("SHA-256",data);return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
export async function onRequestPost(context:any){
 const {env,request}=context;if(!env.DB)return json({error:"D1 binding DB is required"},500);
 const body=await request.json().catch(()=>null);const email=String(body?.email||"").trim().toLowerCase();const password=String(body?.password||"");
 const user=await env.DB.prepare("SELECT id,email,nickname,password_hash FROM users WHERE email=?").bind(email).first<any>();
 if(!user||user.password_hash!==await hashPassword(password))return json({error:"invalid credentials"},401);
 const token=crypto.randomUUID()+"."+crypto.randomUUID();
 if(env.CHAT_SESSIONS) await env.CHAT_SESSIONS.put(token,user.id,{expirationTtl:2592000});
 const headers=new Headers({"content-type":"application/json","cache-control":"no-store"});
 headers.append("Set-Cookie","chat_session="+token+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000");
 return new Response(JSON.stringify({ok:true,user:{id:user.id,email:user.email,nickname:user.nickname}}),{headers});
}
