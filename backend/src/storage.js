import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const bucket = process.env.S3_BUCKET ?? "todo-images";
const publicBase = process.env.S3_PUBLIC_URL ?? "/storage";

const types = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3_ENDPOINT ?? "http://minio:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

function imageUrl(key) {
  if (!key) return null;
  return `${publicBase}/${key}`;
}

async function ensureBucket() {
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        if (error?.$metadata?.httpStatusCode !== 404) {
          throw error;
        }

        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      }

      await client.send(new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify(policy),
      }));

      return;
    } catch (error) {
      if (attempt === 30) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function saveImage(userId, file) {
  const extension = types[file.mimetype];

  if (!extension) {
    const error = new Error("Formats acceptés : JPEG, PNG, WebP, GIF.");
    error.status = 400;
    throw error;
  }

  const key = `${userId}/${randomUUID()}${extension}`;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return key;
}

async function removeImage(key) {
  if (!key) return;

  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
}

export { ensureBucket, imageUrl, removeImage, saveImage };
