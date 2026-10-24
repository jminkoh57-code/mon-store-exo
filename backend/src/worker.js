import { UnrecoverableError, Worker } from "bullmq";
import { redisConnection } from "./redis.js";
import { ensureBucket, removeImage, saveImage } from "./storage.js";

await ensureBucket();

const worker = new Worker(
  "images",
  async (job) => {
    if (job.name === "upload") {
      try {
        return await saveImage(job.data.userId, {
          buffer: Buffer.from(job.data.buffer, "base64"),
          mimetype: job.data.mimetype,
        });
      } catch (error) {
        if (error.status === 400) {
          throw new UnrecoverableError(error.message);
        }

        throw error;
      }
    }

    if (job.name === "delete") {
      await removeImage(job.data.key);
      return true;
    }

    throw new UnrecoverableError(`Job inconnu : ${job.name}`);
  },
  { connection: redisConnection(), concurrency: 4 }
);

worker.on("completed", (job) => {
  console.log(`[worker] ${job.name} ${job.id} terminé`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] ${job?.name} ${job?.id} ${error.message}`);
});

console.log("Worker BullMQ à l'écoute de la file images");

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
