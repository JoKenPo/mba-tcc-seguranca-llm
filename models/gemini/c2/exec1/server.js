const express = require("express");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Routes
app.use("/api", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
