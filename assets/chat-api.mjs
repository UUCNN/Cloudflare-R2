async function request(path,options={}){const r=await fetch(path,{credentials:"include",headers:{"content-type":"application/json",...(options.headers||{})},...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"请求失败");return d}
export const register=data=>request("/api/chat/auth/register",{method:"POST",body:JSON.stringify(data)});
export const login=data=>request("/api/chat/auth/login",{method:"POST",body:JSON.stringify(data)});
export const me=()=>request("/api/chat/auth/me");
export const createRoom=name=>request("/api/chat/rooms/create",{method:"POST",body:JSON.stringify({name})});
export const listRooms=()=>request("/api/chat/rooms/list");
export const listMessages=room=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/messages");
export const sendMessage=(room,data)=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/messages",{method:"POST",body:JSON.stringify(data)});
export const uploadMedia=(room,body,headers={})=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/media",{method:"POST",body,headers});
export function connectRoom(roomId,onMessage,onState=()=>{}){const proto=location.protocol==="https:"?"wss":"ws";const ws=new WebSocket(proto+"://"+location.host+"/api/chat/rooms/"+encodeURIComponent(roomId)+"/ws");ws.onopen=()=>onState("open");ws.onclose=()=>onState("closed");ws.onerror=()=>onState("error");ws.onmessage=e=>{try{onMessage(JSON.parse(e.data))}catch{}};return ws}

export const registerDevice=body=>request("/api/chat/devices/register",{method:"POST",body:JSON.stringify(body)});
export const listDevices=()=>request("/api/chat/devices/list");
export const saveRoomKey=(roomId,body)=>request("/api/chat/rooms/"+encodeURIComponent(roomId)+"/keys",{method:"POST",body:JSON.stringify(body)});
export const getRoomKeys=roomId=>request("/api/chat/rooms/"+encodeURIComponent(roomId)+"/keys");

export const inviteToRoom=(room,email)=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/invite",{method:"POST",body:JSON.stringify({email})});
export const acceptInvite=inviteId=>request("/api/chat/rooms/invites/accept",{method:"POST",body:JSON.stringify({inviteId})});
