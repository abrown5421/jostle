# messaging

Transport-agnostic, functional pub/sub abstraction for real-time messaging (presence, social notifications, multi-device game sessions). Protocol adapters (Socket.io, WebSocket, Redis, ...) plug in by implementing the `Transport` interface; nothing above that boundary knows or cares which one is in use.

See `src/examples` for end-to-end usage: defining a transport, composing an authorization/transform middleware pipeline, and registering typed handlers per channel topic.
