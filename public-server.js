const path = require("path");
const axios = require("axios");
const express = require("express");

const app = express();
const port = process.env.PUBLIC_PORT || 8080;
const backendUrl = (process.env.BACKEND_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

app.use(express.json({ limit: "1mb" }));

app.post("/process-email", async (req, res) => {
  try {
    const response = await axios.post(`${backendUrl}/process-email`, req.body, {
      timeout: 30000,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({
      success: false,
      error:
        error.response?.data?.error ||
        "Public gateway could not reach the backend service.",
      details: error.response?.data?.details || error.message,
    });
  }
});

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Public product server running at http://localhost:${port}`);
});
