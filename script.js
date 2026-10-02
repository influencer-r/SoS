/* ==========================================================================
   HAVEN HOUSE — site behaviour (script.js)
   --------------------------------------------------------------------------
   Plain vanilla JS. No dependencies. Nothing is stored on a server from this
   file and nothing here processes payment card data.

   ── CAMPAIGN CONTROL ────────────────────────────────────────────────────
   The owner (or a future backend) only needs to edit CAMPAIGN_CONFIG below.
   The promotion is NOT open. Entry stays closed until the owner sets
   CAMPAIGN_CONFIG.open = true AND a lawyer-approved closing date exists.
   ========================================================================== */

"use strict";

/* --------------------------------------------------------------------------
   CAMPAIGN CONFIG — the single source of truth
   ------------------------------------------------------------------------ */
const CAMPAIGN_CONFIG = {
  /* Master switch. The owner flips this to true ONLY after legal review
     is complete and the Official Rules are published. Until then every
     entry action on the site is disabled, everywhere. */
  open: false,

  /* Official closing date. Replace with the lawyer-approved date/time
     (ISO 8601, local time). While `open` is false the countdown still
     previews, but entry remains closed and this date is labelled
     "projected" in the UI. */
  CAMPAIGN_END_DATE: "2026-11-01T17:00:00",

  /* Admin-ready hooks: a future backend can supply these instead of the
     static values above. Values here are placeholders, not real data. */
  backend: {
    /* e.g. async () => fetch("/api/campaign").then(r => r.json()) */
    fetchStatus: null,
  },
};

const PROPERTY = {
  name: "Haven House",
  address: {
    street: "2650 SW 22nd Court",
    city: "Gresham",
    state: "Oregon",
    zip: "97080",
    country: "USA",
  },
};

/* Oregon + neighbouring/presented states shown in the eligibility select.
   This is a UI convenience only — the definitive list of eligible
   jurisdictions comes from the published Official Rules. */
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","Washington, D.C.",
  "West Virginia","Wisconsin","Wyoming",
];

const REDUCED_MOTION =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ==========================================================================
   UTILITIES
   ========================================================================== */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function pad2(n) { return String(n).padStart(2, "0"); }

/* ==========================================================================
   CAMPAIGN STATUS (admin-ready)
   --------------------------------------------------------------------------
   Resolves the campaign state, allowing a future backend to override the
   static config. Returns a plain status object used by the countdown and
   every entry gate on the site.
   ========================================================================== */
async function getCampaignStatus() {
  const status = {
    open: CAMPAIGN_CONFIG.open === true,
    closesAt: new Date(CAMPAIGN_CONFIG.CAMPAIGN_END_DATE),
    dateIsPlaceholder: !CAMPAIGN_CONFIG.open, // "projected" until owner activates
    entryCount: null,        // future backend: real entry tally
    packagesAvailable: true, // future backend: package availability
    paymentStatus: null,     // future backend: "pending" | "paid" | "failed"
    winner: null,            // future backend: winner record
  };
  if (typeof CAMPAIGN_CONFIG.backend.fetchStatus === "function") {
    try {
      const remote = await CAMPAIGN_CONFIG.backend.fetchStatus();
      if (remote && typeof remote === "object") Object.assign(status, remote);
    } catch (err) {
      /* Backend unreachable — fall back to static config silently. */
      console.warn("Campaign status fetch failed; using local config.", err);
    }
  }
  return status;
}

/* ==========================================================================
   COUNTDOWN
   ========================================================================== */
function initCountdown(status) {
  const panel = $("[data-countdown-panel]");
  if (!panel) return;

  const endsAt = status.closesAt;
  const units = {
    days:    $("[data-unit='days']", panel),
    hours:   $("[data-unit='hours']", panel),
    minutes: $("[data-unit='minutes']", panel),
    seconds: $("[data-unit='seconds']", panel),
  };
  const note = $("[data-countdown-note]");

  /* Label the date honestly while the promotion is closed. */
  if (note && status.dateIsPlaceholder) {
    note.textContent =
      "Projected closing date shown for planning — the official date will be " +
      "published with the final rules.";
  }

  let closed = false;
  let timer = null;

  function render(msRemaining) {
    if (msRemaining <= 0) { setClosed(); return; }
    const totalSeconds = Math.floor(msRemaining / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    setUnit(units.days,    String(days));
    setUnit(units.hours,   pad2(hours));
    setUnit(units.minutes, pad2(minutes));
    setUnit(units.seconds, pad2(seconds));
  }

  function setUnit(el, value) {
    if (!el) return;
    if (REDUCED_MOTION) { el.textContent = value; return; }
    if (el.textContent === value) return;
    const old = el.textContent;
    el.textContent = value;
    if (old !== "" && el.animate) {
      el.animate(
        [{ transform: "translateY(45%)", opacity: 0 },
         { transform: "translateY(0)", opacity: 1 }],
        { duration: 420, easing: "cubic-bezier(.22,.61,.21,1)" }
      );
    }
  }

  function setClosed() {
    if (closed) return;
    closed = true;
    if (timer) clearInterval(timer);
    panel.classList.add("is-closed");
    const pill = $(".status-pill");
    if (pill) {
      pill.classList.add("is-closed");
      pill.innerHTML = "Entry period closed";
    }
    /* Close every entry path on the site. */
    lockEntryInterface();
    document.dispatchEvent(new CustomEvent("campaign:closed"));
  }

  function tick() {
    render(endsAt.getTime() - Date.now());
  }

  tick();
  if (!closed) timer = setInterval(tick, 1000);
}

/* ==========================================================================
   ENTRY GATE — one function the whole site obeys
   ========================================================================== */
function lockEntryInterface() {
  $$("[data-entry-link]").forEach((a) => {
    a.setAttribute("aria-disabled", "true");
    a.href = "enter.html";
    a.classList.add("is-locked");
  });
  $$("[data-entry-gate]").forEach((el) => {
    el.setAttribute("data-gate-locked", "true");
  });
  const banner = $("[data-closed-banner]");
  if (banner) banner.hidden = false;
  /* If the full entry flow is on this page, retire it immediately. */
  const entryForm = $("[data-entry-form]");
  if (entryForm) entryForm.hidden = true;
  const aside = $(".entry-aside");
  if (aside) aside.hidden = true;
  const closedPanel = $("[data-entry-closed]");
  if (closedPanel) closedPanel.hidden = false;
  const liveNote = $("[data-live-closed]");
  if (liveNote) liveNote.hidden = false;
}

function initEntryGate(status) {
  if (!status.open || status.closesAt.getTime() <= Date.now()) {
    lockEntryInterface();
  }
  document.addEventListener("campaign:closed", lockEntryInterface);

  /* Click guard for locked entry links. */
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-entry-link]");
    if (link && link.classList.contains("is-locked")) {
      e.preventDefault();
      showGateNotice();
    }
  });

  function showGateNotice() {
    let banner = $("[data-closed-banner]");
    if (!banner) {
      banner = document.createElement("div");
      banner.setAttribute("data-closed-banner", "");
      banner.className = "legal-banner";
      banner.style.cssText =
        "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);" +
        "z-index:250;max-width:min(92vw,560px);margin:0;box-shadow:var(--shadow-soft);";
      banner.innerHTML =
        "<h2 style='font-size:.72rem;letter-spacing:.2em'>Entry period closed</h2>" +
        "<p>The Haven House Draw is not currently accepting entries. " +
        "Status: pending legal review.</p>";
      document.body.appendChild(banner);
      setTimeout(() => {
        banner.style.transition = "opacity .5s";
        banner.style.opacity = "0";
        setTimeout(() => banner.remove(), 550);
      }, 4200);
    }
  }
}

/* ==========================================================================
   TOPBAR + MOBILE NAV
   ========================================================================== */
function initTopbar() {
  const topbar = $(".topbar");
  if (!topbar) return;
  const onScroll = () => {
    topbar.classList.toggle("topbar--solid", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileNav() {
  const toggle = $(".nav-toggle");
  const drawer = $(".mobile-drawer");
  if (!toggle || !drawer) return;

  function setOpen(open) {
    drawer.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      $$(".mobile-drawer a", drawer).forEach((a, i) => {
        a.style.transitionDelay = REDUCED_MOTION ? "0s" : `${0.05 + i * 0.045}s`;
      });
    }
  }

  toggle.addEventListener("click", () =>
    setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("a") || e.target === drawer) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) setOpen(false);
  });
}

/* ==========================================================================
   SCROLL REVEAL
   ========================================================================== */
function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;
  if (REDUCED_MOTION || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }
  /* Elements pre-marked in-view in the HTML (above the fold) are reset so
     the entrance animation still plays once on load. */
  items.forEach((el) => el.classList.remove("in-view"));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  items.forEach((el) => io.observe(el));
}

/* Gentle parallax on featured media — desktop pointers only. */
function initParallax() {
  if (REDUCED_MOTION || !window.matchMedia("(pointer: fine)").matches) return;
  const media = $$("[data-parallax]");
  if (!media.length) return;
  let ticking = false;
  function update() {
    const vh = window.innerHeight;
    media.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const progress = (r.top + r.height / 2 - vh / 2) / vh; /* -0.5 … 0.5 */
      const img = el.tagName === "IMG" ? el : $("img", el);
      if (img) img.style.transform = `translateY(${progress * -3.5}%) scale(1.08)`;
    });
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

/* ==========================================================================
   FILM / VIDEO PLAYER (aerial tour)
   ========================================================================== */
function initFilm() {
  $$("[data-film]").forEach((wrap) => {
    const video = $("video", wrap);
    const poster = $(".film__poster", wrap);
    const play = $(".film__play", wrap);
    const fallback = $(".film__fallback", wrap);
    if (!video) return;

    function start() {
      wrap.classList.add("is-playing");
      video.controls = true;
      const p = video.play();
      if (p && p.catch) {
        p.catch(() => {
          wrap.classList.remove("is-playing");
          video.controls = true; /* let the native button handle it */
        });
      }
    }

    if (play) play.addEventListener("click", start);
    if (poster) poster.addEventListener("click", start);
    video.addEventListener("play", () => wrap.classList.add("is-playing"));
    video.addEventListener("pause", () => {
      /* Keep overlay hidden once started; controls remain available. */
    });
    video.addEventListener("error", () => {
      wrap.classList.add("video-failed");
    });
    /* Source exists but can't decode → treat as failed. */
    $$("source", video).forEach((s) => {
      s.addEventListener("error", () => wrap.classList.add("video-failed"));
    });
  });

  /* Homepage muted ambient preview: only with user's motion preference and
     if the browser allows autoplay. Never hides the manual play experience. */
  const preview = $("[data-film-preview] video");
  if (preview && !REDUCED_MOTION) {
    preview.muted = true;
    const attempt = preview.play();
    if (attempt && attempt.catch) {
      attempt.catch(() => {
        const wrap = preview.closest("[data-film-preview]");
        if (wrap) wrap.classList.add("no-overlay");
      });
    }
  }
}

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
function initFaq() {
  const faq = $("[data-faq]");
  if (!faq) return;
  const single = faq.getAttribute("data-faq") === "single";

  $$(".faq-item", faq).forEach((item) => {
    const btn = $("button", item);
    btn.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      if (single) {
        $$(".faq-item.open", faq).forEach((other) => {
          other.classList.remove("open");
          $("button", other).setAttribute("aria-expanded", "false");
        });
      }
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

/* ==========================================================================
   GALLERY + LIGHTBOX (property.html)
   ========================================================================== */
const GALLERY_CAPTIONS = {
  "property-01.jpg": "Grounds & mature landscaping",
  "property-02.jpg": "Backing to serene greenspace",
  "property-03.jpg": "The greenway edge of the lot",
  "property-04.jpg": "Front elevation & approach",
  "property-05.jpg": "Formal entry",
  "property-06.jpg": "Living room",
  "property-07.jpg": "Vaulted living room, picture windows",
  "property-08.jpg": "Dining room",
  "property-09.jpg": "Gourmet kitchen & center island",
  "property-10.jpg": "Kitchen — granite & oak cabinetry",
  "property-11.jpg": "Garden paths & plantings",
  "property-12.jpg": "Family room & brick gas fireplace",
  "property-13.jpg": "Family room detail",
  "property-14.jpg": "Primary bedroom",
  "property-15.jpg": "Primary suite",
  "property-16.jpg": "Bedroom two",
  "property-17.jpg": "Bedroom three",
  "property-18.jpg": "Bedroom four",
  "property-19.jpg": "Private bath — dual vanities",
  "property-20.jpg": "Primary bath — walk-in shower & skylight",
  "property-21.jpg": "Office / den",
  "property-22.jpg": "Bonus room — vaulted ceilings",
  "property-23.jpg": "Bright interior detail",
};

function initGallery() {
  const gallery = $("[data-gallery]");
  if (!gallery) return;

  const figures = $$(".gallery-item", gallery);
  const slides = figures.map((fig) => ({
    src: $("img", fig).getAttribute("src"),
    alt: $("img", fig).getAttribute("alt") || "",
    caption: (GALLERY_CAPTIONS[srcFile($("img", fig).getAttribute("src"))] || ""),
  }));

  const lb = $("[data-lightbox]");
  const lbImg  = $(".lightbox__img", lb);
  const lbCap  = $(".lightbox__caption", lb);
  const lbCount= $(".lightbox__count", lb);
  let index = 0;

  function srcFile(src) { return src.split("/").pop(); }

  function openLightbox(i) {
    index = i;
    updateLightbox();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    $(".lightbox__close", lb).focus();
  }

  function updateLightbox() {
    const s = slides[index];
    lbImg.src = s.src;
    lbImg.alt = s.alt;
    lbCap.textContent = s.caption;
    lbCount.textContent = `${index + 1} / ${slides.length}`;
    /* restart the reveal animation */
    lbImg.style.animation = "none";
    void lbImg.offsetWidth;
    lbImg.style.animation = "";
  }

  function move(dir) {
    index = (index + dir + slides.length) % slides.length;
    updateLightbox();
  }

  function closeLightbox() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }

  figures.forEach((fig, i) => {
    fig.setAttribute("tabindex", "0");
    fig.setAttribute("role", "button");
    fig.setAttribute("aria-label", `View image ${i + 1} of ${figures.length}`);
    fig.addEventListener("click", () => openLightbox(i));
    fig.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); }
    });
  });

  $(".lightbox__close", lb).addEventListener("click", closeLightbox);
  $(".lightbox__nav--prev", lb).addEventListener("click", () => move(-1));
  $(".lightbox__nav--next", lb).addEventListener("click", () => move(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape")     closeLightbox();
    if (e.key === "ArrowLeft")  move(-1);
    if (e.key === "ArrowRight") move(1);
  });

  /* touch swipe */
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 48) move(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });
}

/* ==========================================================================
   COUNT-UP NUMBERS (stat band) — displays supplied facts only
   ========================================================================== */
function initCountUp() {
  const nums = $$("[data-count]");
  if (!nums.length) return;
  if (REDUCED_MOTION || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      io.unobserve(el);
      const target = parseFloat(el.getAttribute("data-count"));
      const decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
      const suffix = el.getAttribute("data-suffix") || "";
      const dur = 1400;
      const t0 = performance.now();
      (function frame(t) {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      })(t0);
    });
  }, { threshold: 0.5 });
  nums.forEach((el) => io.observe(el));
}

/* ==========================================================================
   ENTRY FLOW (enter.html)
   --------------------------------------------------------------------------
   Three steps: package → participant details → payment placeholder.
   No card data is ever read, held, validated or transmitted by this file.
   ========================================================================== */
const ENTRY_PACKAGES = [
  { id: "single", price: 5,  entries: 1, desc: "A single entry in the Haven House Draw. Every entry receives equal standing." },
  { id: "five",   price: 25, entries: 5, desc: "Five entries at the bundled rate. Every entry receives equal standing." },
];

function initEntryForm(status) {
  const form = $("[data-entry-form]");
  if (!form) return;

  const steps = $$(".entry-step", form);
  const progressSteps = $$(".progress__step");
  let current = 0;
  let selected = null;

  /* --- step 1: packages ------------------------------------------------- */
  const pkgWrap = $("[data-packages]", form);
  ENTRY_PACKAGES.forEach((pkg) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "package";
    btn.setAttribute("aria-pressed", "false");
    btn.dataset.pkg = pkg.id;
    btn.innerHTML = `
      ${pkg.id === "five" ? '<span class="package__badge">Best value</span>' : ""}
      <div class="package__price"><sup>$</sup>${pkg.price}</div>
      <div class="package__entries">${pkg.entries} ${pkg.entries === 1 ? "Entry" : "Entries"}</div>
      <p class="package__desc">${pkg.desc}</p>
      <span class="package__check" aria-hidden="true">
        <svg viewBox="0 0 16 16"><path d="M2.5 8.5l3.5 3.5 7-8"/></svg>
      </span>`;
    btn.addEventListener("click", () => {
      selected = pkg;
      $$(".package", pkgWrap).forEach((b) =>
        b.setAttribute("aria-pressed", String(b === btn)));
      updateAside();
    });
    pkgWrap.appendChild(btn);
  });

  /* --- aside summary ----------------------------------------------------- */
  function updateAside() {
    const rows = {
      pkg:  $("[data-aside-package]"),
      qty:  $("[data-aside-entries]"),
      amt:  $("[data-aside-amount]"),
      name: $("[data-aside-name]"),
    };
    if (rows.pkg)  rows.pkg.textContent  = selected ? `$${selected.price} package` : "—";
    if (rows.qty)  rows.qty.textContent  = selected ? String(selected.entries) : "—";
    if (rows.amt)  rows.amt.textContent  = selected ? `$${selected.price}.00` : "—";
    if (rows.name) {
      const n = $("#f-name", form);
      rows.name.textContent = n && n.value.trim() ? n.value.trim() : "—";
    }
  }
  form.addEventListener("input", updateAside);

  /* --- step navigation --------------------------------------------------- */
  function show(i) {
    current = i;
    steps.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    progressSteps.forEach((p, idx) => {
      p.classList.toggle("is-active", idx === i);
      p.classList.toggle("is-done", idx < i);
    });
    const aside = $(".entry-aside");
    if (aside) aside.hidden = false;
    updateAside();
    window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 120, behavior: REDUCED_MOTION ? "auto" : "smooth" });
  }

  function validateStep2() {
    let ok = true;
    const name  = $("#f-name");
    const email = $("#f-email");
    const phone = $("#f-phone");
    const state = $("#f-state");
    ok = mark(name,  name.value.trim().length >= 2, "Please enter your full legal name.") && ok;
    ok = mark(email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()), "Please enter a valid email address.") && ok;
    ok = mark(phone, phone.value.replace(/\D/g, "").length >= 7, "Please enter a valid phone number.") && ok;
    ok = mark(state, state.value !== "", "Please select your state.") && ok;
    ["c-age", "c-rules", "c-privacy"].forEach((id) => {
      const box = document.getElementById(id);
      const field = box.closest(".check-line");
      if (!box.checked) {
        ok = false;
        field.style.animation = "none";
        void field.offsetWidth;
        field.style.animation = "fieldShake .4s";
        field.style.color = "var(--bronze)";
      } else {
        field.style.color = "";
      }
    });
    return ok;
  }

  function mark(input, valid, message) {
    const field = input.closest(".field");
    const err = $(".field-error", field);
    if (!valid) {
      field.classList.add("is-invalid");
      if (err) err.textContent = message;
      return false;
    }
    field.classList.remove("is-invalid");
    return true;
  }

  $$("[data-next]", form).forEach((btn) => {
    btn.addEventListener("click", () => {
      if (current === 0) {
        if (!selected) {
          const grid = $("[data-packages]", form);
          grid.style.animation = "none";
          void grid.offsetWidth;
          grid.style.animation = "fieldShake .4s";
          return;
        }
        show(1);
      } else if (current === 1) {
        if (validateStep2()) show(2);
      }
    });
  });
  $$("[data-back]", form).forEach((btn) => {
    btn.addEventListener("click", () => show(current - 1));
  });

  /* --- payment placeholder ---------------------------------------------- */
  const payBtn = $("[data-pay-submit]", form);
  const payNotice = $("[data-pay-notice]", form);

  payBtn.addEventListener("click", () => {
    if (!selected) { show(0); return; }
    const entryData = {
      package: selected.id,
      amount: selected.price,
      entries: selected.entries,
      participant: {
        fullName: $("#f-name", form).value.trim(),
        email: $("#f-email", form).value.trim(),
        phone: $("#f-phone", form).value.trim(),
        state: $("#f-state", form).value,
      },
    };
    initializePaymentCheckout(entryData);
  });

  /* --- confirmation renderer (for future real payment flow) -------------- */
  function renderConfirmation(result) {
    /* result: { reference, amount, entries, participant, date } */
    form.hidden = true;
    const aside = $(".entry-aside");
    if (aside) aside.hidden = true;
    const panel = $("[data-confirmation]");
    panel.hidden = false;
    const set = (sel, val) => { const el = $(sel, panel); if (el) el.textContent = val; };
    set("[data-c-name]", result.participant.fullName);
    set("[data-c-email]", result.participant.email);
    set("[data-c-entries]", String(result.entries));
    set("[data-c-ref]", result.reference);
    set("[data-c-amount]", `$${result.amount}.00`);
    set("[data-c-date]", result.date);
    panel.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "start" });
  }

  /* Expose for the future integration to call after a verified success. */
  window.havenShowEntryConfirmation = renderConfirmation;

  /* Populate state select. */
  const stateSel = $("#f-state");
  if (stateSel) {
    US_STATES.forEach((s) => {
      const o = document.createElement("option");
      o.value = s; o.textContent = s;
      stateSel.appendChild(o);
    });
  }

  if (!status.open) {
    /* The promotion is closed: replace the flow with the closed state. */
    form.hidden = true;
    const aside = $(".entry-aside");
    if (aside) aside.hidden = true;
    const closedPanel = $("[data-entry-closed]");
    if (closedPanel) closedPanel.hidden = false;
  } else {
    const closedPanel = $("[data-entry-closed]");
    if (closedPanel) closedPanel.hidden = true;
  }

  show(0);
}

/* ==========================================================================
   PAYMENT INTEGRATION SEAM
   --------------------------------------------------------------------------
   This is the ONLY place payment ever touches. It receives validated,
   non-sensitive entry data (package, participant contact details) and must
   hand off to the approved provider's hosted checkout or tokenized flow.

   Rules for the future integration:
     • Never send raw card data to this website or its own backend.
     • Secrets/keys belong in a server-side integration, never here.
     • Only call window.havenShowEntryConfirmation(...) after the provider
       has verifiably confirmed payment.
   ========================================================================== */
function initializePaymentCheckout(entryData) {
  /* PAYMENT PROVIDER INTEGRATION GOES HERE
     ---------------------------------------------------------------
     Example shape (illustrative only — not active code):

       const session = await fetch("/api/checkout-session", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(entryData),   // NO card data, ever
       }).then(r => r.json());

       window.location.href = session.hostedCheckoutUrl;
       // after provider confirms → provider redirects back and the
       // backend calls a confirmation endpoint; only then:
       // window.havenShowEntryConfirmation(verifiedResult);
  */

  const notice = $("[data-pay-notice]");
  if (notice) {
    notice.textContent =
      "Payment integration pending legal and payment-provider approval. " +
      "No payment has been taken and no entry has been recorded.";
    notice.classList.add("show");
  }
  /* Deliberately no confirmation screen, no fake reference number, and no
     "success" state: the promotion is not open and payment does not exist
     yet. */
}

/* ==========================================================================
   PLAIN FORMS (contact page) — front-end only, clearly labelled
   ========================================================================== */
function initContactForm() {
  const form = $("[data-contact-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    ["cf-name", "cf-email", "cf-message"].forEach((id) => {
      const input = document.getElementById(id);
      const valid = id === "cf-email"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())
        : input.value.trim().length >= 2;
      const field = input.closest(".field");
      field.classList.toggle("is-invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) return;
    const status = $("[data-contact-status]");
    status.className = "form-status form-status--info show";
    status.textContent =
      "This prototype form does not send or store messages. Once the promotion " +
      "entity and official contact details are confirmed, this form will be " +
      "connected to the sponsor's email system.";
    form.reset();
  });
}

/* ==========================================================================
   FOOTER YEAR + MISC
   ========================================================================== */
function initMisc() {
  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
}

/* ==========================================================================
   BOOT
   ========================================================================== */
(async function boot() {
  initTopbar();
  initMobileNav();
  initReveal();
  initParallax();
  initFilm();
  initFaq();
  initGallery();
  initCountUp();
  initContactForm();
  initMisc();

  const status = await getCampaignStatus();
  initCountdown(status);
  initEntryGate(status);
  initEntryForm(status);
})();
