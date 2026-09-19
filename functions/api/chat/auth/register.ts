const ITERATIONS=310000;
function b64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes))}
function unb64(s:string){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function hashPassword(password:string){
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),{name:"PBKDF2"},false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},key,256);
 return `pbkdf2-sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
export async function onRequestPost(context:any){
 const {env,request}=context;
 if(!env.DB) return json({error:"D1 binding DB is required"},500);
 const body=await request.json().catch(()=>null);
 const email=String(body?.email||"").trim().toLowerCase(), nickname=String(body?.nickname||"").trim(), password=String(body?.password||"");
 if(!/^\S+@\S+\.\S+$/.test(email)||nickname.length<1||nickname.length>40||password.length<8) return json({error:"invalid registration data"},400);
 const exists=await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
 if(exists) return json({error:"email already registered"},409);
 const now=Date.now(), id=crypto.randomUUID();
 await env.DB.prepare("INSERT INTO users(id,email,password_hash,nickname,created_at,updated_at) VALUES(?,?,?,?,?,?)").bind(id,email,await hashPassword(password),nickname,now,now).run();
 return json({ok:true,user:{id,email,nickname}});
}