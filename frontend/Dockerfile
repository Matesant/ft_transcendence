FROM alpine

WORKDIR /app
COPY ./start.sh .
COPY ./nginx.conf /etc/nginx/conf.d/
RUN apk add --no-cache nodejs npm && chmod +x ./start.sh