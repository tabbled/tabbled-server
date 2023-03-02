FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY entrypoint.sh ./

RUN npm install
RUN npm install -g db-migrate
RUN npm install -g db-migrate-pg

COPY . .

RUN npm run build

ENV DB_HOST=localhost
ENV DB_PORT=5433
ENV DB_PASSWORD=password
ENV DB_USER=user
ENV DB_DATABASE=tabbled
ENV PORT=3000

EXPOSE $PORT

CMD ["/bin/sh", "./entrypoint.sh"]