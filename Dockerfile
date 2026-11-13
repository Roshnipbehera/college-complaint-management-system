FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Set default port
ENV PORT=5000
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
