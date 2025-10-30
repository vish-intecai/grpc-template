# Use the official Node.js 22 LTS image as base
FROM node:22-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose application port (see src/config/index.ts: 50051)
EXPOSE 50051

# Start the application
CMD ["npm", "run", "start"]

