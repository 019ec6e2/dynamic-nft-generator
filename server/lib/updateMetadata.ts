import {
  generateSigner,
  publicKey,
  signerIdentity,
  createSignerFromKeypair,
  signerPayer,
  utf8,
} from "@metaplex-foundation/umi";
import {
  update,
  fetchAsset,
  fetchCollection,
  mplCore,
  updateV2,
} from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import bs58 from "bs58";
import dotenv from "dotenv";

import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

// Initialize UMI with RPC endpoint
const RPC_ENDPOINT = process.env.SOLANA_RPC_URL;

export async function initializeUmi() {
  const umi = createUmi(RPC_ENDPOINT!);
  umi.use(mplCore());

  // Set up signer from private key
  const pk = process.env.SOLANA_PRIVATE_KEY!;
  const secretKey = bs58.decode(pk);
  const myKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const myKeypairSigner = createSignerFromKeypair(umi, myKeypair);
  umi.use(signerIdentity(myKeypairSigner));

  return { umi, signer: myKeypairSigner };
}

export interface UpdateMetadataParams {
  assetId: string;
  newUri?: string;
  newName?: string;
}

export async function updateNFTMetadata({
  assetId,
  newUri,
  newName,
}: UpdateMetadataParams) {
  console.log("Updating metadata");
  console.log("Asset ID:", assetId);
  console.log("New URI:", newUri);
  const collectionId = process.env.SOLANA_COLLECTION_ID;

  try {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { umi, signer } = await initializeUmi();

    // Convert string to PublicKey
    const assetPublicKey = publicKey(assetId);

    console.log(`Fetching asset ${assetId}...`);
    const asset = await fetchAsset(umi, assetPublicKey);

    const metadataRequest = await fetch(asset?.uri);
    const md = await metadataRequest.json();

    md["image"] = newUri;
    md["properties"]["files"][0]["uri"] = newUri;

    const fileName = `${uuidv4()}.json`;
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(fileName, Buffer.from(JSON.stringify(md)), {
        contentType: "application/json",
        upsert: false,
      });

    console.log(data);
    if (error) {
      throw error;
    }
    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(fileName);

    // Fetch collection if provided
    let collection;
    if (collectionId) {
      console.log(`Fetching collection ${collectionId}...`);
      collection = await fetchCollection(umi, publicKey(collectionId));
    }

    // Prepare update parameters
    const updateParams: any = {
      asset,
      authority: signer,
    };

    if (collection) {
      updateParams.collection = collection;
    }
    if (publicUrl) {
      updateParams.uri = publicUrl;
    }
    if (newName) {
      updateParams.name = newName;
    }

    // Update the asset
    console.log("Updating asset metadata...");
    const tx = await update(umi, updateParams).sendAndConfirm(umi);

    console.log("Metadata update successful:", tx);
    return { success: true, transaction: tx };
  } catch (error) {
    console.error("Failed to update NFT metadata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
