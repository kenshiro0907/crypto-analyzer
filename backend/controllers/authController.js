const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const { accessTokenSecret, refreshTokenSecret } = require("../constante/const");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const walletAdress = process.env.WALLET_ADDRESS;

exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = new User({
      email,
      password,
      wallet: walletAdress,
    });
    await user.save();
    res.status(201).json({ message: "Utilisateur enregistré avec succès" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credentials invalides" });
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email },
      accessTokenSecret,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: user._id, email: user.email },
      refreshTokenSecret,
      { expiresIn: "7d" }
    );

    const token = new RefreshToken({
      token: refreshToken,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await token.save();

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWallet = async (req, res) => {
  const authorization = req.headers.authorization;

  try {
    if (!authorization) {
      return res
        .status(401)
        .json({ message: "Authorisation du header manquant" });
    }

    const token = authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const payload = jwt.verify(token, accessTokenSecret);

    const user = await User.findById(payload.id, "wallet");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json({ wallet: user.wallet });
  } catch (error) {
    console.error("Erreur lors de la récupération du portefeuille :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateWallet = async (req, res) => {
  const { wallet } = req.body;
  const userId = req.user.id;

  console.log("Données reçues :", { userId, wallet });

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { wallet },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    return res.json({ wallet: updatedUser.wallet });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du portefeuille :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.refresh = async (req, res) => {
  const { token } = req.body;

  try {
    if (!token) return res.status(401).json({ message: "Token manquant" });

    const existingToken = await RefreshToken.findOne({ token });
    if (!existingToken || existingToken.expiredAt < new Date()) {
      return res.status(403).json({ message: "Token invalide ou expiré" });
    }

    const payload = jwt.verify(token, refreshTokenSecret);
    const accessToken = jwt.sign(
      { id: payload.id, email: payload.email },
      accessTokenSecret,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token :", error);
    res.status(403).json({ message: "Token invalide" });
  }
};

exports.logout = async (req, res) => {
  const { token } = req.body;

  try {
    await RefreshToken.deleteOne({ token });

    res.json({ message: "Déconnecté avec succès" });
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
