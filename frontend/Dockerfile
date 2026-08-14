FROM alpine

WORKDIR /app
COPY ./start.sh .
# http.d é o include dentro do http{} no Alpine; conf.d é contexto main e
# faria o nginx recusar o bloco server{}.
COPY ./nginx.conf /etc/nginx/http.d/default.conf
RUN apk add --no-cache nodejs npm nginx && chmod +x ./start.sh