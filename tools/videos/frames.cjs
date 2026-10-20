// Contact sheet of an MP4: node frames.cjs <video.mp4> <out.jpg> [count] [tileWidth] [start] [end]
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const [file, out, countArg, tileArg, startArg, endArg] = process.argv.slice(2);
  const count = Number(countArg || 12);
  const tile = Number(tileArg || 200);
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.route("http://frames.local/**", (route) => {
    if (route.request().url().endsWith(".mp4")) return route.fulfill({ body: fs.readFileSync(file), contentType: "video/mp4" });
    return route.fulfill({ body: "<!doctype html><body style='margin:0;background:#fff'></body>", contentType: "text/html" });
  });
  await page.goto("http://frames.local/");
  const result = await page.evaluate(async ({ count, tile, start, end }) => {
    const v = document.createElement("video");
    v.muted = true; v.src = URL.createObjectURL(await (await fetch("/v.mp4")).blob()); v.preload = "auto";
    document.body.append(v);
    await new Promise((r, j) => { v.onloadedmetadata = r; v.onerror = () => j(new Error("load " + v.error?.code)); });
    // MediaRecorder MP4s can report Infinity until the end is seen
    const d0 = v.duration; v.currentTime = 1e9; await new Promise((r) => (v.onseeked = r)); console.log(d0);
    const dur = v.duration;
    const s = start ? Number(start) : 0;
    const e = end ? Number(end) : dur - 0.05;
    const th = Math.round(tile * v.videoHeight / v.videoWidth);
    const cols = Math.min(count, Math.floor(1400 / tile));
    const rows = Math.ceil(count / cols);
    const c = document.createElement("canvas"); c.width = cols * tile; c.height = rows * (th + 18);
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? s : s + (e - s) * i / (count - 1);
      v.currentTime = t;
      await new Promise((r) => (v.onseeked = r));
      await new Promise((r) => setTimeout(r, 250));
      const x = (i % cols) * tile, y = Math.floor(i / cols) * (th + 18);
      ctx.drawImage(v, x, y + 18, tile - 4, th);
      ctx.fillStyle = "#000"; ctx.font = "12px sans-serif"; ctx.fillText(t.toFixed(1) + "s", x + 2, y + 13);
    }
    document.body.replaceChildren(c);
    return { dur, w: v.videoWidth, h: v.videoHeight, cw: c.width, ch: c.height };
  }, { count, tile, start: startArg, end: endArg });
  console.log(JSON.stringify(result));
  await page.setViewportSize({ width: result.cw, height: Math.min(result.ch, 16000) });
  await page.locator("canvas").screenshot({ path: out, type: "jpeg", quality: 85 });
  await browser.close();
})();
