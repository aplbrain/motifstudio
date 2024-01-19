# Dockerfile for a Nextjs app.
# Build in an environment with node and npm installed,
# and then copy the build into a new environment for static serving.

# Build environment
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build app to build/ folder
RUN npm run build

# Static serving environment
FROM nginx:1.19.6-alpine

# Copy build from build environment
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
