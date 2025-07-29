FROM nginx

WORKDIR /app
COPY ./start.sh .
COPY ./nginx.conf /etc/nginx/conf.d/
RUN apt-get update && apt-get install -y nodejs npm && chmod +x ./start.sh