"use client";

import React, { useState } from "react";
import CheckoutModal from "../components/CheckoutModal";

// ==============================================================================
// HAVEN HOUSE - DEMO & PAYMENT INTEGRATION SHOWCASE PAGE
// ==============================================================================

export default function HavenPaymentPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(150.0);
  const [lastPaymentResult, setLastPaymentResult] = useState<any | null>(null);

  return (
    <main style={{ minHeight: "100vh", background: "#0b0f19", color: "#f3f4f6", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        
        {/* Brand Badge */}
        <div style={{
          display: "inline-block",
          background: "rgba(212, 175, 55, 0.15)",
          color: "#d4af37",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "2px",
          padding: "6px 14px",
          borderRadius: "4px",
          marginBottom: "16px",
          textTransform: "uppercase"
        }}>
          Haven House Luxury Estates
        </div>

        <h1 style={{ fontSize: "36px", fontWeight: 700, margin: "0 0 12px 0", color: "#ffffff" }}>
          Web3 Card-to-Crypto Checkout
        </h1>
        <p style={{ fontSize: "16px", color: "#9ca3af", maxWidth: "600px", margin: "0 auto 32px auto", lineHeight: "1.6" }}>
          Accept credit and debit cards in USD, automatically convert and settle in USDC directly into the Haven House client treasury wallet, and dispatch instant cryptographic email receipts using Resend.
        </p>

        {/* Action Card */}
        <div style={{
          background: "#141a27",
          border: "1px solid #232b3e",
          borderRadius: "16px",
          padding: "32px",
          textAlign: "left",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          marginBottom: "32px"
        }}>
          <h2 style={{ fontSize: "20px", margin: "0 0 16px 0", color: "#ffffff" }}>
            Select Payment / Deposit Amount
          </h2>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            {[50, 150, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setPaymentAmount(amt)}
                style={{
                  flex: 1,
                  background: paymentAmount === amt ? "rgba(212, 175, 55, 0.2)" : "#0d111a",
                  border: paymentAmount === amt ? "2px solid #d4af37" : "1px solid #232b3e",
                  color: paymentAmount === amt ? "#d4af37" : "#e5e7eb",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "15px"
                }}
              >
                ${amt} USD
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #232b3e", paddingTop: "20px" }}>
            <div>
              <div style={{ color: "#9ca3af", fontSize: "13px" }}>Settlement Destination:</div>
              <div style={{ color: "#34d399", fontSize: "13px", fontWeight: 600 }}>Direct to Client USDC Wallet</div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "linear-gradient(135deg, #d4af37 0%, #b89728 100%)",
                color: "#0b0f19",
                border: "none",
                fontWeight: 700,
                fontSize: "15px",
                padding: "14px 28px",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(212, 175, 55, 0.3)"
              }}
            >
              Open Checkout (${paymentAmount} USD) →
            </button>
          </div>
        </div>

        {/* Last Transaction Status */}
        {lastPaymentResult && (
          <div style={{
            background: "#0d111a",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "left",
            marginBottom: "32px"
          }}>
            <h3 style={{ color: "#34d399", margin: "0 0 10px 0", fontSize: "16px" }}>✓ Latest Payment Recorded</h3>
            <p style={{ margin: "4px 0", fontSize: "13px", color: "#9ca3af" }}>
              Order ID: <strong style={{ color: "#ffffff" }}>{lastPaymentResult.orderId}</strong>
            </p>
            <p style={{ margin: "4px 0", fontSize: "13px", color: "#9ca3af" }}>
              Recipient Email: <strong style={{ color: "#ffffff" }}>{lastPaymentResult.customerEmail}</strong>
            </p>
            <p style={{ margin: "4px 0", fontSize: "13px", color: "#9ca3af" }}>
              Tx Hash: <a href={`https://etherscan.io/tx/${lastPaymentResult.txHash}`} target="_blank" rel="noreferrer" style={{ color: "#60a5fa" }}>{lastPaymentResult.txHash}</a>
            </p>
          </div>
        )}

        {/* Integration Instructions */}
        <div style={{
          background: "#0d111a",
          border: "1px solid #1f2937",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "left",
          fontSize: "13px",
          color: "#9ca3af"
        }}>
          <h4 style={{ color: "#ffffff", margin: "0 0 12px 0", fontSize: "15px" }}>Developer Quick Checklist</h4>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
            <li><strong>Frontend Widget:</strong> <code>components/CheckoutModal.tsx</code> (Collects email upfront, embeds Web3 card-to-crypto gateway, has dev simulation toggle).</li>
            <li><strong>Backend Webhook:</strong> <code>app/api/webhooks/payment/route.ts</code> &amp; <code>pages/api/webhooks/payment.ts</code> (HMAC signature verification + Resend receipt dispatch).</li>
            <li><strong>Keys &amp; Config:</strong> <code>.env.example</code> &amp; <code>.env.local</code>.</li>
            <li><strong>Automated Local Testing:</strong> Run <code>npm run test:webhook</code> in terminal.</li>
          </ul>
        </div>

      </div>

      {/* Embedded Checkout Component */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amountUsd={paymentAmount}
        orderTitle="Haven House - Exclusive Property Membership Deposit"
        onSuccess={(result) => setLastPaymentResult(result)}
      />
    </main>
  );
}
