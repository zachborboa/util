# Build extension for publishing to the Chrome Web Store.
# Usage: $ ./build_extension_for_chrome_web_store.sh always_select

extension_dir="${1}"
extension_dir="${extension_dir//\//}"
echo "extension directory: ${extension_dir}"

if [[ ! -d "${extension_dir}" ]]; then
    echo "directory required."
    echo "example: $0 ./directory_name"
    exit 1
fi

get_extension_version_script=$(cat <<'EOF'
import json
import sys

filename = sys.argv[1]
with open(filename, 'r') as f:
    data = json.load(f)
print(data.get('version', ''))
EOF
)

cd "${extension_dir}" && \
    extension_version=$(python -c "${get_extension_version_script}" "manifest.json") && \
    extension_filename="${extension_dir}_${extension_version}.zip" && \
    ([[ -f "../${extension_filename}" ]] && rm -rv "../${extension_filename}" || exit 0) && \
    zip -r "../${extension_filename}" manifest.json css/*.css img/* && \
    unzip -l "../${extension_filename}" && \
    unzip -t "../${extension_filename}" && \
    echo "Built ${extension_filename}"
