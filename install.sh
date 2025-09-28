#!/bin/bash

# Script to install git-plz as Git subcommand 'git plz'
# Run this from the project root

PROJECT_DIR="$(realpath "$(dirname "$0")")"
BUN_PATH="$(which bun)"

if [ -z "$BUN_PATH" ]; then
  echo "Error: Bun is required but not found in PATH. Install Bun from https://bun.sh"
  exit 1
fi

# Set up Git alias for 'plz' to run the script
git config --global alias.plz "!$BUN_PATH \"$PROJECT_DIR/index.ts\""

echo "Installed! Now run 'git plz' to use it."
echo "To uninstall: git config --global --unset alias.plz"
