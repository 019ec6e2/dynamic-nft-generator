/**
 * Test script for the webhook endpoint
 */
import fetch from "node-fetch";

// Test configuration
const TEST_CONFIG = {
  baseUrl: "http://localhost:5000",
  webhookEndpoint: "/api/webhook",
};

// Helper function to send webhook requests
async function sendWebhook(payload: any): Promise<any> {
  console.log(`\nSending webhook with payload:`, JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.webhookEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(`Response (${response.status}):`, JSON.stringify(data, null, 2));
    return { status: response.status, data };
  } catch (error) {
    console.error("Request failed:", error);
    return { status: 500, error };
  }
}

// Test cases
const testCases = [
  {
    name: "Valid NFT sale webhook",
    payload: {
      type: "nft_sale",
      timestamp: Date.now(),
      data: {
        assetId: "APEV7oJ5dyzpzAS9C5ChdeUBiasSNXQWdkFxUMkb4arG",
        collectionId: process.env.SOLANA_COLLECTION_ID,
        newName: "Test NFT Update",
        transactionId: "5KtP3yHZHE6LqA6deTkh2ViE7VFJwQF5E1jXYgsG4BL1YE9qXmCkvBXHWHQhDqVxZuNr7AySJGs9"
      }
    },
    expectStatus: 200
  },
  {
    name: "Valid NFT sale webhook with image generation",
    payload: {
      type: "nft_sale",
      timestamp: Date.now(),
      data: {
        assetId: "APEV7oJ5dyzpzAS9C5ChdeUBiasSNXQWdkFxUMkb4arG",
        collectionId: process.env.SOLANA_COLLECTION_ID,
        newName: "Generated Art NFT",
      }
    },
    expectStatus: 200
  },
  {
    name: "Invalid NFT sale webhook (missing assetId)",
    payload: {
      type: "nft_sale",
      timestamp: Date.now(),
      data: {
        newName: "Bad NFT",
      }
    },
    expectStatus: 400
  },
  {
    name: "Invalid webhook type",
    payload: {
      type: "unknown_event",
      timestamp: Date.now(),
      data: {}
    },
    expectStatus: 200 // Should still accept unknown types but handle them differently
  }
];

// Run the tests
async function runTests() {
  console.log("=== Starting Webhook Tests ===\n");

  for (const test of testCases) {
    console.log(`\nTest Case: ${test.name}`);
    console.log("-------------------");

    const result = await sendWebhook(test.payload);

    if (result.status === test.expectStatus) {
      console.log("✅ Test passed");
    } else {
      console.log("❌ Test failed");
      console.log(`Expected status ${test.expectStatus}, got ${result.status}`);
    }
  }

  console.log("\n=== Tests Complete ===");
}

// Using ES modules check for main module
if (import.meta.url === new URL(import.meta.url).href) {
  runTests().catch(console.error);
}

export { sendWebhook, testCases };