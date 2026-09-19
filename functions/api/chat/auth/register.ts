async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
export async function onRequestPost(context:any){
  const {env,request}=context;
  if(!env.DB) return json({error:"D1 binding DB is required"},500);
  const body=await request.json().catch(()=>null);
  const email=String(body?.email||"").trim().toLowerCase();
  const nickname=String(body?.nickname||"").trim();
  const password=String(body?.password||"");
  if(!/^\S+@\S+\.\S+$/.test(email)||nickname.length<1||nickname.length>40||password.length<8) return json({error:"invalid registration data"},400);
  const exists=await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if(exists) return json({error:"email already registered"},409);
  const now=Date.now(), id=crypto.randomUUID();
  await env.DB.prepare("INSERT INTO users(id,email,password_hash,nickname,created_at,updated_at) VALUES(?,?,?,?,?,?)").bind(id,email,await hashPassword(password),nickname,now,now).run();
  return json({ok:true,user:{id,email,nickname}});
}
