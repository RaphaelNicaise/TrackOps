import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1", // MinIO default
  endpoint: process.env.MINIO_ENDPOINT ? `http://${process.env.MINIO_ENDPOINT}:9000` : "http://localhost:9002",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true, // Required for MinIO
});

export async function uploadFile(file: File, folder: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
  
  await s3Client.send(new PutObjectCommand({
    Bucket: "trackops", // Make sure to create this bucket in MinIO dashboard manually for local dev
    Key: filename,
    Body: buffer,
    ContentType: file.type,
  }));

  // Return the public URL or the object key
  // We return the path assuming the frontend can proxy it or access it via MINIO_ENDPOINT
  return `/${filename}`;
}
