"use client";

import React, { useState, useEffect } from "react";

// ==============================================================================
// HAVEN HOUSE - WEB3 EMBEDDED CARD-TO-CRYPTO CHECKOUT COMPONENT
// ==============================================================================

// ⚠️️ CONFIGURE LINE 10: TODO: YOUR_ACTION_HERE (Line 10) - Override default client crypto wallet address if not using .env variable
const FALLBACK_CLIENT_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

// ⚠️️ CONFIGURE LINE 13: TODO: YOUR_ACTION_HERE (Line 13) - Override default Helio Paylink ID if not using .env variable
const FALLBACK_HELIO_PAYLINK_ID = "64fa7980ef550f2694b281f9";

// ⚠️️ CONFIGURE LINE 16: TODO: YOUR_ACTION_HERE (Line 16) - Override default MoonPay publishable key if not using .env variable
const FALLBACK_MOONPAY_KEY = "pk_test_sample_moonpay_key";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountUsd?: number;
  orderTitle?: string;
  onSuccess?: (paymentData: any) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  amountUsd = 150.0,
  orderTitle = "Haven House - Deposit & Verification",
  onSuccess,
}: CheckoutModalProps) {
  // Buyer's upfront email state
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [isEmailConfirmed, setIsEmailConfirmed] = useState<boolean>(false);

  // Gateway & mode toggles
  const [activeGateway, setActiveGateway] = useState<"helio" | "moonpay">("helio");
  const [isDevSimulationMode, setIsDevSimulationMode] = useState<boolean>(true); // Defaults to true for immediate local testing
  const [isProcessingSimulation, setIsProcessingSimulation] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Resolving Environment Configurations
  const clientWallet =
    process.env.NEXT_PUBLIC_CLIENT_WALLET_ADDRESS || FALLBACK_CLIENT_WALLET;
  const helioPaylinkId =
    process.env.NEXT_PUBLIC_HELIO_PAYLINK_ID || FALLBACK_HELIO_PAYLINK_ID;
  const moonpayApiKey =
    process.env.NEXT_PUBLIC_MOONPAY_API_KEY || FALLBACK_MOONPAY_KEY;

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setCustomerEmail("");
      setEmailError("");
      setIsEmailConfirmed(false);
      setSimulationResult(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Validate upfront email address
  const handleConfirmEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail || !emailRegex.test(customerEmail.trim())) {
      setEmailError("Please enter a valid email address to receive your payment receipt.");
      return;
    }
    setEmailError("");
    setIsEmailConfirmed(true);
  };

  // Build embedded Helio Pay Checkout URL
  // Parameters ensure card payment in USD settles directly to USDC in the client's wallet
  const getHelioCheckoutUrl = () => {
    const params = new URLSearchParams({
      paylinkId: helioPaylinkId,
      recipient: clientWallet,
      customerEmail: encodeURIComponent(customerEmail),
      fiatAmount: amountUsd.toString(),
      currency: "USDC",
      paymentMethod: "card",
      theme: "dark",
    });
    return `https://embed.hel.io/pay/${helioPaylinkId}?${params.toString()}`;
  };

  // Build embedded MoonPay Widget URL
  const getMoonPayCheckoutUrl = () => {
    const params = new URLSearchParams({
      apiKey: moonpayApiKey,
      currencyCode: "usdc",
      walletAddress: clientWallet,
      email: encodeURIComponent(customerEmail),
      baseCurrencyCode: "usd",
      baseCurrencyAmount: amountUsd.toString(),
      theme: "dark",
      colorCode: "%23d4af37",
    });
    return `https://buy-sandbox.moonpay.com?${params.toString()}`;
  };

  // Dev Testing Mode: Simulate successful card-to-crypto payment & trigger webhook directly
  const handleSimulatePayment = async () => {
    setIsProcessingSimulation(true);
    setErrorMessage("");
    setSimulationResult(null);

    const mockTxHash =
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
    const mockOrderId = `HH-ORD-${Date.now().toString(36).toUpperCase()}`;

    const mockPayload = {
      event: "PAYMENT_COMPLETED",
      paymentStatus: "completed",
      customerEmail: customerEmail.trim(),
      fiatAmount: amountUsd,
      fiatCurrency: "USD",
      cryptoAmount: amountUsd,
      cryptoCurrency: "USDC",
      txHash: mockTxHash,
      recipientWallet: clientWallet,
      orderId: mockOrderId,
      orderTitle: orderTitle,
      timestamp: new Date().toISOString(),
      metadata: {
        buyerEmail: customerEmail.trim(),
        havenHouseProperty: "Haven House Luxury Reserve",
      },
    };

    try {
      const response = await fetch("/api/webhooks/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass dev simulation authentication header
          "x-webhook-secret": "hh_sandbox_whsec_dev_testing_123456",
          "x-simulation-mode": "true",
        },
        body: JSON.stringify(mockPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Simulation webhook failed.");
      }

      setSimulationResult({
        ...mockPayload,
        emailStatus: data.emailDispatchStatus || "Receipt generated successfully",
        receiptId: data.receiptId,
      });

      if (onSuccess) {
        onSuccess(mockPayload);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to trigger simulated payment webhook.");
    } finally {
      setIsProcessingSimulation(false);
    }
  };

  return (
    <div className="haven-modal-overlay">
      <div className="haven-modal-container">
        {/* Header */}
        <div className="haven-modal-header">
          <div className="haven-brand-title">
            <span className="haven-gold-pill">HAVEN HOUSE</span>
            <h3>Card to Crypto Checkout</h3>
          </div>
          <button
            onClick={onClose}
            className="haven-close-btn"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {/* Order Details Banner */}
        <div className="haven-order-card">
          <div className="haven-order-row">
            <span className="haven-order-label">Item / Purpose</span>
            <span className="haven-order-value">{orderTitle}</span>
          </div>
          <div className="haven-order-row">
            <span className="haven-order-label">Amount Payable (Card/Fiat)</span>
            <span className="haven-order-price">${amountUsd.toFixed(2)} USD</span>
          </div>
          <div className="haven-order-row">
            <span className="haven-order-label">Settlement to Client</span>
            <span className="haven-crypto-badge">
              {amountUsd.toFixed(2)} USDC (Direct to Wallet)
            </span>
          </div>
          <div className="haven-wallet-row">
            <span className="haven-wallet-label">Client Vault:</span>
            <span className="haven-wallet-address" title={clientWallet}>
              {clientWallet.slice(0, 8)}...{clientWallet.slice(-6)}
            </span>
          </div>
        </div>

        {/* Dev Mode Simulation / Sandbox Toggle */}
        <div className="haven-dev-toggle-bar">
          <div className="haven-dev-status">
            <span
              className={`haven-mode-dot ${
                isDevSimulationMode ? "haven-dot-dev" : "haven-dot-live"
              }`}
            />
            <span className="haven-mode-text">
              Mode:{" "}
              <strong>
                {isDevSimulationMode ? "Dev Sandbox / Local Simulation" : "Live Web3 Widget"}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDevSimulationMode(!isDevSimulationMode)}
            className="haven-toggle-btn"
          >
            Switch to {isDevSimulationMode ? "Live Web3 Gateway" : "Dev Simulator"}
          </button>
        </div>

        {/* STEP 1: Upfront Email Collection */}
        {!isEmailConfirmed ? (
          <form onSubmit={handleConfirmEmail} className="haven-email-step">
            <div className="haven-input-group">
              <label htmlFor="customer-email" className="haven-input-label">
                Step 1: Enter Buyer Email for Automated Resend Receipt
              </label>
              <p className="haven-input-hint">
                Your email is passed to the Web3 smart settlement gateway to dispatch an
                instant official receipt with cryptographic proof.
              </p>
              <input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="buyer@example.com"
                className={`haven-text-input ${emailError ? "haven-input-error" : ""}`}
                autoFocus
              />
              {emailError && <p className="haven-error-msg">{emailError}</p>}
            </div>

            <button type="submit" className="haven-primary-btn">
              Continue to Payment Widget →
            </button>
          </form>
        ) : (
          /* STEP 2: Payment Execution (Embedded Widget OR Local Simulation) */
          <div className="haven-step-two">
            {/* Confirmed Email Bar with Edit Option */}
            <div className="haven-email-confirmed-bar">
              <div>
                <span className="haven-email-pill">Receipt Delivery To:</span>
                <span className="haven-email-address">{customerEmail}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEmailConfirmed(false);
                  setSimulationResult(null);
                }}
                className="haven-edit-email-btn"
              >
                Change Email
              </button>
            </div>

            {/* If in Dev Simulation Mode */}
            {isDevSimulationMode ? (
              <div className="haven-simulation-panel">
                <div className="haven-sim-header">
                  <div className="haven-sim-icon">⚡</div>
                  <div>
                    <h4>Dev Sandbox Mode Active</h4>
                    <p>
                      Test the complete end-to-end flow (Card Conversion → Webhook → Resend
                      Email Receipt) instantly without placing a live charge.
                    </p>
                  </div>
                </div>

                {simulationResult ? (
                  <div className="haven-success-card">
                    <div className="haven-success-badge">✓ Payment Successfully Simulated</div>
                    <div className="haven-receipt-details">
                      <div className="haven-receipt-row">
                        <span>Order Reference:</span>
                        <strong>{simulationResult.orderId}</strong>
                      </div>
                      <div className="haven-receipt-row">
                        <span>Amount Paid:</span>
                        <strong>${simulationResult.fiatAmount} USD</strong>
                      </div>
                      <div className="haven-receipt-row">
                        <span>Crypto Settled:</span>
                        <strong>
                          {simulationResult.cryptoAmount} {simulationResult.cryptoCurrency}
                        </strong>
                      </div>
                      <div className="haven-receipt-row">
                        <span>Transaction Hash:</span>
                        <a
                          href={`https://etherscan.io/tx/${simulationResult.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="haven-hash-link"
                        >
                          {simulationResult.txHash.slice(0, 10)}...{simulationResult.txHash.slice(-8)} ↗
                        </a>
                      </div>
                      <div className="haven-receipt-row">
                        <span>Resend Email Status:</span>
                        <span className="haven-status-tag">
                          {simulationResult.emailStatus}
                        </span>
                      </div>
                    </div>
                    <p className="haven-note">
                      A receipt email has been dispatched to <u>{customerEmail}</u>. Check
                      your server terminal / Resend dashboard.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSimulationResult(null)}
                      className="haven-secondary-btn"
                    >
                      Run Another Simulation
                    </button>
                  </div>
                ) : (
                  <div className="haven-sim-action">
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isProcessingSimulation}
                      className="haven-primary-btn haven-sim-btn"
                    >
                      {isProcessingSimulation ? (
                        <span className="haven-spinner-label">
                          Processing Webhook & Dispatching Receipt...
                        </span>
                      ) : (
                        `Simulate $${amountUsd.toFixed(2)} Card Payment & Send Email`
                      )}
                    </button>
                    {errorMessage && <p className="haven-error-msg">{errorMessage}</p>}
                  </div>
                )}
              </div>
            ) : (
              /* LIVE WEB3 EMBEDDED WIDGET (Helio Pay / MoonPay) */
              <div className="haven-widget-wrapper">
                {/* Gateway selector tabs */}
                <div className="haven-gateway-tabs">
                  <button
                    type="button"
                    onClick={() => setActiveGateway("helio")}
                    className={`haven-tab-btn ${
                      activeGateway === "helio" ? "haven-tab-active" : ""
                    }`}
                  >
                    Helio Pay (Direct Card to USDC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveGateway("moonpay")}
                    className={`haven-tab-btn ${
                      activeGateway === "moonpay" ? "haven-tab-active" : ""
                    }`}
                  >
                    MoonPay Widget
                  </button>
                </div>

                {/* Embedded Widget Iframe */}
                <div className="haven-iframe-box">
                  {activeGateway === "helio" ? (
                    <iframe
                      title="Helio Pay Card to Crypto"
                      src={getHelioCheckoutUrl()}
                      className="haven-embedded-frame"
                      allow="camera; microphone; payment; usb; ethereum"
                    />
                  ) : (
                    <iframe
                      title="MoonPay Web SDK"
                      src={getMoonPayCheckoutUrl()}
                      className="haven-embedded-frame"
                      allow="camera; microphone; payment; usb; ethereum"
                    />
                  )}
                </div>

                <div className="haven-security-footer">
                  <span>🔒 256-Bit Encrypted Web3 Checkout</span>
                  <span>• Settles directly to client USDC vault</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scoped CSS Styles for Haven House Checkout Modal */}
      <style jsx>{`
        .haven-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 7, 12, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 16px;
          animation: havenFadeIn 0.2s ease-out;
        }
        .haven-modal-container {
          background: #0d111a;
          border: 1px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7),
            0 0 30px rgba(212, 175, 55, 0.15);
          border-radius: 16px;
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          color: #f3f4f6;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .haven-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .haven-brand-title {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .haven-gold-pill {
          background: rgba(212, 175, 55, 0.15);
          color: #d4af37;
          border: 1px solid rgba(212, 175, 55, 0.4);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
        }
        .haven-brand-title h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
        }
        .haven-close-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .haven-close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .haven-order-card {
          background: #141a27;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }
        .haven-order-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .haven-order-label {
          color: #9ca3af;
        }
        .haven-order-value {
          color: #f3f4f6;
          font-weight: 500;
        }
        .haven-order-price {
          color: #d4af37;
          font-weight: 700;
          font-size: 15px;
        }
        .haven-crypto-badge {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .haven-wallet-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b7280;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 8px;
          margin-top: 8px;
        }
        .haven-wallet-address {
          font-family: monospace;
          color: #9ca3af;
        }
        .haven-dev-toggle-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1a2233;
          border: 1px dashed rgba(212, 175, 55, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 18px;
          font-size: 12px;
        }
        .haven-dev-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .haven-mode-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .haven-dot-dev {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
        }
        .haven-dot-live {
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .haven-toggle-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #e5e7eb;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .haven-toggle-btn:hover {
          background: rgba(212, 175, 55, 0.2);
          color: #d4af37;
          border-color: #d4af37;
        }
        .haven-input-group {
          margin-bottom: 18px;
        }
        .haven-input-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
        }
        .haven-input-hint {
          font-size: 12px;
          color: #9ca3af;
          margin: 0 0 10px 0;
          line-height: 1.4;
        }
        .haven-text-input {
          width: 100%;
          background: #141a27;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 12px 14px;
          color: #ffffff;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .haven-text-input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
        }
        .haven-input-error {
          border-color: #ef4444;
        }
        .haven-error-msg {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
        }
        .haven-primary-btn {
          width: 100%;
          background: linear-gradient(135deg, #d4af37 0%, #b89728 100%);
          color: #0b0f19;
          font-weight: 700;
          font-size: 14px;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
        }
        .haven-primary-btn:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .haven-primary-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .haven-secondary-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s;
        }
        .haven-secondary-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .haven-email-confirmed-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #141a27;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 14px;
          font-size: 12px;
        }
        .haven-email-pill {
          color: #9ca3af;
          margin-right: 6px;
        }
        .haven-email-address {
          color: #d4af37;
          font-weight: 600;
        }
        .haven-edit-email-btn {
          background: transparent;
          border: none;
          color: #9ca3af;
          text-decoration: underline;
          cursor: pointer;
          font-size: 11px;
        }
        .haven-edit-email-btn:hover {
          color: #ffffff;
        }
        .haven-simulation-panel {
          background: #141a27;
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 12px;
          padding: 16px;
        }
        .haven-sim-header {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .haven-sim-icon {
          font-size: 22px;
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border-radius: 8px;
          padding: 4px 8px;
        }
        .haven-sim-header h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          color: #f59e0b;
        }
        .haven-sim-header p {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.4;
        }
        .haven-success-card {
          background: #0f1623;
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 8px;
          padding: 14px;
        }
        .haven-success-badge {
          color: #34d399;
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .haven-receipt-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 12px;
        }
        .haven-receipt-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 4px;
        }
        .haven-receipt-row span {
          color: #9ca3af;
        }
        .haven-hash-link {
          color: #60a5fa;
          text-decoration: none;
          font-family: monospace;
        }
        .haven-hash-link:hover {
          text-decoration: underline;
        }
        .haven-status-tag {
          color: #34d399;
          font-weight: 600;
        }
        .haven-note {
          font-size: 11px;
          color: #9ca3af;
          margin: 8px 0;
          line-height: 1.4;
        }
        .haven-gateway-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .haven-tab-btn {
          flex: 1;
          background: #141a27;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #9ca3af;
          padding: 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .haven-tab-active {
          background: #1e2638;
          border-color: #d4af37;
          color: #d4af37;
          font-weight: 600;
        }
        .haven-iframe-box {
          height: 480px;
          background: #090c14;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow: hidden;
        }
        .haven-embedded-frame {
          width: 100%;
          height: 100%;
          border: none;
        }
        .haven-security-footer {
          display: flex;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #6b7280;
          margin-top: 10px;
        }
        @keyframes havenFadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
