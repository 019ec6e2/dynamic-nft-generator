import fetch from "node-fetch";
import { generateAndUploadImage } from "./imageGen";
import { getRandomPrompt } from "./promptManager";
import { HttpsProxyAgent } from "https-proxy-agent";
import { db } from "../../db";
import { nftTransactions } from "../../db/schema";
import { eq } from "drizzle-orm";
import { updateNFTMetadata } from "./updateMetadata";

interface Transaction {
  signature: string;
  mint: string;
  name: string;
  buyer: string;
  seller: string;
  amount: number;
  amountInLamports: number;
  currency: string;
  marketplace: string;
  type: string;
  blocktime: Date;
  image?: string;
  marketplacefee?: string;
  royaltyfee?: string;
  evolvedTx?: string;
}

// Keep track of processed signatures across intervals
const processedSignatures = new Set<string>();

/**
 * Fetches NFT transaction data from Sniper API and stores it in PostgreSQL
 */
export async function fetchAndStoreTransactions() {
  console.log("fetching transactions");
  const proxyUrl = process.env.PROXY_URL;
  const proxyAgent = new HttpsProxyAgent("http://" + proxyUrl);

  try {
    const response = await fetch(process.env.SNIPER_API_URL, {
      agent: proxyAgent,
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
    });

    if (!response.ok) {
      console.error("Failed to fetch from Sniper API:", response.statusText);
      return;
    }

    const contentType = response.headers.get("content-type");
    let data: any;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
      console.warn("Unexpected content type from API:", contentType);
      return;
    }

    // Filter out duplicates both from current batch and previously processed transactions
    const uniqueActivities = [];
    if (data.activities && Array.isArray(data.activities)) {
      for (const activity of data.activities) {
        if (!processedSignatures.has(activity.signature)) {
          uniqueActivities.push(activity);
        } else {
          continue;
        }
      }
    }

    // Process filtered transactions sequentially to avoid race conditions
    for (const item of uniqueActivities) {
      try {
        // Check if transaction exists in database
        const existingTransaction = await db.query.nftTransactions.findFirst({
          where: eq(nftTransactions.signature, item.signature),
        });

        if (!existingTransaction) {
          console.log(`Processing new transaction ${item.signature}`);

          try {
            // Generate a unique prompt based on transaction data
            const prompt = await getRandomPrompt();
            let imageUrl: string | undefined;

            try {
              const imagePath = await generateAndUploadImage(prompt);
              imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imagePath}`;

              if (!!imageUrl && !!imagePath) {
                await updateNFTMetadata({
                  assetId: item.mint,
                  newUri: imageUrl,
                });
              }
            } catch (error) {
              console.error("Error generating image:", error);
              // Continue without image if generation fails
            }

            // Insert new transaction
            await db.insert(nftTransactions).values({
              signature: item.signature,
              mint: item.mint,
              name: item.name,
              buyer: item.buyer,
              seller: item.seller,
              amount: item.amount.toString(), // Convert to string as per schema
              amountInLamports: item.amountInLamports.toString(), // Convert to string as per schema
              currency: item.currency,
              marketplace: item.marketplace,
              type: item.type,
              blocktime: new Date(item.blocktime),
              image: imageUrl,
              marketplacefee: item.marketplacefee,
              royaltyfee: item.royaltyfee,
              evolvedTx: null, // Initialize evolvedTx as null for new transactions
            });

            // Add to processed signatures only after successful insertion
            processedSignatures.add(item.signature);
            console.log(`Stored new transaction: ${item.signature} with image`);
          } catch (error) {
            if (error.code === "23505") {
              // Unique constraint violation
              console.log(
                `Transaction ${item.signature} was inserted by another process, skipping`
              );
              processedSignatures.add(item.signature);
            } else {
              console.error(
                `Error processing transaction ${item.signature}:`,
                error
              );
            }
          }
        } else {
          processedSignatures.add(item.signature);
        }
      } catch (error) {
        console.error(`Error checking transaction ${item.signature}:`, error);
      }
    }
  } catch (error) {
    console.error("\n=== Periodic URL Check Error ===");
    console.error(`Time: ${new Date().toLocaleString()}`);
    console.error(
      "Error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Starts periodic fetching of NFT transactions
 * @param interval - Interval in milliseconds (default: 60000ms / 1 minute)
 */
export function startPeriodicFetching(interval: number = 60000) {
  // Clear the processed signatures set on restart
  processedSignatures.clear();

  // Fetch immediately on start
  fetchAndStoreTransactions();

  // Then set up periodic fetching
  const timer = setInterval(fetchAndStoreTransactions, interval);
  console.log(`Started periodic URL check service (interval: ${interval}ms)`);

  return timer;
}
