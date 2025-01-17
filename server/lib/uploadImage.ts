import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImage(imageBuffer: Buffer) {
  try {
    // Upload to Supabase Storage
    const fileName = `${uuidv4()}.png`;
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    console.log("Image uploaded successfully:", data.path);
    return data.path;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
}
