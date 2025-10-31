// backend/routes/health.js
async function health(_req, res) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
}

module.exports = { health };

