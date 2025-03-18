const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const yaml = require("js-yaml");

const app = express();
const PORT = 3000;

// モックAPIのエンドポイント
const MOCK_API_URL = "https://jsonplaceholder.typicode.com";

// ボディをパースするためのミドルウェア
app.use(express.json());

// Swagger 設定 (YAML から読み込み)
const swaggerDocument = yaml.load(fs.readFileSync("openapi.yaml", "utf8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(
  "/api/get/:id",
  createProxyMiddleware({
    target: MOCK_API_URL,
    changeOrigin: true,
    pathRewrite: (path, req) => `/posts/${req.params.id}`,
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Custom-Header", "my-custom-value");
    },
  })
);

app.use(
  "/api/post",
  (req, res, next) => {
    console.log("Request Body:", req.body);
    next();
  },
  createProxyMiddleware({
    target: MOCK_API_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/post": "/posts" },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Custom-Header", "my-custom-value");
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
  })
);

app.listen(PORT, () => {
  console.log(`Proxy API running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
