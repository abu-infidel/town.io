import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./env";
import { initRealtime } from "./realtime/socket";

const app = createApp();
const httpServer = createServer(app);

initRealtime(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`[api] listening on :${env.PORT} (${env.NODE_ENV})`);
});
