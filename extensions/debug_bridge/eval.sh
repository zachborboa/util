#!/usr/bin/env bash
# Run a JavaScript expression in the armed browser tab through the debug bridge and print the result.
#
# Usage:
#   ./eval.sh 'document.title'
#   ./eval.sh <<'EOF'
#   const buttons = document.querySelectorAll('button');
#   buttons.length;
#   EOF
#
# The expression may return a promise; its value must survive JSON (strings, numbers, plain objects, arrays).

set -o errexit
set -o nounset
set -o pipefail

source "$(dirname "$0")/queue_command.inc.sh"

# Read the code from stdin when no argument is given, so a multi-line script needs no shell quoting.
if [[ $# -eq 0 ]]; then
    code="$(cat)"
else
    code="$1"
fi

queue_command_and_print_result "js" "${code}"
