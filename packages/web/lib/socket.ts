"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * DMs only need a live connection; everything else in the app is plain
 * request/response. In prod this connects same-origin through Caddy
 * (`/api/socket.io`, matching the Express mount under `/api`); in dev it
 * talks directly to the api dev server, since Next's rewrite proxy doesn't
 * reliably forward WebSocket upgrades.
 */
export function getSocket(): Socket {
  if (socket) return socket;
  const isDev = process.env.NODE_ENV === "development";
  socket = io(isDev ? "http://localhost:4000" : undefined, {
    path: isDev ? "/socket.io" : "/api/socket.io",
    withCredentials: true,
  });
  return socket;
}
