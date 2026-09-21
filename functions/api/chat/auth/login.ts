const ITERATIONS=310000;
function unb64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
function hex(bytes:Uint8Array){return Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("")}
function equal(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
async function verifyPassword(password:string,stored:string){
 const p=stored.split("$"); if(p.length!==4||p[0]!=="pbkdf2-sha256") return false;
 const iterations=Number(p[1]); if(!Number.isFinite(iterations)||iterations<100000||iterations>1000000)return false;
 const salt=unb64(p[2]), expected=unb64(p[3]);
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),{name:"PBKDF2"},false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations,hash:"SHA-256"},key,expected.length*8);
 return equal(new Uint8Array(bits),expected);
}
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
export async function onRequestPost(context:any){
 const {env,request}=context;
 if(!env.DB||!env.CHAT_SESSIONS)return json({error:"chat bindings are required"},500);
 const body=await request.json().catch(()=>null), email=String(body?.email||"").trim().toLowerCase(), password=String(body?.password||"");
 if(!/^\S+@\S+\.\S+$/.test(email)||!password)return json({error:"invalid credentials"},400);
 const user:any=await env.DB.prepare("SELECT id,email,nickname,avatar_url,password_hash FROM users WHERE email=?").bind(email).first();
 if(!user||!(await verifyPassword(password,user.password_hash)))return json({error:"invalid email or password"},401);
 const token=crypto.randomUUID()+"."+crypto.randomUUID(), now=Date.now();
 await env.CHAT_SESSIONS.put(token,user.id,{expirationTtl:2592000});
 return new Response(JSON.stringify({ok:true,user:{id:user.id,email:user.email,nickname:user.nickname,avatarUrl:user.avatar_url}}),{status:200,headers:{"content-type":"application/json","cache-control":"no-store","set-cookie":`chat_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`}});
}