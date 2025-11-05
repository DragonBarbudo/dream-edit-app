const FAL_API_KEY = "13fe9b5c-2e15-4e69-9cf0-d07ebff933ac:b4a976faa9a01bb5d0ce0b5602c93535";

export type ModelType = "seedream" | "nano-banana";

export interface GenerateImageParams {
  prompt: string;
  model: ModelType;
}

export interface EditImageParams {
  prompt: string;
  images: string[];
  model: ModelType;
}

const getModelUrl = (model: ModelType, isEdit: boolean): string => {
  if (model === "seedream") {
    return isEdit 
      ? "https://queue.fal.run/fal-ai/bytedance/seedream/v4/edit"
      : "https://queue.fal.run/fal-ai/bytedance/seedream/v4/text-to-image";
  } else {
    return isEdit
      ? "https://queue.fal.run/fal-ai/nano-banana/edit"
      : "https://queue.fal.run/fal-ai/nano-banana";
  }
};

const submitRequest = async (url: string, payload: any): Promise<string> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.request_id;
};

const pollResult = async (requestId: string): Promise<any> => {
  const statusUrl = `https://queue.fal.run/fal-ai/queue/requests/${requestId}/status`;
  
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
      return status.response_url;
    } else if (status.status === "FAILED") {
      throw new Error("Generation failed");
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }
};

const fetchResult = async (resultUrl: string): Promise<string> => {
  const response = await fetch(resultUrl, {
    headers: {
      "Authorization": `Key ${FAL_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Result fetch failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.images?.[0]?.url || result.image?.url;
};

export const generateImage = async ({ prompt, model }: GenerateImageParams): Promise<string> => {
  const url = getModelUrl(model, false);
  const payload = { prompt };
  
  const requestId = await submitRequest(url, payload);
  const resultUrl = await pollResult(requestId);
  return await fetchResult(resultUrl);
};

export const editImage = async ({ prompt, images, model }: EditImageParams): Promise<string> => {
  const url = getModelUrl(model, true);
  const payload = {
    prompt,
    image_url: images[0],
  };
  
  const requestId = await submitRequest(url, payload);
  const resultUrl = await pollResult(requestId);
  return await fetchResult(resultUrl);
};
