# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Declare build args for Vite environment variables
ARG VITE_API_ORDER_URL
ARG VITE_API_INVENTORY_URL
ARG VITE_API_NOTIFICATION_URL
ARG VITE_CLOUD_RUN_SUFFIX

# Bind them so they are available to Node/Vite during compile
ENV VITE_API_ORDER_URL=$VITE_API_ORDER_URL
ENV VITE_API_INVENTORY_URL=$VITE_API_INVENTORY_URL
ENV VITE_API_NOTIFICATION_URL=$VITE_API_NOTIFICATION_URL
ENV VITE_CLOUD_RUN_SUFFIX=$VITE_CLOUD_RUN_SUFFIX

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the application using Node.js `serve`
FROM node:20-alpine

WORKDIR /app

# Install `serve` to run a static file server
RUN npm install -g serve

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 80

# Serve the static files on port 80
CMD ["serve", "-s", "dist", "-l", "80"]
