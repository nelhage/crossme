FROM node:12

WORKDIR /crossme
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx
ADD nginx.conf /etc/nginx/nginx.conf
COPY --from=0 /crossme/build /crossme/build
