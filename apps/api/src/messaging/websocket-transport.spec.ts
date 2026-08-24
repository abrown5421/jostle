import { WebSocket } from 'ws';
import { afterEach, describe, expect, it } from 'vitest';
import { createWebSocketServerTransport } from './websocket-transport.js';
import type { Transport } from '@jostle/messaging';

const TEST_PORT = 34599;
const TEST_URL = `ws://localhost:${TEST_PORT}`;

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', reject);
  });
}

function waitForMessage(socket: WebSocket): Promise<{ type: string; topic: string; payload: unknown }> {
  return new Promise((resolve) => {
    socket.once('message', (raw) => resolve(JSON.parse(String(raw))));
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('createWebSocketServerTransport', () => {
  let transport: Transport | undefined;
  const openSockets: WebSocket[] = [];

  afterEach(async () => {
    for (const socket of openSockets.splice(0)) socket.close();
    await transport?.close();
    transport = undefined;
  });

  it('delivers a published message to a client subscribed to that topic', async () => {
    transport = createWebSocketServerTransport({ port: TEST_PORT });
    await delay(100);

    const client = new WebSocket(TEST_URL);
    openSockets.push(client);
    await waitForOpen(client);

    client.send(JSON.stringify({ type: 'subscribe', topic: 'room:1' }));
    await delay(50);

    const received = waitForMessage(client);
    await transport.publish('room:1', { hello: 'world' });

    await expect(received).resolves.toEqual({ type: 'message', topic: 'room:1', payload: { hello: 'world' } });
  });

  it('does not deliver to a client subscribed to a different topic', async () => {
    transport = createWebSocketServerTransport({ port: TEST_PORT });
    await delay(100);

    const client = new WebSocket(TEST_URL);
    openSockets.push(client);
    await waitForOpen(client);
    client.send(JSON.stringify({ type: 'subscribe', topic: 'room:1' }));
    await delay(50);

    let messageReceived = false;
    client.once('message', () => {
      messageReceived = true;
    });

    await transport.publish('room:2', { hello: 'world' });
    await delay(50);

    expect(messageReceived).toBe(false);
  });

  it('stops delivering after unsubscribe', async () => {
    transport = createWebSocketServerTransport({ port: TEST_PORT });
    await delay(100);

    const client = new WebSocket(TEST_URL);
    openSockets.push(client);
    await waitForOpen(client);
    client.send(JSON.stringify({ type: 'subscribe', topic: 'room:1' }));
    await delay(50);
    client.send(JSON.stringify({ type: 'unsubscribe', topic: 'room:1' }));
    await delay(50);

    let messageReceived = false;
    client.once('message', () => {
      messageReceived = true;
    });

    await transport.publish('room:1', { hello: 'world' });
    await delay(50);

    expect(messageReceived).toBe(false);
  });

  it('stops delivering after the client disconnects', async () => {
    transport = createWebSocketServerTransport({ port: TEST_PORT });
    await delay(100);

    const client = new WebSocket(TEST_URL);
    await waitForOpen(client);
    client.send(JSON.stringify({ type: 'subscribe', topic: 'room:1' }));
    await delay(50);
    client.close();
    await delay(50);

    await expect(transport.publish('room:1', { hello: 'world' })).resolves.toBeUndefined();
  });

  it('relays a client-published message to a server-side subscriber', async () => {
    transport = createWebSocketServerTransport({ port: TEST_PORT });
    await delay(100);

    const received: unknown[] = [];
    transport.subscribe('room:1', (message) => {
      received.push(message.payload);
    });

    const client = new WebSocket(TEST_URL);
    openSockets.push(client);
    await waitForOpen(client);
    client.send(JSON.stringify({ type: 'publish', topic: 'room:1', payload: { from: 'client' } }));
    await delay(50);

    expect(received).toEqual([{ from: 'client' }]);
  });

  it('stops relaying to a server-side subscriber after it unsubscribes', async () => {
    transport = createWebSocketServerTransport({ port: TEST_PORT });
    await delay(100);

    const received: unknown[] = [];
    const unsubscribe = transport.subscribe('room:1', (message) => {
      received.push(message.payload);
    });
    unsubscribe();

    const client = new WebSocket(TEST_URL);
    openSockets.push(client);
    await waitForOpen(client);
    client.send(JSON.stringify({ type: 'publish', topic: 'room:1', payload: { from: 'client' } }));
    await delay(50);

    expect(received).toEqual([]);
  });
});
