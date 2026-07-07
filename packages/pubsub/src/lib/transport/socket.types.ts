import type { Server as HttpServer } from 'node:http';
import type { Socket } from 'socket.io';
import type { AccessTokenPayload } from '@inithium/types';
import type { PubSub } from '../core/create-pubsub.js';

export type ChannelAuthorizer = (
  user: AccessTokenPayload,
  channel: string,
) => boolean | Promise<boolean>;

export type SocketLifecycleHook = (socket: Socket, user: AccessTokenPayload) => void;
export type ChannelJoinedHook = (socket: Socket, user: AccessTokenPayload, channel: string) => void;
export type SocketHandlerRegistrar = (socket: Socket, user: AccessTokenPayload) => void;

export interface CreateSocketServerOptions {
  readonly httpServer: HttpServer;
  readonly pubsub: PubSub;
  readonly canJoinChannel: ChannelAuthorizer;
  readonly corsOrigins: readonly string[];
  readonly onConnect?: SocketLifecycleHook;
  readonly onDisconnect?: SocketLifecycleHook;
  readonly onChannelJoined?: ChannelJoinedHook;
  readonly registerSocketHandlers?: SocketHandlerRegistrar;
}