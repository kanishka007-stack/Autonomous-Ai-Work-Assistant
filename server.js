require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// IMPORT ROUTES
const emailRoutes = require("./routes/email");

const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000,http://127.0.0.1:8080")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const localNetworkOrigin = /^(https?:\/\/192\.168\.\d+\.\d+)(:\d+)?$/;
const localhostOrigin = /^(https?:\/\/(localhost|127\.0\.0\.1))(:(\d+))?$/;

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      if (!origin || allowedOrigins.includes(origin) || localhostOrigin.test(origin) || localNetworkOrigin.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// ✅ ADD THIS HERE 👇
app.use((req, res, next) => {
  console.log("➡️ Request:", req.method, req.url);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.status(200).send("✅ AI Assistant Backend is Running");
});

// Health route
app.get("/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

app.post("/process-email", async (req, res) => {
  const emailText = req.body.email || req.body.emailText || req.body.text || "";

  if (!String(emailText).trim()) {
    return res.status(400).json({ error: "Email text is required." });
  }

  try {
    const aiServiceUrl =
      process.env.AI_SERVICE_URL || "http://localhost:5001/analyze_email";

    console.log("➡️ AI service URL:", aiServiceUrl);

    const response = await axios.post(
      aiServiceUrl,
      { email: emailText },
      { timeout: 30000 }
    );

    const { intent = "unknown", reply = "", tasks = [] } = response.data || {};

    return res.json({
      success: true,
      data: {
        intent,
        reply,
        tasks: Array.isArray(tasks) ? tasks : [],
      },
    });
  } catch (error) {
    console.error("Email processing failed:", error.message);

    const status = error.response?.status || 502;
    const message =
      error.response?.data?.error ||
      "Unable to process email. Check that the AI service is running.";

    return res.status(status).json({
      success: false,
      error: message,
      details: error.response?.data?.details,
    });
  }
});

// Routes
app.use("/email", emailRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
