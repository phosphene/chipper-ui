FROM node:22-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC vars must be set at BUILD TIME (baked into JS bundle)
ARG NEXT_PUBLIC_API_URL=https://wci-api.fly.dev
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Cache bust: force fresh build (no layer cache for build step)
ARG CACHE_BUST=1
RUN echo "Build $CACHE_BUST" && npm run build

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

CMD ["npm", "start"]
