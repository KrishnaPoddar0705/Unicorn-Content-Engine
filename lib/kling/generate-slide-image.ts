import { createKlingJwt } from "./auth";
import { fitPromptForKling } from "./prompt-limit";
import { loadKlingReferenceImage } from "./reference-image";

export interface GenerateSlideImageResult {
  imageUrl: string;
  thumbnailUrl?: string;
  jobId: string;
}

const BASE_URL = (process.env.KLING_API_BASE_URL || "https://api.klingai.com/v1").replace(
  /\/$/,
  ""
);

const MAX_POLL_TIME_MS = 300_000;
const POLL_INTERVAL_MS = 3_000;

const TEXT_TO_IMAGE_MODEL = process.env.KLING_IMAGE_MODEL || "kling-v1";
const IMAGE_TO_IMAGE_MODEL = process.env.KLING_IMAGE_MODEL_WITH_REF || "kling-v1-5";

interface KlingApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
}

interface KlingTaskData {
  task_id: string;
  task_status: string;
  task_status_msg?: string;
  task_result?: {
    images?: Array<{ url?: string; index?: number }>;
  };
}

async function klingRequest<T>(
  path: string,
  init?: RequestInit
): Promise<KlingApiResponse<T>> {
  const token = createKlingJwt();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  const json = (await response.json()) as KlingApiResponse<T>;

  if (!response.ok) {
    throw new Error(json.message || `Kling API error (${response.status})`);
  }

  return json;
}

function extractImageUrl(task: KlingTaskData): string | undefined {
  return task.task_result?.images?.find((image) => image.url)?.url;
}

async function waitForTask(taskId: string): Promise<KlingTaskData> {
  const deadline = Date.now() + MAX_POLL_TIME_MS;

  while (Date.now() < deadline) {
    const result = await klingRequest<KlingTaskData>(`/images/generations/${taskId}`, {
      method: "GET",
    });

    if (result.code !== 0) {
      throw new Error(result.message || "Failed to check Kling task status");
    }

    const task = result.data;
    if (!task) {
      throw new Error("Kling task status response was empty");
    }

    if (task.task_status === "succeed") {
      return task;
    }

    if (task.task_status === "failed") {
      throw new Error(task.task_status_msg || "Kling image generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Kling image generation timed out");
}

export async function generateSlideImage(params: {
  prompt: string;
  referenceImageUrl?: string;
  seed?: number;
  aspectRatio?: "9:16" | "16:9" | "1:1";
}): Promise<GenerateSlideImageResult> {
  const prompt = fitPromptForKling(params.prompt);

  let referenceImage: string | undefined;
  if (params.referenceImageUrl) {
    try {
      referenceImage = await loadKlingReferenceImage(params.referenceImageUrl);
    } catch {
      // Reference images are optional — fall back to text-to-image.
      referenceImage = undefined;
    }
  }

  const useReference = Boolean(referenceImage);
  const body: Record<string, unknown> = {
    model_name: useReference ? IMAGE_TO_IMAGE_MODEL : TEXT_TO_IMAGE_MODEL,
    prompt,
    aspect_ratio: params.aspectRatio || "9:16",
    resolution: "1k",
    n: 1,
  };

  // image_reference is only valid with kling-v1-5+ when image is provided.
  if (useReference && referenceImage) {
    body.image = referenceImage;
    body.image_reference = "subject";
    body.image_fidelity = 0.6;
  }

  const createResult = await klingRequest<KlingTaskData>("/images/generations", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (createResult.code !== 0) {
    throw new Error(createResult.message || "Kling image generation request failed");
  }

  const taskId = createResult.data?.task_id;
  if (!taskId) {
    throw new Error("No task ID returned from Kling");
  }

  const completed = await waitForTask(taskId);
  const imageUrl = extractImageUrl(completed);

  if (!imageUrl) {
    throw new Error("No image URL returned from Kling");
  }

  return {
    imageUrl,
    thumbnailUrl: imageUrl,
    jobId: taskId,
  };
}

export { isKlingConfigured } from "./auth";
