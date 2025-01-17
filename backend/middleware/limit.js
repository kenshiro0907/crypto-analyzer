const rateLimit = require("express-rate-limit");

// Limiter les requêtes à 5 tentatives par minute
const limit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limite de 5 requêtes par fenêtre
  message: "Trop de tentatives de connexion. Réessayez plus tard.",
});

module.exports = limit;
