const express = require("express");
const cors = require("cors");

// Builds the Express app (separate from server.js so tests can import it)
function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/tasks", require("./routes/tasks"));
  app.use("/api/users", require("./routes/users"));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api", (req, res) => res.status(404).json({ error: "Route not found" }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });
  return app;
}

module.exports = createApp;
