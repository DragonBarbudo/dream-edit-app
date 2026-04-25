const FAL_API_KEY = "13fe9b5c-2e15-4e69-9cf0-d07ebff933ac:b4a976faa9a01bb5d0ce0b5602c93535";

export type ModelType = "seedream" | "seedream-v5-lite-edit" | "gpt-image-2-edit" | "nano-banana" | "nano-banana-pro" | "nano-banana-2" | "wan-25" | "z-image";

export interface GenerateImageParams {
  prompt: string;
  model: ModelType;
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
    return "https://queue.fal.run/fal-ai/nano-banana-2";
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

const getStatusUrl = (model: ModelType, requestId: string): string => {
  const basePath = model === "seedream" || model === "seedream-v5-lite-edit" 
    ? "fal-ai/bytedance" 
    : model === "wan-25"
    ? "fal-ai/wan-25-preview"
    : model === "z-image"
    ? "fal-ai/z-image"
    : model === "gpt-image-2-edit"
    ? "openai/gpt-image-2"
    : model === "nano-banana-pro"
    ? "fal-ai/nano-banana-pro"
    : model === "nano-banana-2"
    ? "fal-ai/nano-banana-2"
    : "fal-ai/nano-banana";
  return `https://queue.fal.run/${basePath}/requests/${requestId}/status`;
};

const getResultUrl = (model: ModelType, requestId: string): string => {
  const basePath = model === "seedream" || model === "seedream-v5-lite-edit" 
    ? "fal-ai/bytedance" 
    : model === "wan-25"
    ? "fal-ai/wan-25-preview"
    : model === "z-image"
    ? "fal-ai/z-image"
    : model === "gpt-image-2-edit"
    ? "openai/gpt-image-2"
    : model === "nano-banana-pro"
    ? "fal-ai/nano-banana-pro"
    : model === "nano-banana-2"
    ? "fal-ai/nano-banana-2"
    : "fal-ai/nano-banana";
  return `https://queue.fal.run/${basePath}/requests/${requestId}`;
};

const pollResult = async (model: ModelType, requestId: string, queueStatusUrl?: string): Promise<string> => {
  const statusUrl = queueStatusUrl || getStatusUrl(model, requestId);
  
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
      return getResultUrl(model, requestId);
    } else if (status.status === "FAILED") {
      throw new Error("Generation failed");
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

export const generateImage = async ({ prompt, model }: GenerateImageParams): Promise<string> => {
  const url = getModelUrl(model, false);
  const payload: any = { prompt };
  
  if (model === "z-image") {
    payload.enable_safety_checker = false;
  } else if (model === "nano-banana-pro") {
    payload.enable_web_search = true;
  } else if (model === "nano-banana-2") {
    payload.safety_tolerance = "6";
    payload.enable_web_search = true;
  }
  
  const requestId = await submitRequest(url, payload);
  const resultUrl = await pollResult(model, requestId);
  return await fetchResult(resultUrl);
};

export const editImage = async ({ prompt, images, model }: EditImageParams): Promise<string> => {
  const url = getModelUrl(model, true);
  const payload: any = { prompt };
  
  if (model === "z-image") {
    // z-image only accepts a single image via image_url
    payload.image_url = images[0];
    payload.enable_safety_checker = false;
  } else if (model === "gpt-image-2-edit") {
    payload.image_urls = images;
    payload.image_size = "auto";
    payload.quality = "high";
    payload.num_images = 1;
    payload.output_format = "png";
  } else if (model === "nano-banana-pro") {
    payload.image_urls = images;
    payload.enable_web_search = true;
  } else {
    payload.image_urls = images;
    if (model === "seedream" || model === "seedream-v5-lite-edit") {
      payload.enable_safety_checker = false;
    }
  }
  
  const requestId = await submitRequest(url, payload);
  const resultUrl = await pollResult(model, requestId);
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
  
  const requestId = await submitRequest(url, payload);
  
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
    const statusUrl = `https://queue.fal.run/fal-ai/wan/v2.7/requests/${requestId}/status`;
    const resultUrlBase = `https://queue.fal.run/fal-ai/wan/v2.7/requests/${requestId}`;
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

  const resultUrl = await pollResult("wan-25", requestId);
  return await fetchResult(resultUrl, true);
};
