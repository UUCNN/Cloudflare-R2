const ITERATIONS=310000;
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
function b64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes))}
async function hash(value:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return b64(new Uint8Array(d))}
export async function onRequestPost(context:any){
 const {env,request}=context;if(!env.DB)return json({error:"chat bindings are required"},500);const body=await request.json().catch(()=>null),token=String(body?.token||""),password=String(body?.password||"");
 if(token.length<20||password.length<8)return json({error:"invalid reset request"},400);
 const tokenHash=await hash(token),now=Date.now();const row:any=await env.DB.prepare("SELECT token_hash,user_id,expires_at,used_at FROM password_reset_tokens WHERE token_hash=?").bind(tokenHash).first();if(!row||row.used_at||row.expires_at<=now)return json({error:"reset token invalid or expired"},400);
 const salt=crypto.getRandomValues(new Uint8Array(16));const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),{name:"PBKDF2"},false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},key,256);const stored="pbkdf2-sha256$"+ITERATIONS+"$"+b64(salt)+"$"+b64(new Uint8Array(bits));
 await env.DB.batch([env.DB.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").bind(stored,now,row.user_id),env.DB.prepare("UPDATE password_reset_tokens SET used_at=? WHERE token_hash=?").bind(now,tokenHash)]);
 return json({ok:true});
}
