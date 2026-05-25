FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package.json ./
RUN npm install

# Copiar código do frontend
COPY . .

# Expor porta
EXPOSE 3000

# Executar servidor Next.js
CMD ["npm", "run", "dev"]
