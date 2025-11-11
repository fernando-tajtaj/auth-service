const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/google/failure",
  }),
  async (req, res) => {
    try {
      const user = req.user;

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

      const redirectUrl = process.env.FRONTEND_SUCCESS_URL;
      if (redirectUrl) {
        try {
          // Separar la parte base de la parte del hash
          const [baseUrl, hashPart] = redirectUrl.split("#");

          // Si hay hash, construir la URL correctamente
          if (hashPart) {
            // Verificar si el hash ya tiene query params
            const separator = hashPart.includes("?") ? "&" : "?";
            const finalUrl = `${baseUrl}#${hashPart}${separator}token=${token}`;
            return res.redirect(finalUrl);
          } else {
            // Si no hay hash, usar la lógica original
            const url = new URL(redirectUrl);
            url.searchParams.set("token", token);
            return res.redirect(url.toString());
          }
        } catch (err) {
          console.error("Error al construir URL de redirect:", err);
          // Fallback: agregar token como query param simple
          const separator = redirectUrl.includes("?") ? "&" : "?";
          return res.redirect(`${redirectUrl}${separator}token=${token}`);
        }
      }

      return res.json({
        result: true,
        message: "Login con Google exitoso",
        token,
      });
    } catch (err) {
      console.error("Error en callback de Google:", err);
      return res.status(500).json({
        result: false,
        message: "Error al procesar callback de Google",
        error: err.message,
      });
    }
  }
);

router.get("/google/failure", (req, res) => {
  return res.status(401).json({
    result: false,
    message: "Fallo autenticación con Google",
  });
});

module.exports = router;
