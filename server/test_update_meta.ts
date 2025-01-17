import { updateNFTMetadata } from "./lib/updateMetadata";
import { generateAndUploadImage } from "./lib/imageGen";
import dotenv from "dotenv";
import { getRandomPrompt } from "./lib/promptManager";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

async function testUpdateMeta(assetId: string) {
  try {
    // First generate and upload an image
    const prompt = await getRandomPrompt();
    const imagePath = await generateAndUploadImage(prompt);

    console.log("Image path for metadata:", imagePath);

    const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imagePath}`;

    // Update the metadata with the new image
    const result = await updateNFTMetadata({
      assetId,
      newUri: imageUrl,
    });

    console.log("Metadata updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error in testUpdateMeta:", error);
    throw error;
  }
}
