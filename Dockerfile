FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# These values only allow config validation during compilation; they are not runtime credentials.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build PAYLOAD_SECRET=build-only-placeholder-with-more-than-32-characters npm run build
ENV NODE_ENV=production
RUN mkdir -p /app/var/media && chown -R node:node /app/var
USER node
EXPOSE 3000
CMD ["npm", "start"]
