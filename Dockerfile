FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY entrypoint.sh ./

RUN npm install
RUN npm install -g db-migrate
RUN npm install -g db-migrate-pg

COPY . .

RUN npm run build

EXPOSE 3000