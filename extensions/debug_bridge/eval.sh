#!/usr/bin/env bash
# Run a JavaScript expression in the browser tab in view through the debug bridge and print the result.
#
# Usage:
#   BRIDGE_DIR=/path/to/queue ./eval.sh 'document.title'
#
# The expression may return a promise; its value must survive JSON (strings, numbers, plain objects, arrays).

set -o errexit
set -o nounset
set -o pipefail

# Wait this long for a result; the tab only picks up commands while it's in view, so allow time to switch to it.
timeout_seconds=30

code="$1"
id="$(date +%s)-$$-${RANDOM}"
commands_dir="${BRIDGE_DIR}/commands"
result_file="${BRIDGE_DIR}/results/${id}.json"

# Write under a temporary name first, so the server never hands out a half-written command.
mkdir -p "${commands_dir}"
printf '%s' "${code}" >"${commands_dir}/${id}.tmp"
mv "${commands_dir}/${id}.tmp" "${commands_dir}/${id}.js"

for ((elapsed = 0; elapsed < timeout_seconds * 10; elapsed++)); do
    if [[ -f "${result_file}" ]]; then
        cat "${result_file}"
        echo
        exit 0
    fi
    sleep 0.1
done

echo "No result after ${timeout_seconds}s; is a tab armed and in view, and is the server running?" >&2
rm -f "${commands_dir}/${id}.js"
exit 1
