const User = require("../models/User");
const sendEmail = require("../utils/email");
const validatePassword = require("../utils/validatePassword");
const RefreshToken = require("../models/RefreshToken");
const { accessTokenSecret, refreshTokenSecret } = require("../constante/const");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const walletAdress = process.env.WALLET_ADDRESS;

exports.register = async (req, res) => {
  const { email, password } = req.body;

  // TODO: check if password is at least 6 characters long + uppercqse + lowercase + special character
  if (!validatePassword(password)) {
    return res.status(400).json({
      error:
        "Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un caractère spécial.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      wallet: walletAdress,
    });
    await user.save();

    // TODO: send email verification

    const verificationUrl = `http://localhost:5000/api/v1/auth/verify-email/${email}`;
    const message = `Cliquez sur ce lien pour vérifier votre email : ${verificationUrl}`;

    sendEmail(user.email, "Vérification de l'addresse email", message);

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
      console.log("Utilisateur introuvable");
      return res.status(401).json({ message: "Utilisateur introuvable" });
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

      console.log("Identifiants invalides");
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

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const token = new RefreshToken({
      token: hashedRefreshToken, // stores hashed refresh token instead
      userId: user._id,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await token.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure en production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    }); // httponly, secure, samesite

    res.status(200).json({ accessToken }); // remove refreshtoken
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
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
  const refreshToken = req.cookies.refreshToken; // = req.cookies.refreshToken

  try {
    if (!refreshToken)
      return res.status(401).json({ message: "Token manquant" });

    const payload = jwt.verify(refreshToken, refreshTokenSecret);

    const existingToken = await RefreshToken.findOne({ userId: payload.id });
    if (!existingToken || existingToken.expiredAt < new Date()) {
      return res.status(403).json({ message: "Token invalide ou expiré" });
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      existingToken.token
    );
    if (!isTokenValid) {
      return res.status(403).json({ message: "Token invalide" });
    }

    // delete old refresh token + create new one and store in db (attention hash)
    // return refresh token in cookies

    const accessToken = jwt.sign(
      { id: payload.id, email: payload.email },
      accessTokenSecret,
      { expiresIn: "15m" }
    );

    const newRefreshToken = jwt.sign(
      { id: payload.id, email: payload.email },
      refreshTokenSecret,
      { expiresIn: "7d" }
    );

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await RefreshToken.deleteOne({ _id: existingToken._id });

    const newToken = new RefreshToken({
      token: hashedRefreshToken,
      userId: payload.id,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    });
    await newToken.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure en production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token :", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token invalide" });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Token expiré" });
    }

    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.logout = async (req, res) => {
  console.log("Cookies reçus :", req.cookies);
  const refreshToken = req.cookies.refreshToken; // = req.cookies.refreshTojen

  try {
    if (!refreshToken) {
      return res.status(400).json({ message: "Token manquant" });
    }

    const tokens = await RefreshToken.find({});

    let existingToken = null;
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.token);
      if (isMatch) {
        existingToken = token;
        break;
      }
    }

    if (!existingToken) {
      return res.status(404).json({ message: "Token introuvable" });
    }

    await RefreshToken.deleteOne({ _id: existingToken._id });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure en production
      sameSite: "strict",
    });

    res.status(200).json({ message: "Déconnecté avec succès" });
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

    // TODO : delete all refresh tokens from the user
    await RefreshToken.deleteMany({ userId: user._id });

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
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    user.isEmailVerified = true;
    await user.save();

    res.status(200).json({ message: "Email vérifié avec succès" });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
