#!/usr/bin/env bash
# Run a JavaScript expression in the armed browser tab through the debug bridge and print the result.
#
# Usage:
#   BRIDGE_DIR=/tmp/debug-bridge ./eval.sh 'document.title'
#
# The expression may return a promise; its value must survive JSON (strings, numbers, plain objects, arrays).

set -o errexit
set -o nounset
set -o pipefail

source "$(dirname "$0")/queue_command.inc.sh"

queue_command_and_print_result "js" "$1"
