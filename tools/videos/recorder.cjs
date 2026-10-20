// Records explainer videos of the app at phone size, straight to MP4 (H.264),
// against the demo building served by mock-demo.cjs. No real data is used.
//
// Pipeline: the app page runs in Chrome at 390x844 CSS px (DPR 1.6). Chrome's
// screencast sends JPEG frames; a second, hidden "encoder" page paints them on
// a canvas whose stream feeds MediaRecorder (video/mp4, avc1).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { muxH264 } = require("./mp4mux.cjs");

const APP = "http://localhost:4180/";
const MOCK = "http://localhost:4199";
const CSS_W = 390;
const CSS_H = 844;
const DPR = 2;
const W = Math.round(CSS_W * DPR / 2) * 2; // 624
const H = Math.round(CSS_H * DPR / 2) * 2; // 1350
const BITRATE = 700_000;
const FPS = 20;

const OVERLAY = String.raw`
(() => {
  if (window.__demo) return;
  const css = document.createElement("style");
  css.textContent = ${"`"}
    #demo-cap { position: fixed; left: 14px; right: 14px; z-index: 2147483646; pointer-events: none;
      background: rgba(18, 38, 33, .94); color: #fff; border-radius: 18px; padding: 14px 18px;
      font: 600 18px/1.35 Inter, "Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,.28); opacity: 0; transform: translateY(8px);
      transition: opacity .35s ease, transform .35s ease; text-align: start; }
    #demo-cap.show { opacity: 1; transform: none; }
    #demo-cap small { display: block; font-weight: 500; font-size: 14px; color: #bfe0d4; margin-bottom: 4px; letter-spacing: .02em; }
    #demo-finger { position: fixed; z-index: 2147483647; width: 34px; height: 34px; margin: -17px 0 0 -17px;
      border-radius: 50%; background: rgba(255, 196, 0, .55); border: 3px solid #ffb300; pointer-events: none;
      left: 50%; top: 110%; transition: left .55s cubic-bezier(.4,.1,.2,1), top .55s cubic-bezier(.4,.1,.2,1), transform .15s ease; }
    #demo-finger.down { transform: scale(.75); }
    [popover].demo-layer { margin: 0; border: 0; padding: 0; overflow: visible; inset: auto; width: auto; height: auto; background: transparent; color: inherit; }
    .demo-ripple { position: fixed; z-index: 2147483646; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%;
      border: 3px solid #ffb300; pointer-events: none; animation: demo-rip .6s ease-out forwards; }
    @keyframes demo-rip { to { transform: scale(2.6); opacity: 0; } }
    #demo-card { position: fixed; inset: 0; z-index: 2147483647; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 18px; background: #163832; color: #fff; text-align: center; padding: 40px;
      font-family: Inter, "Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif; transition: opacity .45s ease; }
    #demo-card .k { font-size: 15px; letter-spacing: .14em; text-transform: uppercase; color: #9fcfbf; font-weight: 700; }
    #demo-card .t { font-size: 34px; font-weight: 800; line-height: 1.2; }
    #demo-card .s { font-size: 18px; color: #cfe3db; line-height: 1.45; max-width: 320px; }
    #demo-card .logo { width: 76px; height: 76px; border-radius: 20px; background: #fff; display: grid; place-items: center; }
    #demo-card .logo i { display: block; width: 34px; height: 42px; border-radius: 4px; background:
      radial-gradient(circle, #163832 3px, transparent 3.5px) 0 0 / 11px 11px, #cfe3db; }
  ${"`"};
  const cap = document.createElement("div"); cap.id = "demo-cap";
  const finger = document.createElement("div"); finger.id = "demo-finger";
  const layer = (el) => { el.setAttribute("popover", "manual"); el.classList.add("demo-layer"); return el; };
  const lift = (el) => { try { if (!el.isConnected) return; if (el.matches(":popover-open")) el.hidePopover(); el.showPopover(); } catch (e) {} };
  layer(cap); layer(finger);
  const raise = () => { lift(cap); lift(finger); const c = document.getElementById("demo-card"); if (c) lift(c); document.querySelectorAll(".demo-sheet-layer").forEach(lift); };
  const mount = () => {
    if (cap.isConnected || !document.documentElement) return;
    document.documentElement.append(css, cap, finger);
    raise();
    new MutationObserver((list) => { if (list.some((m) => m.target.tagName === "DIALOG" && m.target.hasAttribute("open"))) raise(); })
      .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["open"] });
  };
  document.addEventListener("DOMContentLoaded", mount);
  window.__demo = {
    mount,
    caption(text, where = "bottom", label = "") { mount();
      cap.classList.remove("show");
      if (!text) return;
      setTimeout(() => {
        cap.replaceChildren();
        if (label) { const s = document.createElement("small"); s.textContent = label; cap.append(s); }
        cap.append(document.createTextNode(text));
        cap.style.top = where === "top" ? "14px" : "auto";
        cap.style.bottom = where === "top" ? "auto" : (where === "low" ? "14px" : "92px");
        cap.classList.add("show");
      }, 180);
    },
    move(x, y) { mount(); finger.style.left = x + "px"; finger.style.top = y + "px"; },
    tap(x, y) { mount();
      finger.classList.add("down");
      const r = document.createElement("div"); r.className = "demo-ripple"; r.style.left = x + "px"; r.style.top = y + "px";
      layer(r); r.style.margin = "-17px 0 0 -17px"; document.documentElement.append(r); lift(r); setTimeout(() => r.remove(), 700);
      setTimeout(() => finger.classList.remove("down"), 160);
    },
    sheet(data, lang) {
      mount();
      const ar = lang === "ar";
      const wrap = document.createElement("div");
      wrap.id = "demo-sheet";
      wrap.style.cssText = "position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.45);display:flex;flex-direction:column;justify-content:flex-end;pointer-events:none;font-family:Inter,'Segoe UI',Tahoma,Arial,sans-serif;opacity:0;transition:opacity .3s";
      const panel = document.createElement("div");
      panel.style.cssText = "background:#fff;border-radius:22px 22px 0 0;padding:18px 18px 26px;display:flex;flex-direction:column;gap:14px;align-items:center;transform:translateY(40px);transition:transform .35s ease";
      const file = data && data.files && data.files[0];
      if (file && /^image\//.test(file.type)) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.cssText = "max-width:100%;max-height:480px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.18)";
        panel.append(img);
      } else if (file) {
        const doc = document.createElement("div");
        doc.style.cssText = "display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid #dde5df;border-radius:14px;width:100%;box-sizing:border-box";
        const icon = document.createElement("div"); icon.textContent = "PDF";
        icon.style.cssText = "width:44px;height:54px;border-radius:6px;background:#c0392b;color:#fff;font-weight:800;font-size:13px;display:grid;place-items:center";
        const name = document.createElement("div"); name.textContent = file.name; name.style.cssText = "font-weight:700;color:#14211f;font-size:15px;word-break:break-all";
        doc.append(icon, name); panel.append(doc);
      }
      const label = document.createElement("div");
      label.textContent = ar ? "مشاركة عبر…" : "Share to…";
      label.style.cssText = "font-weight:700;color:#14211f;font-size:16px;align-self:flex-start";
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:22px;align-self:flex-start";
      [["WhatsApp", "#25d366"], [ar ? "الرسائل" : "Messages", "#3a86ff"], [ar ? "البريد" : "Mail", "#8e9aaf"]].forEach(([n, c]) => {
        const b = document.createElement("div"); b.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:#444";
        const dot = document.createElement("div"); dot.style.cssText = "width:52px;height:52px;border-radius:14px;background:" + c;
        const t = document.createElement("span"); t.textContent = n; b.append(dot, t); row.append(b);
      });
      panel.append(label, row);
      wrap.append(panel);
      layer(wrap); wrap.classList.add("demo-sheet-layer"); document.documentElement.append(wrap); lift(wrap);
      requestAnimationFrame(() => { wrap.style.opacity = "1"; panel.style.transform = "none"; });
      return new Promise((r) => setTimeout(() => { wrap.style.opacity = "0"; setTimeout(() => { wrap.remove(); r(); }, 350); }, 4200));
    },
    whatsapp(url, lang) {
      mount();
      let text = "";
      try { text = new URL(url).searchParams.get("text") || ""; } catch {}
      if (!text) return;
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:fixed;inset:0;z-index:2147483645;background:#efe7dd;display:flex;flex-direction:column;pointer-events:none;font-family:Inter,'Segoe UI',Tahoma,Arial,sans-serif;opacity:0;transition:opacity .3s";
      const bar = document.createElement("div"); bar.textContent = "WhatsApp";
      bar.style.cssText = "background:#075e54;color:#fff;font-weight:700;font-size:18px;padding:18px 18px 16px";
      const bubble = document.createElement("div"); bubble.textContent = text;
      bubble.style.cssText = "margin:18px 14px;align-self:" + (lang === "ar" ? "flex-start" : "flex-end") + ";max-width:82%;background:#dcf8c6;border-radius:12px;padding:12px 14px;font-size:14.5px;line-height:1.42;color:#111;white-space:pre-wrap;box-shadow:0 1px 1px rgba(0,0,0,.12);direction:" + (lang === "ar" ? "rtl" : "ltr");
      wrap.append(bar, bubble);
      layer(wrap); wrap.classList.add("demo-sheet-layer"); document.documentElement.append(wrap); lift(wrap);
      requestAnimationFrame(() => { wrap.style.opacity = "1"; });
      setTimeout(() => { wrap.style.opacity = "0"; setTimeout(() => wrap.remove(), 350); }, 4500);
    },
    hideFinger() { finger.style.top = "110%"; },
    card(kicker, title, sub) { mount();
      let c = document.getElementById("demo-card");
      if (!c) { c = layer(document.createElement("div")); c.id = "demo-card"; document.documentElement.append(c); }
      lift(c);
      c.style.opacity = "1";
      c.replaceChildren();
      const logo = document.createElement("div"); logo.className = "logo"; logo.append(document.createElement("i"));
      const k = document.createElement("div"); k.className = "k"; k.textContent = kicker;
      const t = document.createElement("div"); t.className = "t"; t.textContent = title;
      const s = document.createElement("div"); s.className = "s"; s.textContent = sub || "";
      c.append(logo, k, t, s);
    },
    uncard() { const c = document.getElementById("demo-card"); if (c) { c.style.opacity = "0"; setTimeout(() => c.remove(), 500); } },
  };
})();
`;

// Runs in a localhost page (a secure context, so WebCodecs is available).
const ENCODER_JS = String.raw`
window.__enc = {
  async start(w, h, bitrate, fps) {
    const codecs = ["avc1.4D4029", "avc1.640029", "avc1.4D4028", "avc1.42E029"];
    let config = null;
    for (const codec of codecs) {
      const c = { codec, width: w, height: h, bitrate, framerate: fps, avc: { format: "avc" }, latencyMode: "quality", bitrateMode: "variable" };
      if ((await VideoEncoder.isConfigSupported(c)).supported) { config = c; break; }
    }
    if (!config) throw new Error("no H.264 encoder");
    this.out = []; this.avcC = null; this.w = w; this.h = h; this.fps = fps; this.i = 0;
    this.canvas = new OffscreenCanvas(w, h);
    this.ctx = this.canvas.getContext("2d");
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => {
        if (meta?.decoderConfig?.description && !this.avcC) this.avcC = new Uint8Array(meta.decoderConfig.description.buffer ? meta.decoderConfig.description.buffer : meta.decoderConfig.description).slice();
        const buf = new Uint8Array(chunk.byteLength); chunk.copyTo(buf);
        this.out.push({ key: chunk.type === "key", data: buf });
      },
      error: (e) => { this.err = String(e); },
    });
    this.encoder.configure(config);
    return config.codec;
  },
  async push(list) {
    // list: [{ b64, repeat }]
    for (const { b64, repeat } of list) {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const bmp = await createImageBitmap(new Blob([bytes], { type: "image/jpeg" }));
      this.ctx.drawImage(bmp, 0, 0, this.w, this.h);
      bmp.close();
      const still = this.canvas.transferToImageBitmap();
      for (let r = 0; r < repeat; r++) {
        const frame = new VideoFrame(still, { timestamp: Math.round(this.i * 1e6 / this.fps), duration: Math.round(1e6 / this.fps) });
        this.encoder.encode(frame, { keyFrame: this.i % (this.fps * 3) === 0 });
        frame.close();
        this.i++;
        while (this.encoder.encodeQueueSize > 8) await new Promise((res) => setTimeout(res, 5));
      }
      still.close();
    }
    if (this.err) throw new Error(this.err);
  },
  async thumb(b64, w, h) {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes], { type: "image/jpeg" }));
    const c = new OffscreenCanvas(w, h);
    c.getContext("2d").drawImage(bmp, 0, 0, w, h);
    const u8 = new Uint8Array(await (await c.convertToBlob({ type: "image/jpeg", quality: 0.74 })).arrayBuffer());
    let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  },
  async finish() {
    await this.encoder.flush();
    this.encoder.close();
    const b64 = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
    return { avcC: b64(this.avcC), samples: this.out.map((s) => ({ key: s.key, data: b64(s.data) })) };
  },
};
`;

const OWNER_AUTH = { access_token: "demo-owner-1", refresh_token: "ref-demo-owner-1", expires_at: 9999999999, role: "owner", email: "owner@cedar.example" };

async function launch() {
  const browser = await chromium.launch({ channel: "chrome", args: [`--force-device-scale-factor=${DPR}`] });
  const encCtx = await browser.newContext({ viewport: { width: 400, height: 400 }, serviceWorkers: "block" });
  const enc = await encCtx.newPage();
  await enc.goto(APP + "manifest.json");
  await enc.evaluate(ENCODER_JS);
  if (!(await enc.evaluate(() => isSecureContext && typeof VideoEncoder === "function"))) throw new Error("WebCodecs unavailable");
  return { browser, enc, mime: "video/mp4 (WebCodecs H.264)" };
}

// Turn the timestamped screencast frames into a constant-rate MP4.
async function encodeFrames(env, frames, startT, endT, out) {
  const list = [];
  let k = 0;
  const total = Math.max(1, Math.round((endT - startT) * FPS));
  for (let i = 0; i < total; i++) {
    const t = startT + i / FPS;
    while (k + 1 < frames.length && frames[k + 1].t <= t) k++;
    const last = list[list.length - 1];
    if (last && last.idx === k) last.repeat++;
    else list.push({ idx: k, repeat: 1 });
  }
  const codec = await env.enc.evaluate(([w, h, b, f]) => window.__enc.start(w, h, b, f), [W, H, BITRATE, FPS]);
  for (let i = 0; i < list.length; i += 20) {
    const batch = list.slice(i, i + 20).map((x) => ({ b64: frames[x.idx].data, repeat: x.repeat }));
    await env.enc.evaluate((b) => window.__enc.push(b), batch);
  }
  const res = await env.enc.evaluate(() => window.__enc.finish());
  const mp4 = muxH264({
    samples: res.samples.map((s) => ({ key: s.key, data: Buffer.from(s.data, "base64") })),
    avcC: Buffer.from(res.avcC, "base64"), width: W, height: H, fps: FPS,
  });
  fs.writeFileSync(out, mp4);
  return { codec, seconds: total / FPS };
}

// One video. `script(d)` drives the page with the helpers below.
async function record(env, { id, lang, role = "owner", out, intro, outro, setup, keepLogin = false, script }) {
  await fetch(`${MOCK}/__reset?lang=${lang}`);
  const ctx = await env.browser.newContext({
    viewport: { width: CSS_W, height: CSS_H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: false,
    serviceWorkers: "block", locale: lang === "ar" ? "ar-LB" : "en-US", timezoneId: "Asia/Beirut",
  });
  await ctx.addInitScript(({ role, auth, lang }) => {
    if (sessionStorage.getItem("demo-init")) return;
    sessionStorage.setItem("demo-init", "1");
    localStorage.clear();
    localStorage.setItem("building-account-tracker:lang", lang);
    localStorage.setItem("building-account-tracker:videos-watched", JSON.stringify(["tour", "tenant-home"]));
    if (role === "owner") localStorage.setItem("building-account-tracker:auth", JSON.stringify(auth));
  }, { role, auth: OWNER_AUTH, lang });
  await ctx.addInitScript(OVERLAY);
  // Pretend sharing is available so share buttons show the system sheet path
  // without leaving the page; downloads are swallowed.
  await ctx.addInitScript((lang) => {
    navigator.share = async (data) => { await window.__demo.sheet(data, lang); };
    navigator.canShare = () => true;
    window.open = (url) => { window.__demo.whatsapp(String(url || ""), lang); return null; };
  }, lang);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log(`  [${id}/${lang}] pageerror:`, e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto(APP);
  await page.waitForTimeout(1200);
  // The login screen's building label is fixed markup; match the demo building.
  await page.evaluate((name) => { document.querySelectorAll(".login-screen .eyebrow").forEach((n) => { n.textContent = name; }); }, lang === "ar" ? "سكن الأرز" : "Cedar Residence");

  if (role === "owner" && !keepLogin) {
    await page.click("#loginSubmitBtn");
    await page.waitForSelector("#dashboardView", { state: "visible" });
    await page.waitForTimeout(1500);
  }
  if (setup) await setup(page);
  if (intro) await page.evaluate(([k, t, s]) => window.__demo.card(k, t, s), intro);
  await page.waitForTimeout(300);

  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  const skips = [];
  let lastFrameAt = Date.now();
  cdp.on("Page.screencastFrame", ({ data, sessionId, metadata }) => {
    frames.push({ t: metadata.timestamp || Date.now() / 1000, node: Date.now() / 1000, data });
    lastFrameAt = Date.now();
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 82, maxWidth: W, maxHeight: H, everyNthFrame: 1 });

  const shots = [];
  let fx = CSS_W / 2;
  let fy = CSS_H + 40;
  const d = {
    page,
    lang,
    ar: lang === "ar",
    wait: (ms) => page.waitForTimeout(ms),
    async card(kicker, title, sub, ms = 2600) { await page.evaluate(([k, t, s]) => window.__demo.card(k, t, s), [kicker, title, sub]); await page.waitForTimeout(ms); },
    async uncard() { await page.evaluate(() => window.__demo.uncard()); await page.waitForTimeout(500); },
    async say(text, where = "bottom", ms = 2600) {
      await page.evaluate(([t, w]) => window.__demo.caption(t, w), [text, where]);
      // reading time: ~14 characters a second, never under the given minimum
      await page.waitForTimeout(Math.max(ms, 900 + text.length * 55));
    },
    async hush() { await page.evaluate(() => window.__demo.caption("")); await page.waitForTimeout(300); },
    async point(target) {
      const loc = typeof target === "string" ? page.locator(target).first() : target;
      await loc.scrollIntoViewIfNeeded({ timeout: 6000 });
      await page.waitForTimeout(250);
      const box = await loc.boundingBox();
      if (!box) throw new Error(`no box for ${target}`);
      fx = box.x + box.width / 2;
      fy = box.y + box.height / 2;
      await page.evaluate(([x, y]) => window.__demo.move(x, y), [fx, fy]);
      await page.waitForTimeout(650);
      return loc;
    },
    async tap(target, after = 900) {
      const loc = await d.point(target);
      await page.evaluate(([x, y]) => window.__demo.tap(x, y), [fx, fy]);
      await page.waitForTimeout(120);
      await loc.click({ timeout: 6000 });
      await page.waitForTimeout(after);
    },
    async type(target, text, after = 500) {
      await d.tap(target, 300);
      const loc = typeof target === "string" ? page.locator(target).first() : target;
      await loc.fill("");
      await loc.pressSequentially(String(text), { delay: 85 });
      await page.waitForTimeout(after);
    },
    async select(target, value, after = 700) {
      await d.tap(target, 200).catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
      const loc = typeof target === "string" ? page.locator(target).first() : target;
      await loc.selectOption(value);
      await page.waitForTimeout(after);
    },
    async scroll(target, by = 300, after = 700) {
      if (target) await (typeof target === "string" ? page.locator(target).first() : target).scrollIntoViewIfNeeded();
      else await page.evaluate((y) => window.scrollBy({ top: y, behavior: "smooth" }), by);
      await page.waitForTimeout(after);
    },
    async scrollIn(container, by = 300, after = 700) {
      await page.evaluate(([sel, y]) => { const el = document.querySelector(sel); (el || window).scrollBy({ top: y, behavior: "smooth" }); }, [container, by]);
      await page.waitForTimeout(after);
    },
    async hideFinger() { await page.evaluate(() => window.__demo.hideFinger()); },
    // The poster is cut from the recording itself (a page screenshot would
    // disturb the screencast). Captions and the tap dot are hidden for a
    // moment; those frames are dropped from the video so nothing flickers.
    async poster() {
      const t0 = Date.now() / 1000;
      await page.evaluate(() => ["demo-cap", "demo-finger"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.visibility = "hidden"; }));
      const until = Date.now() + 2000;
      while (Date.now() < until && !(frames.length && frames[frames.length - 1].node > t0 + 0.25)) await page.waitForTimeout(50);
      await page.waitForTimeout(150);
      const shot = frames[frames.length - 1].data;
      await page.evaluate(() => ["demo-cap", "demo-finger"].forEach((id) => { const el = document.getElementById(id); if (el) el.style.visibility = ""; }));
      await page.waitForTimeout(250);
      skips.push([t0 - 0.02, Date.now() / 1000 + 0.15]);
      const small = await env.enc.evaluate(([b, w, h]) => window.__enc.thumb(b, w, h), [shot, CSS_W, CSS_H]);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out.replace(/.mp4$/, ".jpg"), Buffer.from(small, "base64"));
    },
    async check(name) {
      const file = path.join(require("os").tmpdir(), "bat-video-checks", `${lang}-${id}-${name}.jpg`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      shots.push(file);
      await page.screenshot({ path: file, type: "jpeg", quality: 60, scale: "css" });
    },
  };

  const started = Date.now();
  let ok = false;
  let endNode = 0;
  try {
    if (intro) { await page.waitForTimeout(2800); await d.uncard(); await page.waitForTimeout(300); }
    await script(d);
    await d.hush();
    await d.hideFinger();
    if (outro) { await d.card(...outro, 2600); }
    ok = true;
  } finally {
    await page.waitForTimeout(300);
    endNode = Date.now() / 1000;
    // Frames can lag behind in the pipe; let them all arrive before closing.
    const waitStart = Date.now();
    while (Date.now() - waitStart < 20000 && (!frames.length || frames[frames.length - 1].t < endNode - (frames[0].node - frames[0].t) - 0.05) && Date.now() - lastFrameAt < 3000) await page.waitForTimeout(100);
    await cdp.send("Page.stopScreencast").catch(() => {});
    if (!ok) await page.screenshot({ path: path.join(require("os").tmpdir(), `bat-video-${lang}-${id}.FAILED.png`) }).catch(() => {});
    await ctx.close();
  }
  if (!frames.length) throw new Error("no frames captured");
  if (process.env.DEBUG_FRAMES) { fs.writeFileSync("dbg-times.json", JSON.stringify(frames.map((f) => [f.t, f.node]))); [0, Math.floor(frames.length / 2), frames.length - 1].forEach((i) => fs.writeFileSync(`dbg-${i}.jpg`, Buffer.from(frames[i].data, "base64"))); }
  const offset = frames[0].node - frames[0].t;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const kept = frames.filter((f, i) => i === 0 || !skips.some(([a, b]) => f.node >= a && f.node <= b));
  const r = await encodeFrames(env, kept, frames[0].t, endNode - offset, out);
  console.log(`  ${lang}/${id}: ${r.seconds.toFixed(1)}s, ${frames.length} frames, ${(fs.statSync(out).size / 1e6).toFixed(2)} MB (${r.codec})`);
  return { seconds: Math.round(r.seconds) };
}

module.exports = { launch, record, MOCK };
