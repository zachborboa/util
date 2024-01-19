#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/../"

node extensions/google_calendar_workflow/js/google_calendar_move_to_date_test.js
