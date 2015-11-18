# Clean up *.json files.

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
extensions_dir=$(dirname "${DIR}")
echo "scanning extensions directory: ${extensions_dir}"
find "${extensions_dir}" -type f -iname "*.json" -exec python "${extensions_dir}/scripts/clean_up_json_file.py" {} \;
