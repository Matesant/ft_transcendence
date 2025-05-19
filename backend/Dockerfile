# Dockerfile para o backend Node.js
FROM node:18-alpine

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia o código do aplicativo
COPY . .

# Cria o diretório de dados
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 3000

CMD ["npm", "run", "dev"]
