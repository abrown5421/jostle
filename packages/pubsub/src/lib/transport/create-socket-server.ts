import { Server, type Socket } from 'socket.io';
import { extractSocketUser } from './socket-auth.js';
import type { CreateSocketServerOptions } from './socket.types.js';
import type { ChannelMessage } from '../types/pubsub.types.js';
import type { AccessTokenPayload } from '@inithium/types';

export const createSocketServer = ({
  httpServer,
  pubsub,
  canJoinChannel,
  corsOrigins,
  onConnect,
  onDisconnect,
  onChannelJoined,
  registerSocketHandlers,
}: CreateSocketServerOptions): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: [...corsOrigins],
      credentials: true,
    },
  });

  const channelUnsubscribers = new Map<string, () => Promise<void>>();
  const channelRefCounts = new Map<string, number>();

  const ensureChannelBridge = async (channel: string) => {
    const currentCount = channelRefCounts.get(channel) ?? 0;
    channelRefCounts.set(channel, currentCount + 1);
    if (currentCount > 0) return;

    const unsubscribe = await pubsub.subscribe(channel, (message: ChannelMessage) => {
      io.to(message.channel).emit(message.event, message.payload);
    });

    channelUnsubscribers.set(channel, unsubscribe);
  };

  const releaseChannelBridge = async (channel: string) => {
    const currentCount = channelRefCounts.get(channel) ?? 0;
    if (currentCount <= 1) {
      channelRefCounts.delete(channel);
      const unsubscribe = channelUnsubscribers.get(channel);
      channelUnsubscribers.delete(channel);
      if (unsubscribe) await unsubscribe();
      return;
    }
    channelRefCounts.set(channel, currentCount - 1);
  };

  io.use((socket: Socket, next) => {
    const user = extractSocketUser(socket);
    if (!user) {
      next(new Error('Unauthorized'));
      return;
    }
    socket.data['user'] = user;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data['user'] as AccessTokenPayload;
    const joinedChannels = new Set<string>();

    onConnect?.(socket, user);
    registerSocketHandlers?.(socket, user);

    socket.on('channel:join', async (channel: string, ack?: (ok: boolean) => void) => {
      const authorized = await canJoinChannel(user, channel);
      if (!authorized) {
        ack?.(false);
        return;
      }

      await socket.join(channel);
      await ensureChannelBridge(channel);
      joinedChannels.add(channel);
      onChannelJoined?.(socket, user, channel);
      ack?.(true);
    });

    socket.on('channel:leave', async (channel: string) => {
      if (!joinedChannels.has(channel)) return;
      await socket.leave(channel);
      await releaseChannelBridge(channel);
      joinedChannels.delete(channel);
    });

    socket.on('disconnect', async () => {
      for (const channel of joinedChannels) {
        await releaseChannelBridge(channel);
      }
      joinedChannels.clear();
      onDisconnect?.(socket, user);
    });
  });

  return io;
};