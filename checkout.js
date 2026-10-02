/* =============================================================================
   HAVEN HOUSE — CARD-TO-CRYPTO WEB3 CHECKOUT
   Self-contained vanilla JS + inline CSS. No framework, no build step.
   Drop checkout.js into any page and call HavenCheckout.open(options).
   ============================================================================= */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     ⚠️ CONFIGURE: Replace placeholder values with your real keys
     ───────────────────────────────────────────────────────────── */

  // NOWPayments live payment link — https://nowpayments.io
  var NOWPAYMENTS_LINK = 'https://nowpayments.io/payment/?iid=5340227667';

  // ⚠️️ CONFIGURE: Your Next.js webhook endpoint (for Resend receipt dispatch)
  var WEBHOOK_URL = 'http://localhost:3001/api/webhooks/payment';

  // ⚠️️ CONFIGURE: Dev webhook secret (must match PAYMENT_GATEWAY_WEBHOOK_SECRET in .env.local)
  var WEBHOOK_SECRET = 'hh_sandbox_whsec_dev_testing_123456';

  /* ─────────────────────────────────────────────────────────────
     INJECT MODAL & IN-PAGE CSS
     ───────────────────────────────────────────────────────────── */
  var styleTag = document.createElement('style');
  styleTag.textContent = [
    /* Floating trigger CTA button */
    '.hh-floating-cta{position:fixed;bottom:28px;right:28px;z-index:99998;background:linear-gradient(135deg,#182030 0%,#0c101a 100%);border:2px solid #d4af37;color:#fff;padding:12px 22px;border-radius:50px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.7),0 0 24px rgba(212,175,55,.35);transition:all .25s ease-out}',
    '.hh-floating-cta:hover{transform:translateY(-3px) scale(1.02);box-shadow:0 15px 40px rgba(0,0,0,.85),0 0 32px rgba(212,175,55,.55);border-color:#f59e0b}',
    '.hh-floating-badge{background:rgba(212,175,55,.2);color:#d4af37;font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid rgba(212,175,55,.4)}',
    
    /* In-page dedicated card banner for enter.html */
    '.hh-card-showcase{background:linear-gradient(135deg,#121722 0%,#0c101a 100%);border:2px solid rgba(212,175,55,.45);border-radius:16px;padding:32px;margin:28px auto 40px auto;max-width:760px;box-shadow:0 20px 50px rgba(0,0,0,.6),0 0 35px rgba(212,175,55,.15);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#f3f4f6}',
    '.hh-showcase-pill{display:inline-block;background:rgba(212,175,55,.15);color:#d4af37;border:1px solid rgba(212,175,55,.4);font-size:11px;font-weight:700;letter-spacing:1.8px;padding:3px 10px;border-radius:4px;margin-bottom:12px;text-transform:uppercase}',
    '.hh-showcase-title{margin:0 0 10px 0;font-size:24px;font-weight:700;color:#ffffff}',
    '.hh-showcase-desc{margin:0 0 24px 0;font-size:14px;color:#9ca3af;line-height:1.6}',
    '.hh-showcase-pkgs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px}',
    '.hh-showcase-pkg-btn{background:#182030;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 16px;color:#f3f4f6;text-align:left;cursor:pointer;transition:all .2s}',
    '.hh-showcase-pkg-btn:hover{border-color:#d4af37;background:#1e273b}',
    '.hh-showcase-pkg-btn.active{border:2px solid #d4af37;background:rgba(212,175,55,.12)}',
    '.hh-pkg-amount{font-size:18px;font-weight:700;color:#d4af37}',
    '.hh-pkg-sub{font-size:12px;color:#9ca3af;margin-top:2px}',
    '.hh-showcase-footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.08);padding-top:20px;flex-wrap:wrap;gap:16px}',
    '.hh-settle-info{font-size:12px;color:#9ca3af}',
    '.hh-settle-wallet{color:#34d399;font-weight:600;font-family:monospace}',
    '.hh-showcase-launch{background:linear-gradient(135deg,#d4af37 0%,#b89728 100%);color:#0b0f19;border:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;cursor:pointer;box-shadow:0 4px 14px rgba(212,175,55,.3);transition:all .2s}',
    '.hh-showcase-launch:hover{filter:brightness(1.08);transform:translateY(-1px)}',

    /* Modal Overlay & Card */
    '.hh-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(5,7,12,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;animation:hhFadeIn .2s ease-out}',
    '.hh-box{background:#0d111a;border:1px solid rgba(212,175,55,.3);box-shadow:0 25px 50px -12px rgba(0,0,0,.7),0 0 30px rgba(212,175,55,.12);border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;color:#f3f4f6;padding:24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
    '.hh-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}',
    '.hh-pill{display:inline-block;background:rgba(212,175,55,.15);color:#d4af37;border:1px solid rgba(212,175,55,.4);font-size:11px;font-weight:700;letter-spacing:1.5px;padding:2px 8px;border-radius:4px;margin-bottom:6px;text-transform:uppercase}',
    '.hh-title{margin:0;font-size:20px;font-weight:600;color:#fff}',
    '.hh-close{background:0;border:none;color:#9ca3af;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1}',
    '.hh-close:hover{color:#fff;background:rgba(255,255,255,.08)}',
    '.hh-order{background:#141a27;border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px 16px;margin-bottom:14px;font-size:13px}',
    '.hh-row{display:flex;justify-content:space-between;margin-bottom:7px}',
    '.hh-lbl{color:#9ca3af}',
    '.hh-val{color:#f3f4f6;font-weight:500}',
    '.hh-price{color:#d4af37;font-weight:700;font-size:15px}',
    '.hh-crypto{background:rgba(16,185,129,.15);color:#34d399;font-size:12px;padding:2px 8px;border-radius:4px;font-weight:600}',
    '.hh-wallet{display:flex;justify-content:space-between;font-size:11px;color:#6b7280;border-top:1px solid rgba(255,255,255,.06);padding-top:8px;margin-top:4px}',
    '.hh-wallet code{font-family:monospace;color:#9ca3af}',
    '.hh-modebar{display:flex;justify-content:space-between;align-items:center;background:#1a2233;border:1px dashed rgba(212,175,55,.3);border-radius:8px;padding:8px 12px;margin-bottom:16px;font-size:12px}',
    '.hh-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}',
    '.hh-dot--dev{background:#f59e0b;box-shadow:0 0 7px #f59e0b}',
    '.hh-dot--live{background:#10b981;box-shadow:0 0 7px #10b981}',
    '.hh-toggle{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#e5e7eb;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer}',
    '.hh-toggle:hover{background:rgba(212,175,55,.2);color:#d4af37;border-color:#d4af37}',
    '.hh-field{margin-bottom:16px}',
    '.hh-field label{display:block;font-size:14px;font-weight:600;color:#fff;margin-bottom:4px}',
    '.hh-field .hh-hint{font-size:12px;color:#9ca3af;margin:0 0 8px}',
    '.hh-input{width:100%;background:#141a27;border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:12px 14px;color:#fff;font-size:14px;outline:none;box-sizing:border-box}',
    '.hh-input:focus{border-color:#d4af37;box-shadow:0 0 0 2px rgba(212,175,55,.2)}',
    '.hh-input.err{border-color:#ef4444}',
    '.hh-err{color:#ef4444;font-size:12px;margin:4px 0 0}',
    '.hh-btn{width:100%;background:linear-gradient(135deg,#d4af37 0%,#b89728 100%);color:#0b0f19;font-weight:700;font-size:14px;padding:12px 16px;border:none;border-radius:8px;cursor:pointer;box-shadow:0 4px 12px rgba(212,175,55,.25);margin-top:4px}',
    '.hh-btn:hover{filter:brightness(1.07);transform:translateY(-1px)}',
    '.hh-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}',
    '.hh-btn-sec{width:100%;background:rgba(255,255,255,.07);color:#fff;font-weight:600;font-size:13px;padding:10px 14px;border:1px solid rgba(255,255,255,.15);border-radius:8px;cursor:pointer;margin-top:10px}',
    '.hh-btn-sec:hover{background:rgba(255,255,255,.13)}',
    '.hh-confirmed-bar{display:flex;justify-content:space-between;align-items:center;background:#141a27;padding:8px 12px;border-radius:8px;margin-bottom:14px;font-size:12px}',
    '.hh-confirmed-bar span{color:#9ca3af}',
    '.hh-confirmed-bar strong{color:#d4af37}',
    '.hh-edit{background:0;border:none;color:#9ca3af;text-decoration:underline;cursor:pointer;font-size:11px}',
    '.hh-sim-panel{background:#141a27;border:1px solid rgba(245,158,11,.3);border-radius:12px;padding:16px}',
    '.hh-sim-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}',
    '.hh-sim-icon{font-size:20px;background:rgba(245,158,11,.15);color:#f59e0b;border-radius:8px;padding:4px 8px}',
    '.hh-sim-head h4{margin:0 0 4px;font-size:14px;color:#f59e0b}',
    '.hh-sim-head p{margin:0;font-size:12px;color:#9ca3af;line-height:1.5}',
    '.hh-success{background:#0f1623;border:1px solid rgba(16,185,129,.4);border-radius:8px;padding:14px}',
    '.hh-success-badge{color:#34d399;font-weight:700;font-size:14px;margin-bottom:10px}',
    '.hh-receipt-row{display:flex;justify-content:space-between;font-size:12px;border-bottom:1px solid rgba(255,255,255,.05);padding:5px 0}',
    '.hh-receipt-row span{color:#9ca3af}',
    '.hh-receipt-row a{color:#60a5fa;text-decoration:none;font-family:monospace}',
    '.hh-receipt-row a:hover{text-decoration:underline}',
    '.hh-status-tag{color:#34d399;font-weight:600}',
    '.hh-note{font-size:11px;color:#9ca3af;margin:10px 0;line-height:1.5}',
    '.hh-tabs{display:flex;gap:8px;margin-bottom:12px}',
    '.hh-tab{flex:1;background:#141a27;border:1px solid rgba(255,255,255,.1);color:#9ca3af;padding:8px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer}',
    '.hh-tab.active{background:#1e2638;border-color:#d4af37;color:#d4af37;font-weight:700}',
    '.hh-iframe-box{height:460px;background:#090c14;border:1px solid rgba(255,255,255,.08);border-radius:8px;overflow:hidden}',
    '.hh-iframe-box iframe{width:100%;height:100%;border:none}',
    '.hh-security{display:flex;justify-content:center;gap:8px;font-size:11px;color:#6b7280;margin-top:10px}',
    '@keyframes hhFadeIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}'
  ].join('');
  document.head.appendChild(styleTag);

  /* ─────────────────────────────────────────────────────────────
     STATE
     ───────────────────────────────────────────────────────────── */
  var state = {
    open: false,
    email: '',
    emailConfirmed: false,
    devMode: true,          // starts in sandbox simulation mode — set false for live
    gateway: 'nowpayments',
    processing: false,
    result: null,
    error: '',
    amount: 150,
    title: 'Haven House — Deposit & Verification',
    onSuccess: null,
    onClose: null
  };

  /* ─────────────────────────────────────────────────────────────
     HELPERS
     ───────────────────────────────────────────────────────────── */
  function randomHex(bytes) {
    var out = '';
    for (var i = 0; i < bytes * 2; i++) {
      out += Math.floor(Math.random() * 16).toString(16);
    }
    return out;
  }

  function nowpaymentsUrl() {
    // Append the customer email as a query param for tracking
    return NOWPAYMENTS_LINK + '&customerEmail=' + encodeURIComponent(state.email);
  }

  /* ─────────────────────────────────────────────────────────────
     SIMULATE PAYMENT → CALL WEBHOOK → GET RESEND RECEIPT
     ───────────────────────────────────────────────────────────── */
  function runSimulation() {
    state.processing = true;
    state.error = '';
    state.result = null;
    render();

    var txHash = '0x' + randomHex(32);
    var orderId = 'HH-' + Date.now().toString(36).toUpperCase();

    var payload = {
      event: 'PAYMENT_COMPLETED',
      paymentStatus: 'completed',
      orderId: orderId,
      orderTitle: state.title,
      customerEmail: state.email,
      fiatAmount: state.amount,
      fiatCurrency: 'USD',
      cryptoAmount: state.amount,
      cryptoCurrency: 'USDC',
      txHash: txHash,
      recipientWallet: CLIENT_WALLET,
      timestamp: new Date().toISOString(),
      metadata: { buyerEmail: state.email, havenHouseProperty: state.title }
    };

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET,
        'x-simulation-mode': 'true'
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
    .then(function (r) {
      state.processing = false;
      if (!r.ok) throw new Error(r.data.error || 'Webhook error');
      state.result = Object.assign({}, payload, {
        emailStatus: r.data.emailDispatchStatus || 'Dispatched',
        receiptId: r.data.receiptId
      });
      if (state.onSuccess) state.onSuccess(state.result);
      render();
    })
    .catch(function (e) {
      state.processing = false;
      // If Next.js is not running, show offline receipt note
      state.result = Object.assign({}, payload, {
        emailStatus: 'Simulated locally (Start "npm.cmd run dev -- -p 3001" to trigger live Resend API)',
        receiptId: 'sim_' + Date.now()
      });
      if (state.onSuccess) state.onSuccess(state.result);
      render();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     BUILD HTML FOR MODAL
     ───────────────────────────────────────────────────────────── */
  function buildHtml() {
    var devDot = '<span class="hh-dot ' + (state.devMode ? 'hh-dot--dev' : 'hh-dot--live') + '"></span>';
    var modeLabel = state.devMode ? 'Dev Sandbox' : 'Live Web3 Gateway';

    /* ── Step 1: email collection ── */
    if (!state.emailConfirmed) {
      return [
        header(),
        orderBanner(),
        modeBar(devDot, modeLabel),
        '<div class="hh-field">',
          '<label for="hh-email-input">Step 1 — Enter buyer email for Resend receipt:</label>',
          '<p class="hh-hint">Your email is passed to the Web3 settlement gateway to dispatch an instant cryptographic proof receipt.</p>',
          '<input class="hh-input" id="hh-email-input" type="email" placeholder="buyer@havenhouse.com" value="' + escHtml(state.email) + '" autofocus>',
          state.error ? '<p class="hh-err">' + escHtml(state.error) + '</p>' : '',
        '</div>',
        '<button class="hh-btn" id="hh-email-btn">Continue to Payment Widget →</button>'
      ].join('');
    }

    /* ── Confirmed email bar ── */
    var emailBar = [
      '<div class="hh-confirmed-bar">',
        '<span>Receipt delivery to: <strong>' + escHtml(state.email) + '</strong></span>',
        '<button class="hh-edit" id="hh-change-email">Change Email</button>',
      '</div>'
    ].join('');

    /* ── Step 2a: Dev Simulation ── */
    if (state.devMode) {
      var inner;
      if (state.result) {
        inner = [
          '<div class="hh-success">',
            '<div class="hh-success-badge">✓ Payment Successfully Simulated</div>',
            '<div class="hh-receipt-row"><span>Order Ref:</span><strong>' + escHtml(state.result.orderId) + '</strong></div>',
            '<div class="hh-receipt-row"><span>Amount Paid (Card/Fiat):</span><strong>$' + state.result.fiatAmount + ' USD</strong></div>',
            '<div class="hh-receipt-row"><span>Settled directly in Vault:</span><strong style="color:#34d399">' + state.result.cryptoAmount + ' USDC</strong></div>',
            '<div class="hh-receipt-row"><span>Tx Hash:</span>',
              '<a href="https://etherscan.io/tx/' + state.result.txHash + '" target="_blank" rel="noopener">',
                state.result.txHash.slice(0, 10) + '...' + state.result.txHash.slice(-8) + ' ↗',
              '</a>',
            '</div>',
            '<div class="hh-receipt-row"><span>Resend Receipt Status:</span><span class="hh-status-tag">' + escHtml(state.result.emailStatus) + '</span></div>',
          '</div>',
          '<p class="hh-note">Receipt generated for <u>' + escHtml(state.email) + '</u>. Official Haven House confirmation recorded.</p>',
          '<button class="hh-btn-sec" id="hh-again">Run Another Simulation</button>'
        ].join('');
      } else {
        inner = [
          '<button class="hh-btn hh-sim-btn" id="hh-simulate" ' + (state.processing ? 'disabled' : '') + '>',
            state.processing
              ? 'Processing Webhook & Dispatching Receipt…'
              : 'Simulate $' + state.amount + ' Card Payment & Send Receipt',
          '</button>',
          state.error ? '<p class="hh-err" style="margin-top:8px">' + escHtml(state.error) + '</p>' : ''
        ].join('');
      }

      return [
        header(),
        orderBanner(),
        modeBar(devDot, modeLabel),
        emailBar,
        '<div class="hh-sim-panel">',
          '<div class="hh-sim-head">',
            '<div class="hh-sim-icon">⚡</div>',
            '<div><h4>Dev Sandbox Active</h4>',
              '<p>Simulates Card-to-Crypto settlement directly into Haven House wallet and dispatches automated email receipt via Resend.</p>',
            '</div>',
          '</div>',
          inner,
        '</div>'
      ].join('');
    }

    /* ── Step 2b: Live NOWPayments widget ── */
    return [
      header(),
      orderBanner(),
      modeBar(devDot, modeLabel),
      emailBar,
      '<div class="hh-iframe-box">',
        '<iframe src="' + nowpaymentsUrl() + '" allow="camera;microphone;payment" title="NOWPayments Secure Checkout"></iframe>',
      '</div>',
      '<div class="hh-security">🔒 Secured by NOWPayments · 300+ Cryptocurrencies Accepted · Direct Wallet Settlement</div>'
    ].join('');
  }

  function header() {
    return [
      '<div class="hh-header">',
        '<div><div class="hh-pill">Haven House</div><h3 class="hh-title">Card to Crypto Checkout</h3></div>',
        '<button class="hh-close" id="hh-close" aria-label="Close">✕</button>',
      '</div>'
    ].join('');
  }

  function orderBanner() {
    return [
      '<div class="hh-order">',
        '<div class="hh-row"><span class="hh-lbl">Item</span><span class="hh-val">' + escHtml(state.title) + '</span></div>',
        '<div class="hh-row"><span class="hh-lbl">Amount (Card / Fiat)</span><span class="hh-price">$' + state.amount.toFixed(2) + ' USD</span></div>',
        '<div class="hh-row"><span class="hh-lbl">Settled In</span><span class="hh-crypto">Crypto — via NOWPayments</span></div>',
      '</div>'
    ].join('');
  }

  function modeBar(dot, label) {
    return [
      '<div class="hh-modebar">',
        '<span>' + dot + 'Mode: <strong>' + label + '</strong></span>',
        '<button class="hh-toggle" id="hh-mode-toggle">Switch to ' + (state.devMode ? 'Live Gateway' : 'Dev Sandbox') + '</button>',
      '</div>'
    ].join('');
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER MODAL
     ───────────────────────────────────────────────────────────── */
  var overlay = null;

  function render() {
    if (!overlay) return;
    overlay.querySelector('.hh-box').innerHTML = buildHtml();
    bindEvents();
  }

  function bindEvents() {
    var box = overlay.querySelector('.hh-box');

    /* close */
    var closeBtn = box.querySelector('#hh-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    /* close on overlay click */
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

    /* mode toggle */
    var modeBtn = box.querySelector('#hh-mode-toggle');
    if (modeBtn) modeBtn.addEventListener('click', function () {
      state.devMode = !state.devMode;
      state.result = null;
      state.error = '';
      render();
    });

    /* email confirm */
    var emailBtn = box.querySelector('#hh-email-btn');
    if (emailBtn) emailBtn.addEventListener('click', function () {
      var inp = box.querySelector('#hh-email-input');
      var val = inp.value.trim();
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        state.error = 'Please enter a valid email address.';
        inp.classList.add('err');
        render();
        return;
      }
      state.email = val;
      state.emailConfirmed = true;
      state.error = '';
      render();
    });

    /* allow Enter key on email field */
    var emailInp = box.querySelector('#hh-email-input');
    if (emailInp) {
      emailInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); emailBtn && emailBtn.click(); }
      });
    }

    /* change email */
    var changeBtn = box.querySelector('#hh-change-email');
    if (changeBtn) changeBtn.addEventListener('click', function () {
      state.emailConfirmed = false;
      state.result = null;
      state.error = '';
      render();
    });

    /* simulate */
    var simBtn = box.querySelector('#hh-simulate');
    if (simBtn) simBtn.addEventListener('click', runSimulation);

    /* run again */
    var againBtn = box.querySelector('#hh-again');
    if (againBtn) againBtn.addEventListener('click', function () { state.result = null; render(); });

    /* gateway tabs */
    box.querySelectorAll('[data-gw]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.gateway = this.getAttribute('data-gw');
        render();
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     OPEN / CLOSE MODAL
     ───────────────────────────────────────────────────────────── */
  function openModal(options) {
    options = options || {};
    state.amount    = options.amount    || 25;
    state.title     = options.title     || 'Haven House — Draw Entry';
    state.onSuccess = options.onSuccess || null;
    state.onClose   = options.onClose   || null;
    state.email     = options.email     || '';
    state.emailConfirmed = !!state.email;
    state.result    = null;
    state.error     = '';
    state.processing = false;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'hh-overlay';
      overlay.innerHTML = '<div class="hh-box"></div>';
      document.body.appendChild(overlay);
    }
    document.body.style.overflow = 'hidden';

    render();
  }

  function closeModal() {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
      overlay = null;
    }
    document.body.style.overflow = '';
    if (state.onClose) state.onClose();
  }

  /* ─────────────────────────────────────────────────────────────
     PUBLIC API
     ───────────────────────────────────────────────────────────── */
  window.HavenCheckout = {
    open: openModal,
    close: closeModal
  };

  /* ─────────────────────────────────────────────────────────────
     PAGE ENHANCEMENTS: Floating Button & In-Page Showcase
     ───────────────────────────────────────────────────────────── */
  function initPageElements() {

    /* 1. Inject persistent Floating "Pay with Card" CTA on all pages */
    if (!document.getElementById('hh-floating-cta')) {
      var floatBtn = document.createElement('button');
      floatBtn.id = 'hh-floating-cta';
      floatBtn.className = 'hh-floating-cta';
      floatBtn.innerHTML = '<span>💳</span><span>Pay with Card (Web3 Checkout)</span><span class="hh-floating-badge">USDC</span>';
      floatBtn.setAttribute('title', 'Pay via Credit/Debit Card converted directly to client USDC wallet');
      floatBtn.addEventListener('click', function (e) {
        e.preventDefault();
        HavenCheckout.open({ amount: 25, title: 'Haven House — 5 Entries ($25 USD)' });
      });
      document.body.appendChild(floatBtn);
    }

    /* 2. On enter.html: Inject dedicated Card-to-Crypto Checkout Showcase */
    var isEnterPage = window.location.pathname.indexOf('enter.html') !== -1 || document.querySelector('.page-head h1');
    if (isEnterPage && !document.getElementById('hh-card-showcase')) {
      var mainEl = document.getElementById('main') || document.body;
      var targetSection = document.querySelector('.page-head') || mainEl.firstChild;

      var showcase = document.createElement('div');
      showcase.id = 'hh-card-showcase';
      showcase.className = 'hh-card-showcase';
      showcase.innerHTML = [
        '<div class="hh-showcase-pill">HAVEN HOUSE &bull; WEB3 CHECKOUT SYSTEM</div>',
        '<h2 class="hh-showcase-title">Pay via Credit / Debit Card</h2>',
        '<p class="hh-showcase-desc">Enter the draw with any card in USD. Payments are automatically converted and settled directly into the Haven House USDC treasury vault, with cryptographic proof and an automated Resend receipt delivered to your inbox.</p>',
        '<div class="hh-showcase-pkgs">',
          '<button type="button" class="hh-showcase-pkg-btn" data-amt="5" data-title="Haven House — 1 Entry ($5 USD)">',
            '<div class="hh-pkg-amount">$5.00 USD</div>',
            '<div class="hh-pkg-sub">1 Entry &bull; Settles 5 USDC</div>',
          '</button>',
          '<button type="button" class="hh-showcase-pkg-btn active" data-amt="25" data-title="Haven House — 5 Entries ($25 USD)">',
            '<div class="hh-pkg-amount">$25.00 USD <span style="font-size:11px;background:#d4af37;color:#0b0f19;padding:1px 6px;border-radius:4px;margin-left:4px">Best Value</span></div>',
            '<div class="hh-pkg-sub">5 Entries &bull; Settles 25 USDC</div>',
          '</button>',
          '<button type="button" class="hh-showcase-pkg-btn" data-amt="100" data-title="Haven House — VIP Package ($100 USD)">',
            '<div class="hh-pkg-amount">$100.00 USD</div>',
            '<div class="hh-pkg-sub">VIP Package &bull; Settles 100 USDC</div>',
          '</button>',
        '</div>',
        '<div class="hh-showcase-footer">',
          '<div class="hh-settle-info">',
            '<div>Settlement Destination: <span class="hh-settle-wallet">' + shortWallet(CLIENT_WALLET) + '</span></div>',
            '<div style="margin-top:3px;color:#9ca3af">Automated Receipts: <strong style="color:#d4af37">Resend API Enabled</strong></div>',
          '</div>',
          '<button type="button" class="hh-showcase-launch" id="hh-showcase-launch-btn">',
            'Open Card Checkout ($25 USD) →',
          '</button>',
        '</div>'
      ].join('');

      if (targetSection && targetSection.nextSibling) {
        targetSection.parentNode.insertBefore(showcase, targetSection.nextSibling);
      } else {
        mainEl.appendChild(showcase);
      }

      /* Package button switching */
      var currentAmt = 25;
      var currentTitle = 'Haven House — 5 Entries ($25 USD)';
      var launchBtn = document.getElementById('hh-showcase-launch-btn');

      showcase.querySelectorAll('.hh-showcase-pkg-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          showcase.querySelectorAll('.hh-showcase-pkg-btn').forEach(function (b) { b.classList.remove('active'); });
          this.classList.add('active');
          currentAmt = parseFloat(this.getAttribute('data-amt'));
          currentTitle = this.getAttribute('data-title');
          launchBtn.textContent = 'Open Card Checkout ($' + currentAmt + ' USD) →';
        });
      });

      launchBtn.addEventListener('click', function () {
        HavenCheckout.open({ amount: currentAmt, title: currentTitle });
      });
    }

    /* 3. Intercept all "Enter the Draw" buttons on index.html / property.html */
    document.addEventListener('click', function (e) {
      var enterLink = e.target.closest('[data-entry-link], a[href*="enter.html"]');
      if (enterLink && !window.location.pathname.endsWith('enter.html')) {
        e.preventDefault();
        e.stopPropagation();
        HavenCheckout.open({ amount: 25, title: 'Haven House — 5 Entries ($25 USD)' });
      }
    }, true); /* capture phase */

  }

  /* Run immediately or upon DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageElements);
  } else {
    initPageElements();
  }

})();
