root="$(dirname $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd))/"
cd "${root}"

# Generate readme for extensions.
cd "extensions"
echo -e "## Extensions\n" > "README.md"
echo -e "$(find . -iname "manifest.json" -exec php -r '$path = "{}"; $data = json_decode(file_get_contents($path)); echo "### " . $data->name . "\n\n" . $data->description . "\n\n";' \;)" >> "README.md"
cd "${root}"

# Generate main readme.
readme="${root}/README.md"
echo -e "# Util\n" > "${readme}"
cat "extensions/README.md" >> "${readme}"
