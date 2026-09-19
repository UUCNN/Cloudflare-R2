type Client={ws:WebSocket,userId:string,roomId:string};
export class ChatRoom{
 state:any; clients=new Map<WebSocket,string>();
 constructor(state:any){this.state=state}
 async fetch(request:Request){
  const url=new URL(request.url);
  if(request.method!=="GET"||!url.pathname.endsWith("/ws"))return new Response("Not found",{status:404});
  const uid=request.headers.get("x-chat-user");
  if(!uid)return new Response("Unauthorized",{status:401});
  const pair=new WebSocketPair();const client=pair[1];this.state.acceptWebSocket(client);this.clients.set(client,uid);
  client.addEventListener("message",event=>this.onMessage(client,event.data));
  client.addEventListener("close",()=>this.clients.delete(client));client.addEventListener("error",()=>this.clients.delete(client));
  return new Response(null,{status:101,webSocket:pair[0]});
 }
 onMessage(sender:WebSocket,data:any){
  let msg:any;try{msg=JSON.parse(typeof data==="string"?data:"")}catch{return}
  if(!msg||msg.type!=="message"||typeof msg.ciphertext!=="string")return;
  const out=JSON.stringify({type:"message",message:{...msg,senderId:this.clients.get(sender)||null}});
  for(const ws of this.clients.keys()){try{ws.send(out)}catch{}}
 }
}
export default ChatRoom;