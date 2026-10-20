// The public half of the notification key pair. Phones need it to subscribe;
// it is public by design (the private half stays in VAPID_PRIVATE_KEY).
module.exports = function handler(req, res) {
  res.statusCode = process.env.VAPID_PUBLIC_KEY ? 200 : 503;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ publicKey: process.env.VAPID_PUBLIC_KEY || null }));
};
