# Dockerfile - Backend containerization
# This file defines the Docker image configuration for the backend application
# Used to build and deploy the backend in a containerized environment

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start command (will be overridden by docker-compose)
CMD ["npm", "start"]
