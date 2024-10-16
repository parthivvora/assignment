const express = require("express");
const userRoutes = require("./routes/userRoutes");
require("./utils/dbConfig");
require("dotenv").config();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5555;

app.use(express.json());
app.use(
  cors({
    origin: ["*", process.env.FRONTEND_URL],
  })
);

app.use("/api", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
