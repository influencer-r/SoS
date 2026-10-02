/**
 * HAVEN HOUSE - LOCAL WEBHOOK TEST UTILITY
 * 
 * Tests the payment webhook endpoint (/api/webhooks/payment) locally
 * by generating an authentic HMAC-SHA256 signature and posting a realistic
 * card-to-crypto completion payload.
 */

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ⚠️️ CONFIGURE LINE 15: TODO: YOUR_ACTION_HERE (Line 15) - Shared webhook secret matching your .env file
const WEBHOOK_SECRET = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || "hh_sandbox_whsec_dev_testing_123456";

// ⚠️️ CONFIGURE LINE 18: TODO: YOUR_ACTION_HERE (Line 18) - Target webhook URL (defaults to Next.js local server on port 3000)
const WEBHOOK_HOST = process.env.WEBHOOK_HOST || "127.0.0.1";
const WEBHOOK_PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = "/api/webhooks/payment";

// Load mock payload
const payloadPath = path.join(__dirname, "..", "mock-payload.json");
const payloadRaw = fs.readFileSync(payloadPath, "utf8");

// Generate cryptographic HMAC-SHA256 signature
const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(payloadRaw, "utf8")
  .digest("hex");

console.log("=================================================");
console.log("🚀 HAVEN HOUSE - SIMULATING WEBHOOK PAYMENT DISPATCH");
console.log(`Endpoint: http://${WEBHOOK_HOST}:${WEBHOOK_PORT}${WEBHOOK_PATH}`);
console.log(`HMAC-SHA256 Signature: ${signature}`);
console.log("=================================================");

const options = {
  hostname: WEBHOOK_HOST,
  port: WEBHOOK_PORT,
  path: WEBHOOK_PATH,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payloadRaw),
    "x-webhook-signature": signature,
    "x-webhook-secret": WEBHOOK_SECRET,
  },
};

const req = http.request(options, (res) => {
  let responseData = "";

  res.on("data", (chunk) => {
    responseData += chunk;
  });

  res.on("end", () => {
    console.log(`\nResponse HTTP Status: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(responseData);
      console.log("Response Body:\n", JSON.stringify(parsed, null, 2));
      if (res.statusCode === 200) {
        console.log("\n✅ SUCCESS: Webhook signature verified and receipt processed!");
      } else {
        console.log("\n❌ ERROR: Webhook returned non-200 status.");
      }
    } catch (e) {
      console.log("Raw Response:\n", responseData);
    }
  });
});

req.on("error", (error) => {
  console.error(`\n❌ Failed to connect to server at http://${WEBHOOK_HOST}:${WEBHOOK_PORT}`);
  console.error("Make sure your Next.js app is running with `npm run dev` before running this test script.");
  console.error("Details:", error.message);
});

req.write(payloadRaw);
req.end();
