FROM node:22-bookworm

# Install real silicon EDA toolchains (Verilator, Yosys)
RUN apt-get update && apt-get install -y --no-install-recommends \
    verilator \
    yosys \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install project dependencies
COPY package*.json ./
COPY packages/core/package.json ./packages/core/
COPY apps/web/package.json ./apps/web/

RUN npm install

# Copy source tree and build packages
COPY . .
RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "dev"]
