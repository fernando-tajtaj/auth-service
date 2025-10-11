// routes/user.js
const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");

router.get("/profile", protect, (req, res) => {
  res.json({ message: "Ruta protegida", user: req.user });
});

module.exports = router;
