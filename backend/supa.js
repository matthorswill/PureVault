// backend/supa.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supaAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
);

module.exports = { supaAdmin };

