# Socket.IO API

Real-time events for the Chaty backend. The HTTP REST API is documented separately at `/api-docs` (Swagger UI) once the server is running.

## Connection

- **URL**: same origin as the HTTP server (e.g. `http://localhost:3000`).
- **Transport**: default Socket.IO transports (websocket / polling).
- **Auth**: the connection is authenticated via the `accessToken` HTTP-only cookie set by `/auth/login`, `/auth/register`, or `/auth/refresh`. The server reads `socket.handshake.headers.cookie` and verifies the JWT — there is no header- or query-based fallback.
- **Failure**: connections without a valid `accessToken` cookie are rejected with `Error: No token provided`, `User not found`, or `Invalid token`.

### Mobile client notes

Most native Socket.IO clients can attach cookies but it is not always automatic. With the official `socket.io-client` you can set the `Cookie` header explicitly:

```ts
import { io } from "socket.io-client";

const socket = io("https://api.example.com", {
  withCredentials: true,
  extraHeaders: { Cookie: `accessToken=${accessToken}` },
});
```

The access token has a 15-minute lifetime. When it expires, call `POST /auth/refresh` to obtain a new one and reconnect.

## Rooms

On connection the server automatically joins the socket to:

- One room per conversation the user participates in (room name = `conversationId`).
- A personal room `user:<userId>` used for direct delivery (incoming calls, etc.).

You can also join additional rooms manually via the `joinConversation` event.

---

## Client → Server events

### `joinConversation`

Join an additional conversation room (e.g. after creating or being added to a new conversation without reconnecting).

```ts
socket.emit("joinConversation", conversationId: string);
```

No acknowledgement is emitted.

### `sendMessage`

Persist a message and broadcast it to every participant of the conversation. The message is created on the server and then re-emitted as `newMessage` to the conversation room.

```ts
socket.emit("sendMessage", {
  conversationId: string,
  content: string,
});
```

Errors are logged on the server but **not** returned to the client. If you need delivery confirmation, listen for the resulting `newMessage` event or send via the REST endpoint `POST /messages/:conversationId`.

### `call:offer`

Send a WebRTC SDP offer to another user. The server forwards it to that user's personal room and adds the caller's identity.

```ts
socket.emit("call:offer", {
  to: string,        // recipient userId
  offer: any,        // RTCSessionDescriptionInit
});
```

### `call:answer`

Reply to an incoming offer.

```ts
socket.emit("call:answer", {
  to: string,        // userId of the original caller
  answer: any,       // RTCSessionDescriptionInit
});
```

### `call:ice`

Trickle an ICE candidate to the other peer.

```ts
socket.emit("call:ice", {
  to: string,
  candidate: any,    // RTCIceCandidateInit
});
```

### `call:end`

Signal that the caller is hanging up.

```ts
socket.emit("call:end", { to: string });
```

---

## Server → Client events

### `newMessage`

Emitted to every member of `conversationId` whenever a message is created via `sendMessage`. The payload is the persisted message with `sender` populated (`username` only).

```ts
socket.on("newMessage", (message: {
  _id: string;
  conversationId: string;
  sender: { _id: string; username: string };
  content: string;
  read: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}) => { /* ... */ });
```

### `call:offer`

```ts
socket.on("call:offer", (data: {
  from: string;          // caller userId
  fromUsername: string;
  offer: any;            // RTCSessionDescriptionInit
}) => { /* ... */ });
```

### `call:answer`

```ts
socket.on("call:answer", (data: {
  from: string;
  answer: any;
}) => { /* ... */ });
```

### `call:ice`

```ts
socket.on("call:ice", (data: {
  from: string;
  candidate: any;
}) => { /* ... */ });
```

### `call:end`

```ts
socket.on("call:end", (data: { from: string }) => { /* ... */ });
```

---

## Lifecycle

- `connect` — fired once the handshake and JWT verification succeed.
- `disconnect` — fired when the client goes away. The server logs the username; no broadcast is emitted to other users.
