const { initDB } = require("./db");
const createApp = require("./app");

const PORT = process.env.PORT || 3001;

initDB()
  .then(() => {
    createApp().listen(PORT, () => console.log(`🚀 TaskFlow backend running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to init DB:", err);
    process.exit(1);
  });
