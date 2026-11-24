# Debug Bridge

Run JavaScript in the armed browser tab from a terminal, through a local server.

Keep the extension off at `chrome://extensions` except while debugging: it holds the `debugger` permission, which can run any code in any tab.

- Pair once: run the command on the extension's options page, which saves the pairing token to `~/.config/debug-bridge/token`.
  - The extension refuses any command without that token, so another program listening on the port can't feed it code.
  - Arming opens the options page until the first command arrives with the matching token, and again whenever a paired install gets a wrong one.
- Start the server with `./start_server.sh`; it runs until stopped.
- Arm the tab to debug by clicking the extension's toolbar icon; the icon shows `ON` while armed and Chrome shows its "started debugging this browser" bar.
  - The tab can sit in the background; commands still run in it.
  - Only the armed tab runs commands, and the arm lapses on its own after a while, when the tab closes or when it leaves the site it was armed on.
  - Click the icon again, or press Cancel on Chrome's debugging bar, to disarm.
- Run an expression in that tab and print its result: `./eval.sh 'document.title'`, or pipe a longer script to `./eval.sh` on stdin

Commands get queued only as files under `$BRIDGE_DIR/commands`, never over HTTP, so a web page that finds the port can't run code through the bridge.

The server also refuses any request without the extension's `X-Debug-Bridge` header, which a web page can't send to localhost, so a page can't take queued commands or tell when one is waiting.
