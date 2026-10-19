FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000 3001