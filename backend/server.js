require("dotenv").config();
const http = require("http"); const url = require("url"); const next = require("next");
const { health } = require("./routes/health"); const { getStock, postMove } = require("./routes/stock");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: "./frontend" }); const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = http.createServer(async (req,res) => {
    const { pathname } = url.parse(req.url, true);

    if (pathname === "/api/health" && req.method==="GET") return health(req,res);
    if (pathname === "/api/stock" && req.method==="GET") return getStock(req,res);
    if (pathname === "/api/stock/move" && req.method==="POST"){
      let body=""; req.on("data",c=>body+=c); req.on("end",()=>postMove(req,res,body)); return;
    }
    return handle(req,res);
  });
  server.listen(PORT, () => console.log(`> Ready on http://localhost:${PORT}`));
});
