const crypto = require("node:crypto");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const OAUTH_ENV_NAMES = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"];
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function normalizePrivateKey(value) {
  let key = String(value || "").trim();
  if (key.endsWith(",")) key = key.slice(0, -1).trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    try {
      key = JSON.parse(key);
    } catch {
      key = key.slice(1, -1);
    }
  }
  return key.replace(/\\n/g, "\n");
}

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function readJsonBody(req) {
  if (req.body) {
    if (typeof req.body === "string") return JSON.parse(req.body);
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new HttpError(500, `Missing Vercel environment variable: ${name}`);
  return value;
}

function hasAnyOAuthEnv() {
  return OAUTH_ENV_NAMES.some((name) => process.env[name]);
}

function hasAllOAuthEnv() {
  return OAUTH_ENV_NAMES.every((name) => process.env[name]);
}

function assertDriveFolderId(value) {
  const folderId = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{10,}$/.test(folderId)) {
    throw new HttpError(400, "Invalid Google Drive folder ID");
  }
  return folderId;
}

function safeFileName(fileName, mimeType) {
  const fallbackExtension = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
  const cleaned = String(fileName || "invoice")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  const name = cleaned || `invoice${fallbackExtension}`;
  return /\.[A-Za-z0-9]{2,5}$/.test(name) ? name : `${name}${fallbackExtension}`;
}

function sanitizeDescription(metadata = {}) {
  const parts = [
    metadata.building && `Building: ${metadata.building}`,
    metadata.date && `Date: ${metadata.date}`,
    metadata.supplier && `Supplier: ${metadata.supplier}`,
    metadata.invoice && `Invoice: ${metadata.invoice}`,
    metadata.description && `Description: ${metadata.description}`,
    metadata.transactionId && `Transaction: ${metadata.transactionId}`,
  ].filter(Boolean);
  return parts.join("\n").slice(0, 8000);
}

function decodeImage(payload) {
  const mimeType = String(payload.mimeType || "").trim().toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new HttpError(400, "Invoice file must be JPEG, PNG, or WebP");
  }

  const dataBase64 = String(payload.dataBase64 || "").replace(/\s/g, "");
  if (!dataBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(dataBase64)) {
    throw new HttpError(400, "Invalid invoice image data");
  }

  const fileBuffer = Buffer.from(dataBase64, "base64");
  if (!fileBuffer.length || fileBuffer.length > MAX_UPLOAD_BYTES) {
    throw new HttpError(400, "Invoice image must be 3 MB or smaller");
  }
  return { fileBuffer, mimeType };
}

function createJwtAssertion(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: DRIVE_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const unsignedToken = `${base64urlJson(header)}.${base64urlJson(claim)}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(privateKey, "base64url");
  return `${unsignedToken}.${signature}`;
}

async function getAccessToken() {
  if (hasAnyOAuthEnv()) return getOAuthAccessToken();

  const clientEmail = getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKey = normalizePrivateKey(getRequiredEnv("GOOGLE_PRIVATE_KEY"));
  const assertion = createJwtAssertion(clientEmail, privateKey);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    throw new HttpError(502, result.error_description || "Could not authorize Google Drive upload");
  }
  return result.access_token;
}

async function getOAuthAccessToken() {
  if (!hasAllOAuthEnv()) {
    throw new HttpError(
      500,
      `Missing Vercel environment variable: ${OAUTH_ENV_NAMES.find((name) => !process.env[name])}`,
    );
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) {
    throw new HttpError(502, result.error_description || result.error || "Could not authorize Google Drive upload");
  }
  return result.access_token;
}

async function uploadToDrive({ accessToken, folderId, fileName, mimeType, fileBuffer, metadata }) {
  const boundary = `invoice_${crypto.randomUUID()}`;
  const driveMetadata = {
    name: fileName,
    parents: [folderId],
    description: sanitizeDescription(metadata),
  };
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(JSON.stringify(driveMetadata)),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = result.error?.message || "Google Drive upload failed";
    if (message.includes("Service Accounts do not have storage quota")) {
      throw new HttpError(
        502,
        "This is a personal Google Drive folder. Service-account upload cannot use it. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in Vercel.",
      );
    }
    throw new HttpError(502, message);
  }
  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const folderId = assertDriveFolderId(payload.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID);
    const { fileBuffer, mimeType } = decodeImage(payload);
    const fileName = safeFileName(payload.fileName, mimeType);
    const accessToken = await getAccessToken();
    const uploaded = await uploadToDrive({
      accessToken,
      folderId,
      fileName,
      mimeType,
      fileBuffer,
      metadata: payload.metadata || {},
    });

    sendJson(res, 200, {
      success: true,
      fileId: uploaded.id,
      fileName: uploaded.name || fileName,
      fileUrl: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    sendJson(res, status, { success: false, error: error.message || "Invoice upload failed" });
  }
};
