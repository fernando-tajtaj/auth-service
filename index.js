const express = require("express");
const connectDB = require("./database");
require("dotenv").config();

const app = express();

// DB
connectDB();

// Middleware
app.use(express.json());

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user", require("./routes/user"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
