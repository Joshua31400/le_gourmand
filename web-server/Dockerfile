FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY ./web-server .

RUN mkdir -p public/assets && chown -R node:node public/assets

USER node
EXPOSE 3002
CMD ["node", "web-server.js"]