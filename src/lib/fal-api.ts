const FAL_API_KEY = "13fe9b5c-2e15-4e69-9cf0-d07ebff933ac:b4a976faa9a01bb5d0ce0b5602c93535";

export type ModelType = "seedream" | "seedream-v5-lite-edit" | "gpt-image-2" | "gpt-image-2-edit" | "nano-banana" | "nano-banana-pro" | "nano-banana-2" | "wan-25" | "z-image";

export interface GenerateImageParams {
  prompt: string;
  model: ModelType;
  images?: string[];
}

export interface EditImageParams {
  prompt: string;
  images: string[];
  model: ModelType;
}

export type VideoModelType = "wan-25" | "wan-26" | "wan-27" | "seedance";

export interface GenerateVideoParams {
  prompt: string;
  image: string;
  duration: number;
  videoModel: VideoModelType;
  aspectRatio?: string;
}

const getModelUrl = (model: ModelType, isEdit: boolean): string => {
  if (model === "seedream") {
    return isEdit 
      ? "https://queue.fal.run/fal-ai/bytedance/seedream/v4.5/edit"
      : "https://queue.fal.run/fal-ai/bytedance/seedream/v4.5/text-to-image";
  } else if (model === "seedream-v5-lite-edit") {
    return "https://queue.fal.run/fal-ai/bytedance/seedream/v5/lite/edit";
  } else if (model === "gpt-image-2-edit") {
    return "https://queue.fal.run/openai/gpt-image-2/edit";
  } else if (model === "gpt-image-2") {
    return "https://queue.fal.run/openai/gpt-image-2";
  } else if (model === "wan-25") {
    return "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video";
  } else if (model === "z-image") {
    return isEdit
      ? "https://queue.fal.run/fal-ai/z-image/turbo/image-to-image"
      : "https://queue.fal.run/fal-ai/z-image/turbo";
  } else if (model === "nano-banana-pro") {
    return isEdit
      ? "https://queue.fal.run/fal-ai/nano-banana-pro"
      : "https://queue.fal.run/fal-ai/nano-banana-pro";
  } else if (model === "nano-banana-2") {
    return isEdit
      ? "https://queue.fal.run/fal-ai/nano-banana-2/edit"
      : "https://queue.fal.run/fal-ai/nano-banana-2";
  } else {
    return isEdit
      ? "https://queue.fal.run/fal-ai/nano-banana/edit"
      : "https://queue.fal.run/fal-ai/nano-banana";
  }
};

interface FalQueueSubmission {
  request_id: string;
  status_url?: string;
  response_url?: string;
}

const submitRequest = async (url: string, payload: any): Promise<FalQueueSubmission> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail?.[0]?.msg || data.detail || data.message || `API request failed: ${response.statusText}`);
  }

  return data;
};

const getBasePath = (model: ModelType, isEdit: boolean): string => {
  return getModelUrl(model, isEdit).replace("https://queue.fal.run/", "");
};
const dataUrlToBlob = (dataUrl: string): { blob: Blob; contentType: string; ext: string } => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL");
  const contentType = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const extMap: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
  const ext = extMap[contentType] || "png";
  return { blob: new Blob([bytes], { type: contentType }), contentType, ext };
};

const uploadToFalStorage = async (dataUrl: string): Promise<string> => {
  // already a URL
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const { blob, contentType, ext } = dataUrlToBlob(dataUrl);
  const file_name = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const initRes = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate", {
    method: "POST",
    headers: { "Authorization": `Key ${FAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ file_name, content_type: contentType }),
  });
  if (!initRes.ok) throw new Error(`Storage initiate failed: ${initRes.statusText} ${await initRes.text().catch(() => "")}`);
  const { upload_url, file_url } = await initRes.json();
  const putRes = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": contentType }, body: blob });
  if (!putRes.ok) throw new Error(`Storage upload failed: ${putRes.statusText}`);
  return file_url;
};

const uploadImages = async (images: string[]): Promise<string[]> => {
  return Promise.all(images.map(uploadToFalStorage));
};


const getStatusUrl = (model: ModelType, requestId: string, isEdit: boolean): string => {
  return `https://queue.fal.run/${getBasePath(model, isEdit)}/requests/${requestId}/status`;
};

const getResultUrl = (model: ModelType, requestId: string, isEdit: boolean): string => {
  return `https://queue.fal.run/${getBasePath(model, isEdit)}/requests/${requestId}`;
};

const pollResult = async (model: ModelType, requestId: string, isEdit: boolean, queueStatusUrl?: string, queueResponseUrl?: string): Promise<string> => {
  const statusUrl = queueStatusUrl || getStatusUrl(model, requestId, isEdit);
  
  while (true) {
    const response = await fetch(statusUrl, {
      headers: {
        "Authorization": `Key ${FAL_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const status = await response.json();

    if (status.status === "COMPLETED") {
      return queueResponseUrl || getResultUrl(model, requestId, isEdit);
    } else if (status.status === "FAILED") {
      throw new Error(status.error?.message || status.error || "Generation failed");
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

const fetchResult = async (resultUrl: string, isVideo: boolean = false): Promise<string> => {
  const response = await fetch(resultUrl, {
    headers: {
      "Authorization": `Key ${FAL_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Result fetch failed: ${response.statusText}`);
  }

  const result = await response.json();
  return isVideo ? result.video?.url : (result.images?.[0]?.url || result.image?.url);
};

export const generateImage = async ({ prompt, model, images = [] }: GenerateImageParams): Promise<string> => {
  const url = getModelUrl(model, false);
  const payload: any = { prompt };
  
  if (model === "z-image") {
    payload.enable_safety_checker = false;
  } else if (model === "gpt-image-2") {
    payload.image_size = "landscape_4_3";
    payload.quality = "high";
    payload.num_images = 1;
    payload.output_format = "png";
  } else if (model === "nano-banana-pro") {
    payload.enable_web_search = true;
  } else if (model === "nano-banana-2") {
    payload.safety_tolerance = "6";
    payload.enable_web_search = true;
  } else if (model === "seedream" || model === "seedream-v5-lite-edit") {
    payload.enable_safety_checker = false;
  }
  
  const request = await submitRequest(url, payload);
  const resultUrl = await pollResult(model, request.request_id, false, request.status_url, request.response_url);
  return await fetchResult(resultUrl);
};

export const editImage = async ({ prompt, images, model }: EditImageParams): Promise<string> => {
  const url = getModelUrl(model, true);
  const payload: any = { prompt };

  const uploadedImages = await uploadImages(images);

  if (model === "z-image") {
    // z-image only accepts a single image via image_url
    payload.image_url = uploadedImages[0];
    payload.enable_safety_checker = false;
  } else if (model === "gpt-image-2-edit") {
    payload.image_urls = uploadedImages;
    payload.image_size = "auto";
    payload.quality = "high";
    payload.num_images = 1;
    payload.output_format = "png";
  } else if (model === "nano-banana-2") {
    payload.image_urls = uploadedImages;
    payload.safety_tolerance = "6";
    payload.enable_web_search = true;
  } else if (model === "seedream" || model === "seedream-v5-lite-edit") {
    payload.image_urls = uploadedImages;
    payload.enable_safety_checker = false;
  } else {
    payload.image_urls = uploadedImages;
  }

  
  const request = await submitRequest(url, payload);
  const resultUrl = await pollResult(model, request.request_id, true, request.status_url, request.response_url);
  return await fetchResult(resultUrl);
};

export const generateVideo = async ({ prompt, image, duration, videoModel, aspectRatio }: GenerateVideoParams): Promise<string> => {
  const url = videoModel === "seedance"
    ? "https://queue.fal.run/fal-ai/bytedance/seedance/v1.5/pro/image-to-video"
    : videoModel === "wan-27"
    ? "https://queue.fal.run/fal-ai/wan/v2.7/image-to-video"
    : videoModel === "wan-26"
    ? "https://queue.fal.run/wan/v2.6/reference-to-video/flash"
    : "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video";

  image = await uploadToFalStorage(image);

  let payload: any;

  if (videoModel === "wan-26") {
    payload = {
      prompt,
      image_urls: [image],
      enable_safety_checker: false,
      resolution: "720p",
      duration,
      ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
    };
  } else if (videoModel === "wan-27") {
    payload = {
      prompt,
      image_url: image,
      enable_safety_checker: false,
      resolution: "1080p",
      duration,
    };
  } else {
    payload = {
      prompt,
      image_url: image,
      enable_safety_checker: false,
      resolution: "480p",
      duration,
    };
  }

  if (videoModel === "seedance" && aspectRatio) {
    payload.aspect_ratio = aspectRatio;
  }
  
  const request = await submitRequest(url, payload);
  const requestId = request.request_id;
  
  if (videoModel === "seedance") {
    const statusUrl = `https://queue.fal.run/fal-ai/bytedance/requests/${requestId}/status`;
    const resultUrlBase = `https://queue.fal.run/fal-ai/bytedance/requests/${requestId}`;
    while (true) {
      const response = await fetch(statusUrl, {
        headers: { "Authorization": `Key ${FAL_API_KEY}` },
      });
      if (!response.ok) throw new Error(`Status check failed: ${response.statusText}`);
      const status = await response.json();
      if (status.status === "COMPLETED") return await fetchResult(resultUrlBase, true);
      else if (status.status === "FAILED") throw new Error("Generation failed");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (videoModel === "wan-26") {
    const statusUrl = `https://queue.fal.run/wan/v2.6/requests/${requestId}/status`;
    const resultUrlBase = `https://queue.fal.run/wan/v2.6/requests/${requestId}`;
    while (true) {
      const response = await fetch(statusUrl, {
        headers: { "Authorization": `Key ${FAL_API_KEY}` },
      });
      if (!response.ok) throw new Error(`Status check failed: ${response.statusText}`);
      const status = await response.json();
      if (status.status === "COMPLETED") return await fetchResult(resultUrlBase, true);
      else if (status.status === "FAILED") throw new Error("Generation failed");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (videoModel === "wan-27") {
    const statusUrl = request.status_url || `https://queue.fal.run/fal-ai/wan/v2.7/requests/${requestId}/status`;
    const resultUrlBase = request.response_url || `https://queue.fal.run/fal-ai/wan/v2.7/requests/${requestId}`;
    while (true) {
      const response = await fetch(statusUrl, {
        headers: { "Authorization": `Key ${FAL_API_KEY}` },
      });
      if (!response.ok) throw new Error(`Status check failed: ${response.statusText}`);
      const status = await response.json();
      if (status.status === "COMPLETED") return await fetchResult(resultUrlBase, true);
      else if (status.status === "FAILED") throw new Error(status.error?.message || status.error || "Generation failed");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const resultUrl = await pollResult("wan-25", requestId, false);
  return await fetchResult(resultUrl, true);
};
