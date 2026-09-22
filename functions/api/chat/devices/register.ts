function json(data:any,status=200){return Response.json(data,{status,headers:{"cache-control":"no-store"}})}
async function auth(c:any){const h=c.request.headers.get("Cookie")||"";const t=h.match(/(?:^|;\s*)chat_session=([^;]+)/)?.[1];if(!t||!c.env.CHAT_SESSIONS)return null;const v=await c.env.CHAT_SESSIONS.get(t);return v?.userId||v||null}
function validJwk(value:string){
 if(value.length>5000)return false;
 try{const k=JSON.parse(value);return k&&k.kty==="EC"&&k.crv==="P-256"&&typeof k.x==="string"&&typeof k.y==="string"&&k.x.length<=200&&k.y.length<=200}catch{return false}
}
export async function onRequestPost(context:any){
 const uid=await auth(context);if(!uid||!context.env.DB)return json({error:"unauthorized"},401);
 const b=await context.request.json().catch(()=>null),publicKey=String(b?.publicKey||"");
 if(!validJwk(publicKey))return json({error:"invalid publicKey"},400);
 const id=crypto.randomUUID(),now=Date.now(),name=String(b?.name||"device").trim().slice(0,80)||"device";
 await context.env.DB.prepare("INSERT INTO devices(id,user_id,name,public_key,created_at,last_seen_at) VALUES(?,?,?,?,?,?)").bind(id,uid,name,publicKey,now,now).run();
 return json({deviceId:id,publicKey});
}
