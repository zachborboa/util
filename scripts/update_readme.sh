readme="$(dirname $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd))/README.md"
echo -e "# Util\n" > "${readme}"
echo -e "## Extensions\n" >> "${readme}"
echo -e "$(find . -iname "manifest.json" -exec php -r '$path = "{}"; $data = json_decode(file_get_contents($path)); echo
"### " . $data->name . "\n\n" . $data->description . "\n\n";' \;)" >> "${readme}"
