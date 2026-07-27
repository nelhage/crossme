FROM node:22-alpine AS build

WORKDIR /crossme
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx
ADD nginx.conf /etc/nginx/nginx.conf
COPY --from=build /crossme/dist /crossme/dist
