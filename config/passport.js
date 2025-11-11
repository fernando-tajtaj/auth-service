const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const {
  googleClientId,
  googleClientSecret,
  googleCallbackURL,
} = require("./index");
const User = require("../models/user");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "username" },
      async (username, password, done) => {
        try {
          const user = await User.findOne({ username });
          if (!user)
            return done(null, false, { message: "Usuario no encontrado" });

          const isMatch = await user.matchPassword(password);
          if (!isMatch)
            return done(null, false, { message: "Contraseña incorrecta" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = (
            (profile.emails && profile.emails[0] && profile.emails[0].value) ||
            ""
          ).toLowerCase();
          const googleId = profile.id;
          const picture =
            profile.photos && profile.photos[0] && profile.photos[0].value;
          const givenName = profile.name && profile.name.givenName;
          const familyName = profile.name && profile.name.familyName;
          const displayName = profile.displayName || "";
          const firstname = givenName || (displayName.split(" ")[0] || "Usuario");
          const lastname = familyName || displayName.split(" ").slice(1).join(" ");
          const baseUsername = (email && email.split("@")[0]) || `google_${googleId}`;

          let user = await User.findOne({ $or: [{ googleId }, { email }] });

          if (!user) {
            user = await User.create({
              email: email || undefined,
              googleId,
              picture,
              firstname,
              lastname,
              username: baseUsername,
              role: "user",
              firstlogin: true,
            });
          } else {
            if (!user.googleId) {
              user.googleId = googleId;
            }
            if (!user.picture && picture) {
              user.picture = picture;
            }
            if (!user.firstname && firstname) {
              user.firstname = firstname;
            }
            if (!user.lastname && lastname) {
              user.lastname = lastname;
            }
            if (!user.username && baseUsername) {
              user.username = baseUsername;
            }
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
};
