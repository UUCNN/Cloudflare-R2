type Client={ws:WebSocket,userId:string,roomId:string};
export class ChatRoom{
 state:any; env:any; clients=new Map<WebSocket,string>();
 constructor(state:any,env:any){this.state=state;this.env=env}
 async fetch(request:Request){
  const url=new URL(request.url);
  const secret=request.headers.get("x-chat-internal-secret");
  if(!this.env.CHAT_WS_INTERNAL_SECRET||secret!==this.env.CHAT_WS_INTERNAL_SECRET)return new Response("Forbidden",{status:403});
  if(request.method==="POST"&&url.pathname.endsWith("/internal/broadcast")){
   const body=await request.json().catch(()=>null);
   const msg=body?.message;
   if(body?.type!=="message"||!msg||typeof msg.roomId!=="string"||typeof msg.senderId!=="string"||typeof msg.ciphertext!=="string"||msg.ciphertext.length>2_000_000)return new Response("Invalid message",{status:400});
   if(msg.roomId!==url.searchParams.get("room")&&msg.roomId!==request.headers.get("x-chat-room"))return new Response("Invalid room",{status:400});
   const out=JSON.stringify({type:"message",message:msg});
   for(const [ws,uid] of this.clients.entries()){if(uid===msg.senderId)continue;try{ws.send(out)}catch{this.clients.delete(ws)}}
   return new Response("ok");
  }
  if(request.method!=="GET"||!url.pathname.endsWith("/ws"))return new Response("Not found",{status:404});
  const uid=request.headers.get("x-chat-user"),roomId=request.headers.get("x-chat-room");
  if(!uid||!roomId)return new Response("Unauthorized",{status:401});
  const pair=new WebSocketPair(),client=pair[1];
  this.state.acceptWebSocket(client);this.clients.set(client,uid);
  client.addEventListener("message",event=>{try{const body=JSON.parse(String(event.data));if(body?.type==="ping")client.send(JSON.stringify({type:"pong"}))}catch{}});
  client.addEventListener("close",()=>this.clients.delete(client));
  client.addEventListener("error",()=>this.clients.delete(client));
  return new Response(null,{status:101,webSocket:pair[0]});
 }
}
export default ChatRoom;
