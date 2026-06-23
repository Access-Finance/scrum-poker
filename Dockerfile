FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the lockfile only (reproducible builds).
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the app source.
COPY . .

# Fly's proxy forwards to this port (matches internal_port in fly.toml).
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
