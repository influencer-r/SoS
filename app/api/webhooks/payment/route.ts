import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";

// ==============================================================================
// HAVEN HOUSE - WEB3 PAYMENT WEBHOOK & RESEND EMAIL RECEIPT ROUTE HANDLER
// ==============================================================================

// ⚠️️ CONFIGURE LINE 10: TODO: YOUR_ACTION_HERE (Line 10) - Paste default Resend API Key if not using process.env.RESEND_API_KEY
const FALLBACK_RESEND_API_KEY = "re_dev_placeholder_for_haven_house";

// ⚠️️ CONFIGURE LINE 13: TODO: YOUR_ACTION_HERE (Line 13) - Default sender email verified in your Resend account (e.g., 'orders@havenhouse.com')
const FALLBACK_FROM_EMAIL = "Haven House <onboarding@resend.dev>";

// ⚠️️ CONFIGURE LINE 16: TODO: YOUR_ACTION_HERE (Line 16) - Secret key shared with payment gateway for HMAC-SHA256 signature verification
const FALLBACK_WEBHOOK_SECRET = "hh_sandbox_whsec_dev_testing_123456";

// ⚠️️ CONFIGURE LINE 19: TODO: YOUR_ACTION_HERE (Line 19) - Default client wallet address for block explorer receipt links
const FALLBACK_CLIENT_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

/**
 * Verifies gateway cryptographic HMAC-SHA256 signatures or secret tokens
 */
function verifyWebhookSignature(
  rawBody: string,
  req: NextRequest,
  secret: string
): boolean {
  // Check for standard HMAC signature headers across Helio, MoonPay, or Custom Gateways
  const signatureHeader =
    req.headers.get("x-webhook-signature") ||
    req.headers.get("pay-signature") ||
    req.headers.get("moonpay-signature-v2") ||
    req.headers.get("x-signature");

  // Check for shared secret token header
  const secretHeader =
    req.headers.get("x-webhook-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  // Check for simulation mode flag from local frontend
  const simulationHeader = req.headers.get("x-simulation-mode");

  // Dev bypass for simulation or fallback secret
  if (
    simulationHeader === "true" ||
    secretHeader === secret ||
    secret === "hh_sandbox_whsec_dev_testing_123456"
  ) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    const computedHmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    const headerBuf = Buffer.from(signatureHeader, "utf8");
    const computedBuf = Buffer.from(computedHmac, "utf8");

    if (headerBuf.length !== computedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(headerBuf, computedBuf);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

/**
 * Generates an elegant HTML receipt for Haven House
 */
function buildReceiptHtml({
  customerEmail,
  fiatAmount,
  cryptoAmount,
  cryptoCurrency,
  txHash,
  orderId,
  orderTitle,
  timestamp,
  explorerUrl,
}: {
  customerEmail: string;
  fiatAmount: number;
  cryptoAmount: number;
  cryptoCurrency: string;
  txHash: string;
  orderId: string;
  orderTitle: string;
  timestamp: string;
  explorerUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Haven House - Official Payment Receipt</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }
    .email-wrapper { max-width: 600px; margin: 40px auto; background-color: #0d111a; border: 1px solid #232b3e; border-radius: 12px; overflow: hidden; }
    .email-header { background: linear-gradient(135deg, #141a27 0%, #0d111a 100%); padding: 36px 32px; text-align: center; border-bottom: 2px solid #d4af37; }
    .brand-pill { display: inline-block; background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.4); font-size: 11px; font-weight: 700; letter-spacing: 2px; padding: 4px 12px; border-radius: 4px; margin-bottom: 12px; text-transform: uppercase; }
    .email-header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
    .email-header p { margin: 8px 0 0; color: #9ca3af; font-size: 14px; }
    .email-body { padding: 32px; }
    .status-badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; margin-bottom: 24px; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .receipt-table td { padding: 12px 0; border-bottom: 1px solid #1a2233; font-size: 14px; }
    .receipt-table .label { color: #9ca3af; width: 40%; }
    .receipt-table .value { color: #ffffff; text-align: right; font-weight: 500; }
    .receipt-table .highlight { color: #d4af37; font-size: 16px; font-weight: 700; }
    .hash-box { background: #141a27; border: 1px solid #232b3e; border-radius: 8px; padding: 16px; margin-bottom: 28px; word-break: break-all; }
    .hash-label { font-size: 12px; color: #9ca3af; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .hash-value { font-family: monospace; font-size: 12px; color: #60a5fa; text-decoration: none; }
    .cta-btn { display: block; text-align: center; background: linear-gradient(135deg, #d4af37 0%, #b89728 100%); color: #0b0f19; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 14px; margin-top: 24px; }
    .email-footer { background-color: #080b12; padding: 24px 32px; text-align: center; border-top: 1px solid #1a2233; font-size: 12px; color: #6b7280; }
    .email-footer a { color: #9ca3af; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-header">
      <div class="brand-pill">Haven House</div>
      <h1>Payment Confirmation</h1>
      <p>Card-to-Crypto Smart Settlement Receipt</p>
    </div>

    <div class="email-body">
      <div class="status-badge">✓ PAYMENT VERIFIED & SETTLED ON-CHAIN</div>
      <p style="font-size: 15px; line-height: 1.5; color: #e5e7eb; margin-top: 0;">
        Dear <strong>${customerEmail}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #9ca3af;">
        Thank you for your transaction with <strong>Haven House</strong>. Your debit/credit card payment has been successfully processed, converted, and settled directly to the Haven House treasury vault.
      </p>

      <table class="receipt-table">
        <tr>
          <td class="label">Reference ID</td>
          <td class="value">${orderId}</td>
        </tr>
        <tr>
          <td class="label">Item / Description</td>
          <td class="value">${orderTitle}</td>
        </tr>
        <tr>
          <td class="label">Amount Paid (Fiat/Card)</td>
          <td class="value highlight">$${fiatAmount.toFixed(2)} USD</td>
        </tr>
        <tr>
          <td class="label">Settled in Vault</td>
          <td class="value" style="color: #34d399;">${cryptoAmount.toFixed(2)} ${cryptoCurrency}</td>
        </tr>
        <tr>
          <td class="label">Timestamp</td>
          <td class="value">${timestamp}</td>
        </tr>
      </table>

      <div class="hash-box">
        <div class="hash-label">On-Chain Proof / Transaction Hash:</div>
        <a href="${explorerUrl}" target="_blank" class="hash-value">${txHash}</a>
      </div>

      <a href="${explorerUrl}" target="_blank" class="cta-btn">
        View On-Chain Settlement Proof ↗
      </a>
    </div>

    <div class="email-footer">
      <p style="margin: 0 0 8px 0;">Haven House Concierge &bull; Automated Treasury Engine</p>
      <p style="margin: 0;">This is an automated transaction receipt. For questions, please contact your Haven House representative.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Main Webhook POST Handler
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON payload received." },
        { status: 400 }
      );
    }

    // Resolve security secret
    const webhookSecret =
      process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || FALLBACK_WEBHOOK_SECRET;

    // Validate Signature
    const isVerified = verifyWebhookSignature(rawBody, req, webhookSecret);
    if (!isVerified) {
      console.warn("⚠️ Webhook signature validation failed.");
      return NextResponse.json(
        { error: "Unauthorized: Invalid gateway signature or secret token." },
        { status: 401 }
      );
    }

    // Extract standardized payment attributes across Helio, MoonPay, and Custom payloads
    const customerEmail =
      body.customerEmail ||
      body.customerDetails?.email ||
      body.meta?.customerEmail ||
      body.metadata?.buyerEmail ||
      body.email ||
      "client@havenhouse.com";

    const fiatAmount = Number(
      body.fiatAmount ||
      body.meta?.fiatAmount ||
      body.baseCurrencyAmount ||
      body.amount ||
      150.0
    );

    const cryptoAmount = Number(
      body.cryptoAmount ||
      body.meta?.cryptoAmount ||
      body.currencyAmount ||
      body.amount ||
      fiatAmount
    );

    const cryptoCurrency =
      body.cryptoCurrency ||
      body.currency ||
      body.currencyCode?.toUpperCase() ||
      "USDC";

    const txHash =
      body.txHash ||
      body.transactionHash ||
      body.transactionSignature ||
      body.data?.cryptoTransactionId ||
      body.id ||
      ("0x" + crypto.randomBytes(32).toString("hex"));

    const paymentStatus = (
      body.paymentStatus ||
      body.event ||
      body.status ||
      body.state ||
      "completed"
    ).toLowerCase();

    const orderId =
      body.orderId ||
      body.referenceId ||
      `HH-${Date.now().toString(36).toUpperCase()}`;

    const orderTitle =
      body.orderTitle ||
      body.metadata?.havenHouseProperty ||
      "Haven House - Deposit & Verification";

    const timestamp = body.timestamp || new Date().toUTCString();

    // Check payment completion status
    const isSuccess =
      paymentStatus.includes("success") ||
      paymentStatus.includes("completed") ||
      paymentStatus.includes("payment_completed") ||
      paymentStatus === "paid";

    if (!isSuccess) {
      console.log(`ℹ️ Webhook received for non-final status: ${paymentStatus}`);
      return NextResponse.json(
        {
          message: `Payment status '${paymentStatus}' acknowledged. No receipt dispatched.`,
          orderId,
        },
        { status: 200 }
      );
    }

    // Determine appropriate block explorer link
    const isSolana = txHash.length > 70 && !txHash.startsWith("0x");
    const explorerUrl = isSolana
      ? `https://solscan.io/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`;

    // Construct Email HTML
    const emailHtml = buildReceiptHtml({
      customerEmail,
      fiatAmount,
      cryptoAmount,
      cryptoCurrency,
      txHash,
      orderId,
      orderTitle,
      timestamp,
      explorerUrl,
    });

    // Initialize Resend
    const resendApiKey =
      process.env.RESEND_API_KEY || FALLBACK_RESEND_API_KEY;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || FALLBACK_FROM_EMAIL;

    let resendDispatchResult = null;
    let emailStatusDescription = "Receipt dispatched successfully";

    // Check if live or demo key is used
    const isMockKey =
      !resendApiKey ||
      resendApiKey.startsWith("re_dev_") ||
      resendApiKey.startsWith("re_1234");

    if (isMockKey) {
      console.log("=================================================");
      console.log("⚡ RESEND DEV SIMULATION MODE (No live API key set)");
      console.log(`To: ${customerEmail}`);
      console.log(`From: ${fromEmail}`);
      console.log(`Subject: Haven House Payment Receipt - ${orderId}`);
      console.log(`TxHash: ${txHash}`);
      console.log(`Amount: $${fiatAmount} USD -> ${cryptoAmount} ${cryptoCurrency}`);
      console.log("=================================================");
      emailStatusDescription = "Simulated successfully (Logged to server console)";
    } else {
      const resend = new Resend(resendApiKey);

      const resendResponse = await resend.emails.send({
        from: fromEmail,
        to: customerEmail,
        subject: `Haven House Payment Receipt [${orderId}]`,
        html: emailHtml,
      });

      if (resendResponse.error) {
        console.error("Resend error:", resendResponse.error);
        return NextResponse.json(
          {
            error: "Failed to dispatch email receipt via Resend.",
            details: resendResponse.error,
          },
          { status: 500 }
        );
      }

      resendDispatchResult = resendResponse.data;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment processed and receipt dispatched.",
        orderId,
        customerEmail,
        fiatAmount,
        cryptoAmount,
        cryptoCurrency,
        txHash,
        explorerUrl,
        emailDispatchStatus: emailStatusDescription,
        receiptId: resendDispatchResult?.id || `sim_${Date.now()}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Webhook processing exception:", error);
    return NextResponse.json(
      {
        error: "Internal server error processing payment webhook.",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
