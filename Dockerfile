# Use Node.js LTS as base image
FROM node:lts-alpine AS builder


# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN yarn build

# Expose the port Next.js is running on
EXPOSE 8503

# Command to run the Next.js application
CMD ["yarn", "start"]
