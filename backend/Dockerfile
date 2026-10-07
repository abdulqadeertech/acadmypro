FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p data backups
EXPOSE 5000
CMD ["npm","start"]
