import { ChatRoom } from "./functions/chat-room";

export { ChatRoom };

export default {
  fetch() {
    return new Response("secure-chat-room");
  },
};
