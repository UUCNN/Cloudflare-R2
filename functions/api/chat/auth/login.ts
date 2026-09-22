const ITERATIONS=310000;
const SESSION_TTL=2592000;
function unb64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
function equal(a:Uint8Array,b:Uint8Array){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
async function verifyPassword(password:string,stored:string){
 const p=stored.split("$"); if(p.length!==4||p[0]!=="pbkdf2-sha256") return false;
 const iterations=Number(p[1]); if(!Number.isFinite(iterations)||iterations<100000||iterations>1000000)return false;
 const salt=unb64(p[2]), expected=unb64(p[3]);
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),{name:"PBKDF2"},false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations,hash:"SHA-256"},key,expected.length*8);
 return equal(new Uint8Array(bits),expected);
}
async function sha256(value:string){const data=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(data)).map(b=>b.toString(16).padStart(2,"0")).join("")}
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function allowLoginAttempt(kv:any,email:string){
 if(!kv)return true;
 const bucket=Math.floor(Date.now()/10000),key="login-fail:"+email+":"+bucket;
 const count=Number(await kv.get(key)||0);if(count>=5)return false;
 try{await kv.put(key,String(count+1),{expirationTtl:20})}catch{}
 return true;
}
export async function onRequestPost(context:any){
 const {env,request}=context;
 if(!env.DB||!env.CHAT_SESSIONS)return json({error:"chat bindings are required"},500);
 const body=await request.json().catch(()=>null), email=String(body?.email||"").trim().toLowerCase(), password=String(body?.password||"");
 if(!/^\\S+@\\S+\\.\\S+$/.test(email)||!password)return json({error:"invalid credentials"},400);
 if(!(await allowLoginAttempt(env.CHAT_SESSIONS,email)))return json({error:"too many login attempts, try again shortly"},429,{"retry-after":"10"});
 const user:any=await env.DB.prepare("SELECT id,email,nickname,avatar_url,password_hash FROM users WHERE email=?").bind(email).first();
 if(!user||!(await verifyPassword(password,user.password_hash)))return json({error:"invalid email or password"},401);
 const token=crypto.randomUUID()+"."+crypto.randomUUID(),tokenHash=await sha256(token), now=Date.now();
 await env.CHAT_SESSIONS.put("session:"+tokenHash,user.id,{expirationTtl:SESSION_TTL});
 return new Response(JSON.stringify({ok:true,user:{id:user.id,email:user.email,nickname:user.nickname,avatarUrl:user.avatar_url}}),{status:200,headers:{"content-type":"application/json","cache-control":"no-store","set-cookie":`chat_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`}});
}