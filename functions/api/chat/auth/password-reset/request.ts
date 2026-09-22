const TTL=30*60;
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
function b64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes))}
async function hash(value:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return b64(new Uint8Array(d))}
async function sendResetEmail(env:any,email:string,token:string){if(!env.RESEND_API_KEY||!env.RESEND_FROM)return false;const origin=String(env.PUBLIC_APP_URL||"").replace(/\/$/,"");const link=origin+"/?reset="+encodeURIComponent(token);const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"authorization":"Bearer "+env.RESEND_API_KEY,"content-type":"application/json"},body:JSON.stringify({from:env.RESEND_FROM,to:[email],subject:"重置 Secure Chat 密码",html:"<p>你请求重置 Secure Chat 密码。</p><p>此链接 30 分钟内有效，且只能使用一次。</p><p><a href=\""+link+"\">重置密码</a></p>"})});return r.ok}
export async function onRequestPost(context:any){
 const {env,request}=context;if(!env.DB)return json({error:"chat bindings are required"},500);const body=await request.json().catch(()=>null),email=String(body?.email||"").trim().toLowerCase();
 if(!/^\\S+@\\S+\\.\\S+$/.test(email))return json({error:"invalid email"},400);
 const user:any=await env.DB.prepare("SELECT id,email FROM users WHERE email=?").bind(email).first();
 if(user){const token=crypto.randomUUID()+"."+crypto.randomUUID(),tokenHash=await hash(token),now=Date.now();await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id=? AND (used_at IS NOT NULL OR expires_at<?)").bind(user.id,now).run();await env.DB.prepare("INSERT INTO password_reset_tokens(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)").bind(tokenHash,user.id,now+TTL*1000,now).run();try{await sendResetEmail(env,email,token)}catch{}}
 return json({ok:true,message:"如果该邮箱已注册，重置链接将发送到邮箱"});
}
