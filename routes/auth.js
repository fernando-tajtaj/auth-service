const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, username, password, role } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        result: false,
        message: "El usuario ya existe",
      });
    }

    const user = new User({ firstname, lastname, username, password, role });
    await user.save();

    res.status(201).json({
      result: true,
      message: "Usuario creado exitosamente",
      user: {
        uuid: user.uuid,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(400).json({
      result: false,
      message: "Error al crear usuario",
      error: err.message,
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      result: false,
      message: "Username y password son requeridos",
    });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        result: false,
        message: "Credenciales inválidas",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        result: false,
        message: "Credenciales inválidas",
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user._id,
        uuid: user.uuid,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
        issuer: "http://auth-service:4000",
        audience: "http://api-gateway:5000",
        algorithm: "HS256",
      }
    );

    res.json({
      result: true,
      message: "Login exitoso",
      token,
      user: {
        uuid: user.uuid,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      result: false,
      message: "Error en el login",
      error: error.message,
    });
  }
});

router.get("/validate", authMiddleware, async (req, res) => {
  try {
    // Si el middleware pasa, el token es válido
    // Buscar el usuario actualizado en la BD
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        result: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      result: true,
      message: "Token válido",
      user: {
        uuid: user.uuid,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      result: false,
      message: "Error al validar token",
      error: error.message,
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        result: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      result: true,
      user: {
        uuid: user.uuid,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      result: false,
      message: "Error al obtener perfil",
      error: error.message,
    });
  }
});

router.post("/refresh", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        result: false,
        message: "Usuario no encontrado",
      });
    }

    // Generar nuevo token
    const token = jwt.sign(
      {
        id: user._id,
        uuid: user.uuid,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      result: true,
      message: "Token renovado",
      token,
    });
  } catch (error) {
    res.status(500).json({
      result: false,
      message: "Error al renovar token",
      error: error.message,
    });
  }
});

module.exports = router;
