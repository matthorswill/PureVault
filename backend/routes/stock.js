// backend/routes/stock.js
const { q } = require("../db");
const { supaAdmin } = require("../supa");
const { z } = require("zod");

async function getStock(_req, res) {
  try {
    const rows = await q(
      `select lot_id, lot_sku, lot_kind, lot_metal, lot_gem,
      site_id, site_code, site_name, qty_value, qty_unit, coalesce(valuation_eur,0) valuation_eur
      from v_stock_current order by site_code, lot_sku nulls last, lot_id`
    );
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(rows));
  } catch (e) {
    console.warn("[GET /api/stock] DB error, trying Supabase REST:", e.message);
    try {
      const { data, error } = await supaAdmin
        .from("v_stock_current")
        .select(
          "lot_id, lot_sku, lot_kind, lot_metal, lot_gem, site_id, site_code, site_name, qty_value, qty_unit, valuation_eur"
        )
        .order("site_code", { ascending: true })
        .order("lot_sku", { ascending: true, nullsFirst: false })
        .order("lot_id", { ascending: true });
      if (error) throw error;
      const coerced = (data || []).map((r) => ({
        ...r,
        valuation_eur: r.valuation_eur ?? 0,
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(coerced));
    } catch (e2) {
      console.error("[GET /api/stock] Supabase REST error:", e2);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e2.message }));
    }
  }
}

const MoveSchema = z.object({
  lot_id: z.string().uuid(),
  type: z.enum(["IN", "OUT", "TRANSFER", "ADJUST"]),
  qty_value: z.number().positive(),
  qty_unit: z.string().min(1),
  from_vault_id: z.string().uuid().optional(),
  to_vault_id: z.string().uuid().optional(),
  reason: z.enum(["PURCHASE", "SALE", "REFINING", "LOSS", "OTHER"]).default("OTHER"),
  notes: z.string().optional(),
});

async function postMove(req, res, body) {
  try {
    const data = MoveSchema.parse(JSON.parse(body || "{}"));
    const orgId = req.headers["x-org-id"];
    if (!orgId) throw new Error("x-org-id manquant (dev)");

    try {
      const rows = await q(
        `insert into inventory_movements(org_id,lot_id,type,reason,qty_value,qty_unit,from_vault_id,to_vault_id,notes)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
        [
          orgId,
          data.lot_id,
          data.type,
          data.reason,
          data.qty_value,
          data.qty_unit,
          data.from_vault_id || null,
          data.to_vault_id || null,
          data.notes || null,
        ]
      );
      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ id: rows[0].id }));
    } catch (dbErr) {
      console.warn("[POST /api/stock/move] DB error, trying Supabase REST:", dbErr.message);
      const { data: inserted, error } = await supaAdmin
        .from("inventory_movements")
        .insert([
          {
            org_id: orgId,
            lot_id: data.lot_id,
            type: data.type,
            reason: data.reason,
            qty_value: data.qty_value,
            qty_unit: data.qty_unit,
            from_vault_id: data.from_vault_id || null,
            to_vault_id: data.to_vault_id || null,
            notes: data.notes || null,
          },
        ])
        .select("id")
        .single();
      if (error) throw error;
      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ id: inserted.id }));
    }
  } catch (e) {
    console.error("[POST /api/stock/move]", e);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
}

module.exports = { getStock, postMove };
