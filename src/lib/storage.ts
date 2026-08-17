import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

export const BUCKET_NAME = process.env.MINIO_BUCKET || "trackops";

const minioEndpoint = process.env.MINIO_ENDPOINT || "localhost";
const minioPort = process.env.MINIO_PORT || "9002";
const useSSL = process.env.MINIO_USE_SSL === "true";

export const s3Client = new S3Client({
  endpoint:
    process.env.NODE_ENV === "production" && process.env.S3_ENDPOINT
      ? process.env.S3_ENDPOINT
      : `${useSSL ? "https" : "http"}://${minioEndpoint}:${minioPort}`,
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId:
      process.env.MINIO_ACCESS_KEY ||
      process.env.MINIO_ROOT_USER ||
      "minioadmin",
    secretAccessKey:
      process.env.MINIO_SECRET_KEY ||
      process.env.MINIO_ROOT_PASSWORD ||
      "minioadmin",
  },
  forcePathStyle: true,
});

let bucketChecked = false;
export async function ensureBucketExists(): Promise<void> {
  if (bucketChecked) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    bucketChecked = true;
  } catch {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      bucketChecked = true;
    } catch (e) {
      console.warn("Could not create bucket (it may already exist):", e);
    }
  }
}

export function getStorageKey(
  empresaId: number,
  vehicleId: number,
  originalName: string
): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return `empresa_${empresaId}/vehiculos/vehiculo_${vehicleId}/${uniqueId}.${ext}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIconType(
  mimeType: string,
  fileName: string
): "pdf" | "image" | "word" | "excel" | "file" {
  const lowerName = fileName.toLowerCase();
  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) return "pdf";
  if (
    mimeType.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(lowerName)
  )
    return "image";
  if (mimeType.includes("word") || /\.(doc|docx)$/i.test(lowerName))
    return "word";
  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    /\.(xls|xlsx|csv)$/i.test(lowerName)
  )
    return "excel";
  return "file";
}

export async function uploadVehicleDocument(params: {
  empresaId: number;
  vehicleId: number;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<{ fileKey: string; fileSize: number }> {
  await ensureBucketExists();
  const fileKey = getStorageKey(
    params.empresaId,
    params.vehicleId,
    params.fileName
  );
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: params.fileBuffer,
      ContentType: params.mimeType,
    })
  );
  return { fileKey, fileSize: params.fileBuffer.length };
}

export async function getDocumentStream(fileKey: string) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })
  );
  return {
    stream: response.Body,
    contentType: response.ContentType || "application/octet-stream",
    contentLength: response.ContentLength,
  };
}

export async function deleteVehicleDocument(fileKey: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    })
  );
}
