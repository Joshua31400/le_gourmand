FROM node:20-alpine
WORKDIR /usr/src/app
# Copie les dépendances spécifiques au Web
COPY package*.json ./
RUN npm install
# Copie le code du front
COPY . .
USER node
EXPOSE 8080
# Modifie le 8080 par le port défini dans ton web-server.js
CMD ["node", "web-server.js"]