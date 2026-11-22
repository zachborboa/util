# Queue a command for the debug bridge and print its result once the armed tab answers.
#
# Usage, from a sibling script:
#   source "$(dirname "$0")/queue_command.inc.sh"
#   queue_command_and_print_result "js" "document.title"

# Default the queue directory, so neither the server nor the clients need it spelled out.
export BRIDGE_DIR="${BRIDGE_DIR:-/tmp/debug-bridge}"

# Wait this long for a result: long enough to start the server or arm a tab after queueing.
timeout_seconds=30

queue_command_and_print_result() {
    local extension="$1"
    local content="$2"
    local id
    local commands_dir
    local result_file

    id="$(date +%s)-$$-${RANDOM}"
    commands_dir="${BRIDGE_DIR}/commands"
    result_file="${BRIDGE_DIR}/results/${id}.json"

    # Write under a temporary name first, so the server never hands out a half-written command.
    mkdir -p "${commands_dir}"
    printf '%s' "${content}" >"${commands_dir}/${id}.tmp"
    mv "${commands_dir}/${id}.tmp" "${commands_dir}/${id}.${extension}"

    for ((elapsed = 0; elapsed < timeout_seconds * 10; elapsed++)); do
        if [[ -f "${result_file}" ]]; then
            cat "${result_file}"
            echo
            return 0
        fi
        sleep 0.1
    done

    echo "No result after ${timeout_seconds}s; is a tab armed and is the server running?" >&2
    rm -f "${commands_dir}/${id}.${extension}"
    return 1
}
