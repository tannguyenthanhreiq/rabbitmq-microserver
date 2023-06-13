# Installer stage
FROM node:16

WORKDIR /app

RUN apt update && apt upgrade -y && apt install -y ffmpeg

# Copy package*.json files and install dependencies
COPY package*.json ./
RUN yarn install --only=production

# Copy the rest of the application files
COPY . .

# Expose the port and set environment variables
EXPOSE 8080
ENV PORT 8080
ENV HOST 0.0.0.0

# Run the application
CMD ["yarn", "start"]