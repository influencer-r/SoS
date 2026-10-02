# Haven House — Web3 Card-to-Crypto Checkout & Automated Resend Receipts

A production-ready Web3 payment checkout and automated receipt dispatch system built for **Haven House**. Users can pay using their **Credit/Debit Card (USD/Fiat)**, the funds are automatically converted and settled in **USDC/USDT directly to the client's crypto treasury wallet**, and an official cryptographic **email receipt is automatically dispatched to the buyer using the Resend API**.

---

## 🏗️ Architecture & Payment Lifecycle

```
[ Buyer on Haven House ]
        │
        ▼ (1. Inputs email upfront for receipt)
[ components/CheckoutModal.tsx ]
        │
        ├──▶ [ Helio Pay / MoonPay Web3 Widget ]
        │       │ (2. Buyer pays via Credit/Debit card in USD)
        │       ▼
        │    [ On-Chain Conversion & Direct Settlement ]
        │       │ (3. Settles in USDC directly to Haven House Vault)
        │       ▼
        │    [ Haven House Treasury Wallet (0x...) ]
        │
        └──▶ [ Gateway Webhook POST with HMAC Signature ]
                │
                ▼
      [ /api/webhooks/payment ] (app/api/webhooks/payment/route.ts)
                │
                ├──▶ [ HMAC-SHA256 Signature Verification ]
                │       (Validates authenticity via PAYMENT_GATEWAY_WEBHOOK_SECRET)
                │
                ├──▶ [ Extracts: customerEmail, fiatAmount, cryptoAmount, txHash ]
                │
                └──▶ [ Resend API Engine (new Resend(apiKey)) ]
                        │
                        ▼ (4. Dispatches Luxury Branded HTML Receipt)
                     [ Buyer Inbox: Official Payment Receipt + Etherscan Link ]
```

---

## 📁 File Structure Added to Project

```
haven/
├── .env.example                       # Complete environment variable template with line comments
├── .env.local                         # Local testing environment file with sandbox fallbacks
├── package.json                       # Next.js, React, TypeScript, Resend dependencies
├── tsconfig.json                      # Strict TypeScript configuration
├── next.config.mjs                    # Next.js configuration
├── mock-payload.json                  # Sample Web3 gateway payment completion payload
├── components/
│   └── CheckoutModal.tsx              # Front-end Card-to-Crypto widget + Upfront email input + Dev Sandbox
├── app/
│   ├── layout.tsx                     # Haven House luxury theme root layout
│   ├── page.tsx                       # Interactive checkout demonstration & test page
│   └── api/
│       └── webhooks/
│           └── payment/
│               └── route.ts           # Production webhook route (HMAC verification + Resend email dispatch)
├── scripts/
│   └── test-webhook.js                # One-command local webhook tester with HMAC signature generation
└── README.md                          # Complete engineering & testing documentation
```

*Note: All original project HTML, CSS, JS, and asset files remain 100% untouched and preserved.*

---

## 🔑 Configuration & Line-by-Line Guide

Every line requiring configuration has been commented with:
`// ⚠️️ CONFIGURE LINE [X]: TODO: YOUR_ACTION_HERE (Line X)`

### 1. `.env.local` (or `.env.example`)
| Line | Key | Description | Where to get it |
| :--- | :--- | :--- | :--- |
| **Line 6** | `RESEND_API_KEY` | Resend API Key | [resend.com/api-keys](https://resend.com/api-keys) |
| **Line 9** | `RESEND_FROM_EMAIL` | Verified sender email | E.g. `Haven House <orders@havenhouse.com>` or `onboarding@resend.dev` for sandbox |
| **Line 12** | `NEXT_PUBLIC_CLIENT_WALLET_ADDRESS` | Haven House treasury wallet | EVM wallet address (`0x...`) or Solana public key |
| **Line 15** | `PAYMENT_GATEWAY_WEBHOOK_SECRET` | HMAC signature secret | Generated in your Helio / MoonPay webhook settings |
| **Line 18** | `NEXT_PUBLIC_HELIO_PAYLINK_ID` | Helio Paylink ID | Created in [Helio Dashboard](https://app.hel.io) |
| **Line 21** | `NEXT_PUBLIC_MOONPAY_API_KEY` | MoonPay Publishable Key | [dashboard.moonpay.com](https://dashboard.moonpay.com) (Optional) |
| **Line 24** | `NEXT_PUBLIC_APP_URL` | Canonical app URL | `http://localhost:3000` (or production domain) |

### 2. `components/CheckoutModal.tsx`
- **Line 10**: Fallback client wallet address if not provided in `.env`.
- **Line 13**: Fallback Helio Paylink ID.
- **Line 16**: Fallback MoonPay publishable key.

### 3. `app/api/webhooks/payment/route.ts`
- **Line 10**: Fallback Resend API key.
- **Line 13**: Fallback sender email.
- **Line 16**: Fallback webhook HMAC secret.
- **Line 19**: Fallback client wallet address for block explorer links.

---

## 🚀 Running & Testing Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 3 Ways to Test Without a Real Credit Card Charge

### Method 1: Interactive Browser UI Test (Dev Sandbox Mode)
1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"Open Checkout ($150 USD) →"**.
3. Enter your test email address (e.g. `buyer@example.com`) and click **"Continue to Payment Widget →"**.
4. The modal opens in **"Dev Sandbox / Local Simulation Mode"**.
5. Click **"Simulate $150.00 Card Payment & Send Email"**.
6. The frontend automatically sends a signed simulation payload to `/api/webhooks/payment`, executes the backend handler, triggers Resend (or prints full receipt details to the server terminal if using the dev key), and renders the confirmed transaction hash with Etherscan link.

---

### Method 2: Automated Local CLI Test (`npm run test:webhook`)
While `npm run dev` (or `npm start`) is running in terminal 1, run the automated test script in terminal 2:

```bash
npm run test:webhook
```

**Expected output:**
```
=================================================
🚀 HAVEN HOUSE - SIMULATING WEBHOOK PAYMENT DISPATCH
Endpoint: http://127.0.0.1:3000/api/webhooks/payment
HMAC-SHA256 Signature: 41b66bd018c6e35b30840e9bfae161cb5e0c764125d080137411a3be48b76993
=================================================

Response HTTP Status: 200
Response Body:
 {
  "success": true,
  "message": "Payment processed and receipt dispatched.",
  "orderId": "HH-ORD-TEST-9921",
  "customerEmail": "buyer@havenhouse.com",
  "fiatAmount": 250,
  "cryptoAmount": 250,
  "cryptoCurrency": "USDC",
  "txHash": "0xa38f71c48e83b129759c8de4bb91f24d2994498308cf2bda62b2c15112f458e0",
  "explorerUrl": "https://etherscan.io/tx/0xa38f71c48e83b129759c8de4bb91f24d2994498308cf2bda62b2c15112f458e0",
  "emailDispatchStatus": "Simulated successfully (Logged to server console)",
  "receiptId": "sim_1790884663822"
}

✅ SUCCESS: Webhook signature verified and receipt processed!
```

---

### Method 3: cURL Command / Postman

#### cURL Request:
```bash
curl -X POST http://localhost:3000/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: hh_sandbox_whsec_dev_testing_123456" \
  -d '{
    "event": "PAYMENT_COMPLETED",
    "paymentStatus": "completed",
    "orderId": "HH-ORD-TEST-1001",
    "orderTitle": "Haven House - Exclusive Property Membership",
    "customerEmail": "buyer@havenhouse.com",
    "fiatAmount": 500.00,
    "fiatCurrency": "USD",
    "cryptoAmount": 500.00,
    "cryptoCurrency": "USDC",
    "txHash": "0x5c72c2374e2d2fb4ba5d8205ef50e18374d209a25ab90a36415f3ec6ef5f0c1a"
  }'
```

#### Postman Collection Setup:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/webhooks/payment`
- **Headers:**
  - `Content-Type`: `application/json`
  - `x-webhook-secret`: `hh_sandbox_whsec_dev_testing_123456` *(or calculate HMAC-SHA256 signature in pre-request script and pass as `x-webhook-signature`)*
- **Body:** Raw JSON (copy from `mock-payload.json`).

---

## 🌐 Connecting Live Webhooks via ngrok

When deploying or testing with the live Helio / MoonPay dashboard:

1. Launch ngrok:
   ```bash
   ngrok http 3000
   ```
2. Copy the forwarding HTTPS URL (e.g. `https://abc1234.ngrok-free.app`).
3. In your **Helio Dashboard (Webhooks)** or **MoonPay Webhooks**, set the Webhook URL to:
   ```
   https://abc1234.ngrok-free.app/api/webhooks/payment
   ```
4. Copy the webhook signing secret from the gateway dashboard and paste it into `.env.local` as `PAYMENT_GATEWAY_WEBHOOK_SECRET`.
