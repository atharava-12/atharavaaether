import { supabase } from "@/integrations/supabase/client";

const BUCKET = "image-library";
const STORAGE_REFERENCE_PREFIX = "storage://image-library/";

export interface SaveImageGenerationInput {
  id: string;
  userId: string;
  conversationId: string | null;
  sessionId: string;
  prompt: string;
  modelId: string;
  provider: "nvidia" | "hf";
  generationType: "text-to-image" | "image-to-image" | "chat";
  imageDataUrl: string;
  originalImageDataUrl?: string | null;
  originalImagePath?: string | null;
  width?: number;
  height?: number;
  seed?: number;
}

export interface SavedImageGeneration {
  id: string;
  imagePath: string;
  originalImagePath: string | null;
  imageUrl: string;
  originalImageUrl: string | null;
}

export interface ImageGenerationHistoryItem {
  id: string;
  conversation_id: string | null;
  session_id: string;
  prompt: string;
  model_id: string;
  provider: "nvidia" | "hf";
  generation_type: "text-to-image" | "image-to-image" | "chat";
  image_path: string;
  original_image_path: string | null;
  mime_type: string;
  width: number | null;
  height: number | null;
  seed: number | null;
  created_at: string;
  imageUrl: string;
  originalImageUrl: string | null;
}

export const toImageStorageReference = (path: string) => `${STORAGE_REFERENCE_PREFIX}${path}`;

export const getImageStoragePath = (reference: string | null | undefined) =>
  reference?.startsWith(STORAGE_REFERENCE_PREFIX)
    ? reference.slice(STORAGE_REFERENCE_PREFIX.length)
    : null;

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error("Could not read the generated image.");
  const blob = await response.blob();
  if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type)) {
    throw new Error("The image format is not supported by the private image library.");
  }
  if (blob.size > 8 * 1024 * 1024) throw new Error("The generated image is larger than the 8 MB library limit.");
  return blob;
}

async function uploadPrivateImage(userId: string, sessionId: string, fileName: string, dataUrl: string) {
  const blob = await dataUrlToBlob(dataUrl);
  const extension = blob.type === "image/jpeg" ? "jpg" : blob.type.split("/")[1];
  const path = `${userId}/${sessionId}/${fileName}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  return { path, mimeType: blob.type };
}

export async function saveImageGeneration(input: SaveImageGenerationInput): Promise<SavedImageGeneration> {
  let imagePath: string | undefined;
  let originalImagePath: string | null = input.originalImagePath ?? null;
  try {
    const savedImage = await uploadPrivateImage(input.userId, input.sessionId, input.id, input.imageDataUrl);
    imagePath = savedImage.path;
    if (input.originalImageDataUrl && !originalImagePath) {
      const savedOriginal = await uploadPrivateImage(
        input.userId,
        input.sessionId,
        `original-${input.id}`,
        input.originalImageDataUrl,
      );
      originalImagePath = savedOriginal.path;
    }

    const { data: signedImage, error: signedImageError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(imagePath, 60 * 60);
    if (signedImageError || !signedImage) throw signedImageError ?? new Error("Could not create an image preview link.");

    let signedOriginalUrl: string | null = null;
    if (originalImagePath) {
      const { data: signedOriginal, error: signedOriginalError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(originalImagePath, 60 * 60);
      if (signedOriginalError || !signedOriginal) throw signedOriginalError ?? new Error("Could not create an original image preview link.");
      signedOriginalUrl = signedOriginal.signedUrl;
    }

    const { error: insertError } = await supabase.from("image_generations").insert({
      id: input.id,
      user_id: input.userId,
      conversation_id: input.conversationId,
      session_id: input.sessionId,
      prompt: input.prompt,
      model_id: input.modelId,
      provider: input.provider,
      generation_type: input.generationType,
      image_path: imagePath,
      original_image_path: originalImagePath,
      mime_type: savedImage.mimeType,
      width: input.width ?? null,
      height: input.height ?? null,
      seed: input.seed ?? null,
    });
    if (insertError) throw insertError;

    return {
      id: input.id,
      imagePath,
      originalImagePath,
      imageUrl: signedImage.signedUrl,
      originalImageUrl: signedOriginalUrl,
    };
  } catch (error) {
    const paths = [imagePath, originalImagePath].filter((path): path is string => Boolean(path));
    if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths).catch(() => undefined);
    throw error;
  }
}

export async function loadImageGenerations(userId: string): Promise<ImageGenerationHistoryItem[]> {
  const { data, error } = await supabase
    .from("image_generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  if (!data) return [];

  return Promise.all(data.map(async (generation) => {
    const { data: image, error: imageError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(generation.image_path, 60 * 60);
    const originalImage = generation.original_image_path
      ? await supabase.storage.from(BUCKET).createSignedUrl(generation.original_image_path, 60 * 60)
      : null;
    return {
      ...generation,
      imageUrl: imageError ? "" : image?.signedUrl ?? "",
      originalImageUrl: originalImage?.data?.signedUrl ?? null,
    };
  }));
}

export async function signImageStorageReference(reference: string): Promise<string | undefined> {
  const path = getImageStoragePath(reference);
  if (!path) return reference;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return error ? undefined : data?.signedUrl;
}