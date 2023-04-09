# Build the app
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

# Use the compiled app and minify the image size
FROM node:16-alpine
ENV NODE_ENV=production

WORKDIR /dist

COPY --from=0 /app/package*.json ./
RUN npm install --omit=dev

COPY --from=0 /app/build ./build

ENV PORT=$PORT
ENV DATABASE_URL=$DATABASE_URL
ENV AIR_ALERT_API_URL=$AIR_ALERT_API_URL
ENV AIR_ALERT_API_ACCESS_KEY=$AIR_ALERT_API_ACCESS_KEY

EXPOSE $PORT

CMD [ "npm", "start" ]