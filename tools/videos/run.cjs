// Records the Help & videos clips into videos/<lang>/ and updates their
// lengths in src/app.js. Usage (from the repo root):
//   node tools/videos/run.cjs            all videos, English and Arabic
//   node tools/videos/run.cjs ar         Arabic only
//   node tools/videos/run.cjs en tour,payment
//
// It points the app at the local demo server for the duration of the run
// (src/cloud-config.js is swapped and always put back), so no real building
// data is ever shown or touched.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");

const repo = path.resolve(__dirname, "..", "..");
const configPath = path.join(repo, "src", "cloud-config.js");
const backupPath = path.join(os.tmpdir(), `bat-cloud-config-${Date.now()}.js`);
const DEMO_CONFIG = `export const CLOUD_CONFIG = {\n  supabaseUrl: "http://localhost:4199",\n  supabaseAnonKey: "demo-key",\n};\n`;

const portBusy = (port) => new Promise((resolve) => {
  const s = net.connect(port, "127.0.0.1");
  s.on("connect", () => { s.destroy(); resolve(true); });
  s.on("error", () => resolve(false));
});

function startServer(file, port, cwd) {
  const child = spawn(process.execPath, [file], { cwd, stdio: "ignore" });
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = async () => {
      if (await portBusy(port)) return resolve(child);
      if (Date.now() - started > 10000) return reject(new Error(`${path.basename(file)} did not start on ${port}`));
      setTimeout(tick, 200);
    };
    tick();
  });
}

function updateLengths(results) {
  const appPath = path.join(repo, "src", "app.js");
  let src = fs.readFileSync(appPath, "utf8");
  for (const r of results) {
    if (r.failed) continue;
    const re = new RegExp(`(\\{ id: "${r.id}",[^\\n]*seconds: \\{ en: )(\\d+)(, ar: )(\\d+)( \\})`);
    src = src.replace(re, (m, a, en, b, ar, c) => (r.lang === "en" ? `${a}${r.seconds}${b}${ar}${c}` : `${a}${en}${b}${r.seconds}${c}`));
  }
  fs.writeFileSync(appPath, src);
}

(async () => {
  if (await portBusy(4199) || await portBusy(4180)) throw new Error("Ports 4199/4180 are in use; stop the other servers first.");
  const original = fs.existsSync(configPath) ? fs.readFileSync(configPath) : null;
  if (original && original.includes("localhost:4199")) throw new Error("src/cloud-config.js already points at the demo server; put the real one back first.");
  if (original) fs.writeFileSync(backupPath, original);
  const children = [];
  try {
    fs.writeFileSync(configPath, DEMO_CONFIG);
    children.push(await startServer(path.join(__dirname, "mock-demo.cjs"), 4199, __dirname));
    children.push(await startServer(path.join(repo, "local-server.js"), 4180, repo));
    const args = [path.join(__dirname, "videos.cjs"), path.join(repo, "videos"), ...process.argv.slice(2)];
    const code = await new Promise((resolve) => spawn(process.execPath, args, { cwd: __dirname, stdio: "inherit" }).on("exit", resolve));
    if (code !== 0) throw new Error(`recording exited with ${code}`);
    const { results } = JSON.parse(fs.readFileSync(path.join(repo, "videos", "results.json"), "utf8"));
    fs.rmSync(path.join(repo, "videos", "results.json"));
    updateLengths(results);
    const failed = results.filter((r) => r.failed);
    console.log(failed.length ? `Done with ${failed.length} failure(s): ${failed.map((r) => `${r.lang}/${r.id}`).join(", ")}` : "All videos recorded.");
  } finally {
    children.forEach((c) => c.kill());
    if (original) { fs.writeFileSync(configPath, original); fs.rmSync(backupPath, { force: true }); }
    else fs.rmSync(configPath, { force: true });
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
