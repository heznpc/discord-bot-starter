FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

USER node

CMD ["node", "src/index.js"]
