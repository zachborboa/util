#!/usr/bin/env bash
# Start the debug bridge server with the pairing token saved from the extension's options page.
#
# Usage:
#   ./start_server.sh
#
# Runs until stopped; queue commands from another shell with ./eval.sh.

set -o errexit
set -o nounset
set -o pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

# Pick up the BRIDGE_DIR default shared with the clients.
source "${script_dir}/queue_command.inc.sh"

# Keep the port in sync with DEBUG_BRIDGE_URL in js/background.js and host_permissions in manifest.json.
port=8765
token_file="${HOME}/.config/debug-bridge/token"

if [[ ! -f "${token_file}" ]]; then
    echo "No pairing token at ${token_file}; save it with the command on the extension's options page." >&2
    exit 1
fi

BRIDGE_TOKEN="$(cat "${token_file}")"
export BRIDGE_TOKEN

exec php -S "localhost:${port}" "${script_dir}/server.php"
