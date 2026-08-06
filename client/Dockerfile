# syntax=docker/dockerfile:1

ARG NODE_VERSION=24
ARG NGINX_VERSION=1.29

FROM node:${NODE_VERSION}-alpine AS build

WORKDIR /src

# Install dependencies in their own layer, keyed only on the lockfile.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build

FROM nginx:${NGINX_VERSION}-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /src/dist /crossme/dist

# Run the master process unprivileged too, not just the workers. nginx.conf
# points its pid and every temp path at /tmp, so nothing should land in
# /var/cache/nginx; chowning it anyway keeps a missed directive from turning
# into a permission error at startup.
RUN chown -R nginx:nginx /var/cache/nginx

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz
