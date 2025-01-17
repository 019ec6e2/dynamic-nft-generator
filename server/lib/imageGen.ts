import { Client } from "@gradio/client";
import fetch from "node-fetch";
import { uploadImage } from "./uploadImage";

// Helper function to generate images using Gradio API
export async function generateImage(
  prompt: string
): Promise<Buffer | undefined> {
  console.log(`Attempting to generate image with prompt: "${prompt}"...`);

  try {
    // Get the test image first
    const response = await fetch(
      "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png"
    );
    const controlImage = await response.blob();
    const HF_API_KEY = process.env.HF_API_KEY;
    console.log("Control image loaded successfully");

    // Generate random controlnet_conditioning_scale between 0.9 and 1.2
    const controlnetScale = 0.9 + Math.random() * 0.3;

    // Connect to the Gradio client
    const client = await Client.connect("AP123/IllusionDiffusion", {
      hf_token: HF_API_KEY! as any,
    });
    console.log("Connected to Gradio API");

    const result = await client.predict("/inference_1", {
      control_image: {
        path: process.env.ALPHA_IMAGE_PATH,
        url: process.env.ALPHA_IMAGE_PATH,
        orig_name: "ca_alpha.png",
        mime_type: "image/png",
        meta: { _type: "gradio.FileData" },
      },
      prompt: prompt,
      negative_prompt: "low quality",
      guidance_scale: 7.5,
      controlnet_conditioning_scale: controlnetScale,
      control_guidance_start: 0,
      control_guidance_end: 1,
      upscaler_strength: 1,
      seed: -1,
      sampler: "Euler",
    });

    console.log("Generation completed successfully");

    const imageUrl = (result as { data: [{ url: string }] })?.data[0].url;

    if (!imageUrl) {
      throw new Error("No image URL found in the result");
    }

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(imageBuffer);
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined;
  }
}

export async function generateAndUploadImage(prompt: string) {
  const imageBuffer = await generateImage(prompt);
  if (!imageBuffer) {
    throw new Error("Failed to generate image");
  }
  const imagePath = await uploadImage(imageBuffer);
  return imagePath;
}
