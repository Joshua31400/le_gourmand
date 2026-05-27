FROM node:20-alpine
WORKDIR /usr/src/app
# Copie les dépendances spécifiques à l'API
COPY package*.json ./
RUN npm install
# Copie le code de l'API
COPY . .
USER node
EXPOSE 3000
CMD ["node", "api-server.js"]