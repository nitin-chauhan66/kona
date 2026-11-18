#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Kona macOS setup"
echo "================"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required. Install it from https://brew.sh, then run this setup again."
  read -r -p "Press Return to close..."
  exit 1
fi

if ! command -v rustup >/dev/null 2>&1; then
  echo "Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  # shellcheck disable=SC1091
  source "$HOME/.cargo/env"
fi

echo "Installing native Kona components..."
brew install node verilator icarus-verilog yosys

if ! command -v cargo-tauri >/dev/null 2>&1; then
  cargo install tauri-cli --version "^2"
fi

npm install
npm run build

echo "Building Kona.app and Kona.dmg..."
npm --workspace apps/desktop run build

echo
echo "Setup complete. Artifacts are in apps/desktop/src-tauri/target/release/bundle."
read -r -p "Press Return to close..."
