async function request(path,options={}){const r=await fetch(path,{credentials:"include",headers:{"content-type":"application/json",...(options.headers||{})},...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"请求失败");return d}
export const register=data=>request("/api/chat/auth/register",{method:"POST",body:JSON.stringify(data)});
export const login=data=>request("/api/chat/auth/login",{method:"POST",body:JSON.stringify(data)});
export const me=()=>request("/api/chat/auth/me");
export const createRoom=name=>request("/api/chat/rooms/create",{method:"POST",body:JSON.stringify({name})});
export const listRooms=()=>request("/api/chat/rooms/list");
export const listMessages=room=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/messages");
export const sendMessage=(room,data)=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/messages",{method:"POST",body:JSON.stringify(data)});
export const uploadMedia=(room,body,headers={})=>request("/api/chat/rooms/"+encodeURIComponent(room)+"/media",{method:"POST",body,headers});
