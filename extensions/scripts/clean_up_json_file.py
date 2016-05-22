# Clean up the specified json file.

import json
import sys


file_path = sys.argv[1]
print file_path
with open(file_path, 'r') as f:
    data = f.read()

json_data = json.loads(data)
pretty_json_data = json.dumps(json_data, indent=2, sort_keys=True, separators = (',', ': '))
with open(file_path, 'w') as f:
    f.write('{}'.format(pretty_json_data))
