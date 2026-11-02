import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { createContext } from "./context.js";
import { connectDb } from "./db.js";
import { appRouter } from "./router.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(
  morgan((tokens, req, res) => {
    return `[API] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} ${tokens["response-time"](req, res)} ms`;
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    maxBodySize: 4 * 1024 * 1024,
  }),
);

await connectDb();

const server = app.listen(port, () => {
  console.log(`API prête sur le port ${port}`);
});

async function shutdown() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
