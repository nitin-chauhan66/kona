#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Kona macOS setup"
echo "================"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This setup script must run on macOS."
  read -r -p "Press Return to close..."
  exit 1
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Installing the Apple Command Line Tools..."
  xcode-select --install
  echo "Complete the Command Line Tools installer, then run this setup again."
  read -r -p "Press Return to close..."
  exit 0
fi

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
source "$HOME/.cargo/env" 2>/dev/null || true

echo "Installing macOS and native Kona prerequisites..."
brew install node verilator icarus-verilog yosys

rustup default stable
rustup target add "$(rustc -vV | sed -n 's/^host: //p')"

if ! cargo tauri --version >/dev/null 2>&1; then
  cargo install tauri-cli --version "^2"
fi

npm ci
npm run build

echo "Building Kona.app and Kona.dmg..."
npm --workspace apps/desktop run build

APP_DIR="$ROOT/apps/desktop/src-tauri/target/release/bundle/macos"
DMG_DIR="$ROOT/apps/desktop/src-tauri/target/release/bundle/dmg"
if ! find "$APP_DIR" -maxdepth 1 -name '*.app' -print -quit | grep -q .; then
  echo "Build completed without finding a .app bundle under $APP_DIR"
  read -r -p "Press Return to close..."
  exit 1
fi
if ! find "$DMG_DIR" -maxdepth 1 -name '*.dmg' -print -quit | grep -q .; then
  echo "Build completed without finding a DMG under $DMG_DIR"
  read -r -p "Press Return to close..."
  exit 1
fi

echo
echo "Setup complete."
echo "App: $APP_DIR"
echo "DMG: $DMG_DIR"
read -r -p "Press Return to close..."
