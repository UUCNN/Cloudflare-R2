async function request(path,options={}){const r=await fetch(path,{credentials:"include",headers:{"content-type":"application/json",...(options.headers||{})},...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"请求失败");return d}
export const register=data=>request("/api/chat/auth/register",{method:"POST",body:JSON.stringify(data)});
export const login=data=>request("/api/chat/auth/login",{method:"POST",body:JSON.stringify(data)});
export const me=()=>request("/api/chat/auth/me");
export const createRoom=name=>request("/api/chat/rooms/create",{method:"POST",body:JSON.stringify({name})});
export const listRooms=()=>request("/api/chat/rooms/list");
export const listMessages=(room,before)=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/messages"+(before?"?before="+encodeURIComponent(before):""));
export const sendMessage=(room,data)=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/messages",{method:"POST",body:JSON.stringify(data)});
export const uploadMedia=(room,body,headers={})=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/media",{method:"POST",body,headers});
export const registerDevice=body=>request("/api/chat/devices/register",{method:"POST",body:JSON.stringify(body)});
export const listDevices=()=>request("/api/chat/devices/list");
export const saveRoomKey=(roomId,body)=>request("/api/chat/rooms/"+encodeURIComponent(roomId)+"/keys",{method:"POST",body:JSON.stringify(body)});
export const getRoomKeys=roomId=>request("/api/chat/rooms/"+encodeURIComponent(roomId)+"/keys");
export const inviteToRoom=(room,email)=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/invite",{method:"POST",body:JSON.stringify({email})});
export const acceptInvite=inviteId=>request("/api/chat/rooms/invites/accept",{method:"POST",body:JSON.stringify({inviteId})});
export const uploadEncryptedMedia=async(room,blob)=>{const r=await fetch("/api/chat/rooms/"+encodeURIComponent(room)+"/media",{method:"POST",credentials:"include",body:blob,headers:{"content-type":"application/octet-stream"}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"媒体上传失败");return d};
export const uploadVoice=(room,blob)=>uploadEncryptedMedia(room,blob);
export function connectRoom(roomId,onMessage,onState=()=>{return}){
 let ws,closed=false,timer;
 const connect=()=>{if(closed)return;const proto=location.protocol==="https:"?"wss":"ws";ws=new WebSocket(proto+"://"+location.host+"/api/chat/rooms/"+encodeURIComponent(roomId)+"/ws");ws.onopen=()=>onState("open");ws.onmessage=e=>{try{onMessage(JSON.parse(e.data))}catch{}};ws.onclose=()=>{onState("closed");if(!closed)timer=setTimeout(connect,1500)};ws.onerror=()=>onState("error")};
 connect();
 return {close(){closed=true;clearTimeout(timer);ws?.close()}};
}
