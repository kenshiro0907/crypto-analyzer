const User = require("../models/User");
const sendEmail = require("../utils/email");
const RefreshToken = require("../models/RefreshToken");
const { accessTokenSecret, refreshTokenSecret } = require("../constante/const");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

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
    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res
        .status(403)
        .json({ message: "Compte verrouillé. Réessayez plus tard." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 3) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }

      await user.save();

      return res.status(401).json({ message: "Identifiants invalides" });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const message = `Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur ce lien pour procéder : ${resetUrl}`;

    sendEmail(user.email, "Réinitialisation de mot de passe", message);

    res.status(200).json({ message: "Email de réinitialisation envoyé" });
  } catch (error) {
    console.error("Erreur lors de la récupération du mot de passe :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error
    );
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Email validé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la validation de l'email :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
