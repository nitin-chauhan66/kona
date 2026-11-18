FROM node:22-bookworm-slim

ENV KONA_PACKAGED=1
ENV HOST=0.0.0.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        yosys \
        verilator \
        iverilog \
        ca-certificates \
        git \
        python3 \
        python3-yaml \
        build-essential \
        z3 \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 https://github.com/YosysHQ/SymbiYosys.git /opt/symbiyosys \
    && chmod +x /opt/symbiyosys/sbysrc/sby.py \
    && ln -s /opt/symbiyosys/sbysrc/sby.py /usr/local/bin/sby

WORKDIR /opt/kona
COPY package.json package-lock.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages
COPY schemas ./schemas
COPY examples ./examples
COPY rtl ./rtl
COPY tests ./tests
COPY README.md REQUIREMENTS.md MVP_TASKS.md ./
COPY kona.lock ./

RUN npm ci \
    && npm run build

EXPOSE 4173
CMD ["node", "apps/web/server.mjs"]
