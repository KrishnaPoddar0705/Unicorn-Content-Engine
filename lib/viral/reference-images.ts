import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase/server";
import type { ReferenceImage } from "@/lib/supabase/types";

export const REFERENCE_IMAGES_BUCKET = "reference-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // Anthropic per-image limit
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function ensureBucket(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.createBucket(REFERENCE_IMAGES_BUCKET, {
    public: true,
  });
  // "already exists" is fine; anything else surfaces on upload anyway
  if (error && !/already exists/i.test(error.message)) {
    console.warn(`createBucket(${REFERENCE_IMAGES_BUCKET}): ${error.message}`);
  }
}

export async function uploadReferenceImage(params: {
  bytes: Buffer;
  mimeType: string;
  filename: string;
  notes?: string;
}): Promise<ReferenceImage> {
  const { bytes, mimeType, filename, notes } = params;
  if (!ALLOWED_MIME.includes(mimeType)) {
    throw new Error(`Unsupported image type: ${mimeType}. Use JPEG, PNG, WebP, or GIF.`);
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image too large (${Math.round(bytes.length / 1024 / 1024)}MB). Max 5MB.`);
  }

  await ensureBucket();
  const supabase = getSupabase();
  const path = `${randomUUID()}.${EXT_BY_MIME[mimeType]}`;

  const { error: uploadError } = await supabase.storage
    .from(REFERENCE_IMAGES_BUCKET)
    .upload(path, bytes, { contentType: mimeType });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from(REFERENCE_IMAGES_BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("reference_images")
    .insert({
      filename,
      mime_type: mimeType,
      storage_path: path,
      public_url: urlData.publicUrl,
      notes: notes || null,
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Failed to save reference image: ${error?.message}`);
  return data as ReferenceImage;
}

export async function downloadReferenceImageBase64(
  referenceImageId: string
): Promise<{ dataBase64: string; mimeType: string; image: ReferenceImage }> {
  const supabase = getSupabase();
  const { data: image, error } = await supabase
    .from("reference_images")
    .select("*")
    .eq("id", referenceImageId)
    .single();
  if (error || !image) throw new Error(`Reference image not found: ${referenceImageId}`);

  const { data: blob, error: dlError } = await supabase.storage
    .from(REFERENCE_IMAGES_BUCKET)
    .download(image.storage_path);
  if (dlError || !blob) throw new Error(`Failed to download image: ${dlError?.message}`);

  const buffer = Buffer.from(await blob.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds the 5MB vision limit");
  }
  return {
    dataBase64: buffer.toString("base64"),
    mimeType: image.mime_type,
    image: image as ReferenceImage,
  };
}
