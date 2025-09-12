// scripts/check-db.js
require("dotenv").config({ path: __dirname + "/../.env" });
const { q, pool } = require("../backend/db");

(async () => {
  try {
    const r = await q("select 1 as ok");
    console.log("select 1:", r);
    try {
      const r2 = await q("select * from v_stock_current limit 1");
      console.log("v_stock_current OK, rows:", r2.length);
    } catch (e) {
      console.error("v_stock_current error:", e.message);
    }
  } catch (e) {
    console.error("DB connection/query error:", e.message);
  } finally {
    try { await pool.end(); } catch {}
  }
})();

