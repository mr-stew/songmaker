# Use Node.js v12 on Debian Buster
FROM node:12-buster

# Install Python 2.7 (may be needed for node-gyp)
RUN apt-get update && apt-get install -y python2.7 --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Install yarn and a static server globally
RUN npm install -g yarn serve

# Set the working directory
WORKDIR /app

# Copy package manifests and install dependencies
# This leverages Docker layer caching
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the application for production
RUN yarn build

# Expose the port the app will run on (Railway injects $PORT)
# EXPOSE is more for documentation; Railway uses the PORT env var
# EXPOSE 3000

# Command to run the application using the serve package
# Serve the 'dist' directory, enable single-page app mode (-s), and listen on $PORT
# If index.html is not in 'dist' after build, adjust the CMD or build process
CMD ["serve", "-s", "dist", "-l", "$PORT"] 