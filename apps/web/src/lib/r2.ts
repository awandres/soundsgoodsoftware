import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 Client Configuration
 * 
 * R2 is S3-compatible but requires:
 * - region: "auto" (R2 handles region automatically)
 * - forcePathStyle: true (R2 doesn't support virtual-hosted style URLs)
 * - endpoint: https://<account_id>.r2.cloudflarestorage.com
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Generate a presigned URL for uploading a file directly to R2 from the browser
 * This is the recommended approach - browser uploads directly, no server bandwidth used
 */
export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: 3600, // URL expires in 1 hour
  });
}

/**
 * Get the public URL for a file
 * Requires public access to be enabled on the R2 bucket
 */
export function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  // Fallback - won't work if bucket is private
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
}

/**
 * Generate a unique file key for storage
 * Format: {orgId|users}/{category}/{uniqueId}-{timestamp}-{filename}
 */
export function generateFileKey(
  userId: string,
  organizationId: string | null,
  filename: string,
  category: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const prefix = organizationId ? `org-${organizationId}` : "users";
  
  return `${prefix}/${category}/${userId}-${timestamp}-${sanitizedFilename}`;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}
