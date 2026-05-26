FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

# Use non-dev start for production containers
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
