# Dockerfile for a Nextjs app.
# Build in an environment with node and npm installed,
# and then copy the build into a new environment for static serving.

# Build environment
FROM node:22-alpine as build

ARG NEXT_PUBLIC_API_BASE_URL=https://api.motifstudio.bossdb.org
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

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
