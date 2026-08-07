import { S3Client } from "@aws-sdk/client-s3";

const minioEndpoint = process.env.MINIO_ENDPOINT || "localhost";
const minioPort = process.env.MINIO_PORT || "9002";
const useSSL = process.env.MINIO_USE_SSL === "true";

export const s3Client = new S3Client({
  endpoint: process.env.NODE_ENV === "production" 
    ? process.env.S3_ENDPOINT 
    : `${useSSL ? "https" : "http"}://${minioEndpoint}:${minioPort}`,
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true, // Requerido para MinIO local
});
