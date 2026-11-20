# Debug Bridge

Run JavaScript in the browser tab in view from a terminal, through a local server.

Keep the extension off at `chrome://extensions` except while debugging: it holds the `debugger` permission, which can run any code in any tab it polls from.

- Start the server with the command on the extension's options page, which fills in the pairing token: `BRIDGE_DIR=/tmp/debug-bridge BRIDGE_TOKEN=<token> php -S localhost:8765 server.php`
  - The extension refuses any command without that token, so another program listening on the port can't feed it code.
- Point the extension at the site to debug: swap `https://example.com/*` under `content_scripts` in `manifest.json` for that site's pattern.
  - It ships matching only `example.com`, so it reaches no real site until someone opts in by editing the manifest.
  - Revert the edit when done rather than committing it.
- Turn the extension on (or reload it after the manifest edit) and refresh the tab to inspect, then leave it in view.
- Arm that tab by clicking the extension's toolbar icon; the icon shows `ON` while armed.
  - Only the armed tab runs commands, and the arm lapses on its own after a while, when the tab closes or when it leaves the site it was armed on.
  - Click the icon again to disarm.
- Run an expression in that tab and print its result: `BRIDGE_DIR=/tmp/debug-bridge ./eval.sh 'document.title'`

Commands get queued only as files under `$BRIDGE_DIR/commands`, never over HTTP, so a web page that finds the port can't run code through the bridge.

Chrome flashes a "started debugging this browser" bar while each command runs.
