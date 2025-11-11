const express = require("express");
const connectDB = require("./database");
require("dotenv").config();

const app = express();
const passport = require("passport");
require("./config/passport")(passport);

// DB
connectDB();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Rutas
app.use("/auth", require("./routes/google"));
app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/user"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
