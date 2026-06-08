FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY ./api-server .

USER node
EXPOSE 3001
CMD ["node", "api-server.js"]