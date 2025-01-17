import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { generateAndUploadImage } from "./lib/imageGen";
import { updateNFTMetadata } from "./lib/updateMetadata";
import { startPeriodicFetching } from "./lib/periodicFetcher";
import { getRandomPrompt } from "./lib/promptManager";
import { db } from "../db";
import { nftTransactions } from "../db/schema";
import { desc, eq } from "drizzle-orm";

// Schema for NFT sale webhook payload validation
const nftSaleEventSchema = z.object({
  type: z.string(),
  events: z.object({
    nft: z.object({
      nfts: z.array(
        z.object({
          mint: z.string(),
          tokenStandard: z.string(),
        })
      ),
      amount: z.number(),
      buyer: z.string(),
      seller: z.string(),
      source: z.string(),
      description: z.string(),
      timestamp: z.number(),
      saleType: z.string(),
      signature: z.string(),
      slot: z.number(),
      type: z.string(),
    }),
  }),
});

// Enhanced logging function
function logWebhookEvent(requestId: string, eventType: string, data: any) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    requestId,
    eventType,
    ...data,
  };

  console.log("\n=== Webhook Event Log ===");
  console.log(JSON.stringify(logData, null, 2));
  console.log("========================\n");
}

export function registerRoutes(app: Express): Server {
  // Start periodic URL check
  const timer = startPeriodicFetching();
  console.log("Started periodic URL check service");

  // Fetch recent transactions endpoint
  app.get("/api/recent-transactions", async (req, res) => {
    try {
      const transactions = await db.query.nftTransactions.findMany({
        orderBy: [desc(nftTransactions.blocktime)],
        limit: 20,
      });

      res.json(
        transactions.map((tx) => ({
          transaction_id: tx.signature,
          mint: tx.mint,
          buyer: tx.buyer,
          seller: tx.seller,
          timestamp: tx.blocktime,
          imageUrl: tx.image,
        }))
      );
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Image generation endpoint
  app.post("/api/generate-image", async (req, res) => {
    try {
      console.log("Generating image...");
      const prompt = await getRandomPrompt();
      const imagePath = await generateAndUploadImage(prompt);
      const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imagePath}`;

      res.json({ imageUrl });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Webhook endpoint for NFT updates
  app.post("/api/webhook", async (req, res) => {
    const requestId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();

    console.log(`\n=== New Webhook Request (ID: ${requestId}) ===`);
    console.log("Time:", timestamp);
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Raw Body:", JSON.stringify(req.body, null, 2));

    try {
      // Handle array of events
      const events = Array.isArray(req.body) ? req.body : [req.body];

      for (const event of events) {
        // Process NFT sale events
        if (event.type === "NFT_SALE") {
          const validation = nftSaleEventSchema.safeParse(event);

          if (!validation.success) {
            console.error(
              `[${requestId}] NFT Sale Validation Failed:`,
              validation.error.issues
            );
            return res.status(400).json({
              status: "error",
              message: "Invalid NFT sale webhook payload",
              requestId,
              details: validation.error.issues,
            });
          }

          const nftEvent = validation.data.events.nft;
          const assetId = nftEvent.nfts[0]?.mint;

          // Log NFT sale details
          logWebhookEvent(requestId, "nft_sale", {
            assetId,
            amount: nftEvent.amount,
            buyer: nftEvent.buyer,
            seller: nftEvent.seller,
            source: nftEvent.source,
            description: nftEvent.description,
          });

          await updateNFTMetadata({ assetId });

          return res.status(200).json({
            status: "success",
            message: "NFT sale event processed",
            requestId,
            details: {
              assetId,
              timestamp,
            },
          });
        }
      }

      // For non-NFT sale webhooks, just log and accept
      return res.status(200).json({
        status: "success",
        message: "Webhook received",
        requestId,
        details: {
          type: events[0]?.type || "unknown",
          timestamp,
        },
      });
    } catch (error) {
      console.error(`[${requestId}] === Webhook Error ===`);
      console.error("Error:", error);

      return res.status(500).json({
        status: "error",
        message: "Internal server error",
        requestId,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp,
        },
      });
    }
  });

  // Endpoint for regenerating images
  app.post("/api/regenerate-image/:transactionId", async (req, res) => {
    const { transactionId } = req.params;

    try {
      // Find the transaction
      const transaction = await db.query.nftTransactions.findFirst({
        where: eq(nftTransactions.signature, transactionId),
      });

      if (!transaction) {
        return res.status(404).json({
          error: "Transaction not found",
        });
      }

      // Generate new image
      const prompt = await getRandomPrompt();
      const imagePath = await generateAndUploadImage(prompt);
      const imageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${imagePath}`;

      // Update transaction with new image
      await db
        .update(nftTransactions)
        .set({ image: imageUrl })
        .where(eq(nftTransactions.signature, transactionId));

      res.json({ imageUrl });
    } catch (error) {
      console.error("Error regenerating image:", error);
      res.status(500).json({
        error: "Failed to regenerate image",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // New endpoint for updating NFT metadata
  app.post("/api/update-metadata/:transactionId", async (req, res) => {
    const { transactionId } = req.params;

    try {
      // Find the transaction
      const transaction = await db.query.nftTransactions.findFirst({
        where: eq(nftTransactions.signature, transactionId),
      });

      if (!transaction) {
        return res.status(404).json({
          error: "Transaction not found",
        });
      }

      // Update metadata
      await updateNFTMetadata({ assetId: transaction.mint });

      // Mark the transaction as evolved
      await db
        .update(nftTransactions)
        .set({ evolvedTx: "true" })
        .where(eq(nftTransactions.signature, transactionId));

      res.json({ success: true, message: "Metadata updated successfully" });
    } catch (error) {
      console.error("Error updating metadata:", error);
      res.status(500).json({
        error: "Failed to update metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
