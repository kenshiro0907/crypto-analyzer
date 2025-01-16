const jwt = require("jsonwebtoken");
const { accessTokenSecret } = require("../constante/const");

exports.authenticate = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .json({ message: "Authorisation du header manquant" });
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const payload = jwt.verify(token, accessTokenSecret);
    req.user = payload; // On stocke les informations de l'utilisateur dans req.user
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    res.status(401).json({ message: "Token invalide" });
  }
};
