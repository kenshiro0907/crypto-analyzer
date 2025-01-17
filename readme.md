# Nom du Projet

Ce projet est une application web full-stack qui permet aux utilisateurs de gérer leur portefeuille numérique. Le backend est construit avec Node.js et Express, tandis que le frontend utilise React. L'application inclut des fonctionnalités d'authentification, de gestion de portefeuille et de rafraîchissement de tokens.

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

- **Node.js** : Version 16 ou supérieure. Vérifiez votre version avec :
  ```bash
  node -v
  ```
- **npm** : Généralement installé avec Node.js. Vérifiez la version avec :
  ```bash
  npm -v
  ```
- **MongoDB** : Ce projet utilise MongoDB comme base de données. Vous pouvez installer MongoDB localement ou utiliser MongoDB Atlas pour un cluster cloud.

---

## Installation et Configuration

### 1. Cloner le dépôt

Clonez ce dépôt sur votre machine locale :

```bash
git clone https://github.com/kenshiro0907/crypto-analyzer.git
cd crypto-analyzer
```

### 2. Installer les dépendances

Installez les dépendances pour le backend et le frontend :

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configurer l'environnement

Créez un fichier `.env` dans le dossier `backend` et ajoutez les variables d'environnement nécessaires. Exemple :

```env
# .env
PORT=5000
MONGODB_URI=mongodb+srv://votre-utilisateur:votre-mot-de-passe@cluster0.mongodb.net/?retryWrites=true&w=majority&appName=votre-application
ETHERSCAN_API_URL=https://api.etherscan.io/api
ETHERSCAN_API_KEY=votre-etherscan-api-key
CRYPTOCOMPARE_API_URL=https://min-api.cryptocompare.com/data/pricehistorical
CRYPTOCOMPARE_API_KEY=votre-cryptocompare-api-key
WALLET_ADDRESS=votre-adresse-wallet
NODE_ENV=development
```

### 4. Démarrer le serveur

Pour exécuter le projet en mode développement :

```bash
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm start
```

- Le backend sera accessible à l'adresse : `http://localhost:5000`
- Le frontend sera accessible à l'adresse : `http://localhost:3000`

---

## Structure du Projet

### Backend

```
backend/

├── config/        # Configuration de connexion à MongoDB
├── constante/     # Constantes globales
├── controllers/   # Contrôleurs pour gérer les routes
├── models/        # Modèles MongoDB
├── routes/        # Définition des routes
├── middleware/    # Middlewares personnalisés
├── utils/         # Utilitaires (par exemple, fonctions d'envoi de mail)
├── server.js      # Point d'entrée du serveur
├── package.json   # Dépendances et scripts
└── .env           # Variables d'environnement
```

### Frontend

```
frontend/
├── public/        # Fichiers statiques (HTML, images)
├── src/
│   ├── components/ # Composants React
│   ├── hooks/      # Hooks de l'application
│   ├── pages/      # Pages de l'application
│   ├── services/   # Services API (axios)
│   ├── App.tsx     # Composant principal
│   ├── index.tsx   # Point d'entrée de l'application
│   └── styles/     # Fichiers CSS ou SCSS
├── package.json    # Dépendances et scripts
└── .env            # Variables d'environnement frontend (si nécessaire)
```

---

## Points de Terminaison de l'API

### Authentification

**Inscription :**

```bash
curl -X POST http://localhost:5000/api/v1/auth/register -H "Content-Type: application/json" -d '{
  "email": "utilisateur@example.com",
  "password": "motdepasse123"
}'
```

**Connexion :**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d '{
  "email": "utilisateur@example.com",
  "password": "motdepasse123"
}'
```

**Rafraîchir le token :**

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh -H "Content-Type: application/json" -d '{}'
```

**Déconnexion :**

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout -H "Content-Type: application/json" -d '{}'
```

**Mot de passe oublié :**

```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot-password -H "Content-Type: application/json" -d '{
  "email": "utilisateur@example.com"
}'
```

**Réinitialiser le mot de passe :**

```bash
curl -X POST http://localhost:5000/api/v1/auth/reset-password/votre-token -H "Content-Type: application/json" -d '{
  "password": "nouveau-mot-de-passe"
}'
```

**Vérifier l'addresse email :**

```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-email/votre-token
```

### Portefeuille

**Récupérer le portefeuille :**

```bash
curl -X GET http://localhost:5000/api/v1/auth/get_wallet -H "Authorization: Bearer <access-token>"
```

**Mettre à jour le portefeuille :**

```bash
curl -X PUT http://localhost:5000/api/v1/auth/update_wallet -H "Authorization: Bearer <access-token>" -H "Content-Type: application/json" -d '{
  "wallet": "votre-wallet"
}'
```

**Visualiser l'évolution de la quantité en eth du portefeuille en fonction des transactions:**

```bash
curl -X GET http://localhost:5000/api/v1/user/get_data/:address -H "Authorization: Bearer <access-token>"
```

---

## Contribution

Si vous souhaitez contribuer à ce projet, suivez ces étapes :

1. Forkez le dépôt.
2. Créez une nouvelle branche :
   ```bash
   git checkout -b feature/nouvelle-fonctionnalité
   ```
3. Committez vos changements :
   ```bash
   git commit -m 'Ajouter une nouvelle fonctionnalité'
   ```
4. Poussez vers la branche :
   ```bash
   git push origin feature/nouvelle-fonctionnalité
   ```
5. Ouvrez une Pull Request.

---

## Licence

Ce projet est sous licence MIT. Consultez le fichier [LICENSE](./LICENSE) pour plus de détails.
