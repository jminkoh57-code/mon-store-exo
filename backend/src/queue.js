import { Queue, QueueEvents } from "bullmq";
import { redisConnection } from "./redis.js";

const imageQueue = new Queue("images", { connection: redisConnection() });
const imageEvents = new QueueEvents("images", { connection: redisConnection() });

for (const emitter of [imageQueue, imageEvents]) {
  emitter.on("error", (error) => {
    console.error(`[queue] ${error.message}`);
  });
}

function imageJobError(error) {
  const message = error?.message ?? "";

  if (message.includes("Formats acceptés")) {
    const wrapped = new Error(message);
    wrapped.status = 400;
    return wrapped;
  }

  const wrapped = new Error("Impossible d'enregistrer l'image.");
  wrapped.status = 500;
  return wrapped;
}

async function enqueueImageUpload(userId, file) {
  const job = await imageQueue.add(
    "upload",
    {
      userId: String(userId),
      buffer: file.buffer.toString("base64"),
      mimetype: file.mimetype,
    },
    {
      attempts: 1,
      removeOnComplete: 50,
      removeOnFail: 50,
    }
  );

  try {
    return await job.waitUntilFinished(imageEvents, 45_000);
  } catch (error) {
    throw imageJobError(error);
  }
}

async function enqueueImageDelete(key) {
  if (!key) return;

  await imageQueue.add(
    "delete",
    { key },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 50,
      removeOnFail: 50,
    }
  );
}

export { enqueueImageDelete, enqueueImageUpload, imageEvents, imageQueue };
