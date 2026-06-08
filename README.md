<p align="center">
  <img src="docs/assets/header-readme.png" alt="banner" height="400"/>
</p>    

## 🚀 Présentation du projet

"Le Gourmand" est une application web moderne permettant aux utilisateurs de partager, découvrir et organiser des recettes culinaires. Le projet met l'accent sur une architecture découplée, une conteneurisation robuste et une infrastructure évolutive.

## 🛠️ Architecture Technique

L'application repose sur une architecture 3-tiers conteneurisée avec Docker :

* **Front-end :** Serveur web Node.js/Express.
* **Back-end :** API RESTful Node.js/Express 5.
* **Base de données :** MySQL 8.0 pour la persistance des données (utilisateurs, recettes, ingrédients, messagerie).

## 🐳 Conteneurisation \& Infrastructure

Le projet utilise Docker pour garantir la portabilité et la reproductibilité des environnements.

### Points clés de la configuration :

* **Isolation :** Utilisation d'images `node:20-alpine` pour optimiser la légèreté et la sécurité.
* **Sécurité :** Exécution des conteneurs via un utilisateur non-root (`USER node`).
* **Réseau :** Isolation via un pont privé (`gourmand-network`) pour sécuriser les accès à la base de données.
* **Persistance :** Volumes gérés (`db-data`, `uploads-data`) pour la conservation des données et des médias.
* **Orchestration :** Gestion des dépendances de démarrage avec `healthcheck` pour éviter les erreurs de connexion.

## ⚙️ Installation \& Lancement

### Prérequis

* [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/) installés sur votre machine.

### Instructions de lancement

1. Clonez ce dépôt :

```bash
git clone <URL\_DU\_REPO>
cd le\_gourmand
```

2. Lancez l'infrastructure complète :

```bash
docker compose up --build
```

3. L'application est disponible aux adresses suivantes :

    * **Web UI :** http://localhost:3002
    * **API :** http://localhost:3001

## 📝 Justification des choix

Pour une documentation détaillée sur nos choix d'architecture (modèle 3-tiers, Express 5, conteneurisation), veuillez consulter le fichier `Rapport\_Technique\_Conteneurisation\_v2.pdf` inclus dans ce dépôt.

## 🔗 Credits

Adapté et développé par :  
**Pedro MARTINS • Tom PASSERMAN • Sebastien Delver • Joshua BUDGEN**

<div align="center">
    <p>Copyright © 2026. All Rights Reserved.</p>
</div>