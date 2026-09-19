async function auth(context:any){const c=context.request.headers.get("Cookie")||"";const t=c.match(/(?:^|;\s*)chat_session=([^;]+)/)?.[1];if(!t||!context.env.CHAT_SESSIONS)return null;const v=await context.env.CHAT_SESSIONS.get(t,"json");return v?.userId||v||null}
export class ChatRoom {
 state:any; constructor(state:any){this.state=state}
 async fetch(request:Request){const url=new URL(request.url);if(request.method==="GET"&&url.pathname.endsWith("/ws")){const pair=new WebSocketPair();this.state.acceptWebSocket(pair[1]);return new Response(null,{status:101,webSocket:pair[0]})}return new Response("Not found",{status:404})}
}
export default ChatRoom;