<?php
// Serve the debug bridge: hand queued JavaScript to the extension and save what it sends back.
//
// Usage:
//   ./start_server.sh
//   ./eval.sh 'document.title'
//
// Commands get queued only as files under $BRIDGE_DIR/commands, never over HTTP, so a web page that finds the port can't run code through the bridge.
// Send the token with every command, so the extension can tell this server from any other program listening on the port.

// Print a line to the server's console, beside PHP's own request log, so each command handed out leaves a visible record.
function log_line(string $message): void
{
    file_put_contents('php://stderr', $message . "\n");
}

// Squeeze text onto one short line, so a long payload can't flood the console.
function preview(string $text): string
{
    return substr(preg_replace('/\s+/', ' ', $text), 0, 120);
}

// Refuse requests addressed to any other host, so a site whose domain resolves to this machine can't read commands or plant results.
$expected_host = "localhost:{$_SERVER['SERVER_PORT']}";
if (($_SERVER['HTTP_HOST'] ?? '') !== $expected_host) {
    http_response_code(403);
    exit;
}

$bridge_dir = getenv('BRIDGE_DIR');
if ($bridge_dir === false || $bridge_dir === '') {
    http_response_code(500);
    exit("Set BRIDGE_DIR to the queue directory.\n");
}

$bridge_token = getenv('BRIDGE_TOKEN');
if ($bridge_token === false || $bridge_token === '') {
    http_response_code(500);
    exit("Set BRIDGE_TOKEN to the token on the extension's options page.\n");
}
foreach (['commands', 'sent', 'results'] as $subdir) {
    if (!is_dir("{$bridge_dir}/{$subdir}")) {
        mkdir("{$bridge_dir}/{$subdir}", 0700, true);
    }
}

// Refuse a queue directory another account can reach: whoever can drop a file into commands runs code in the armed tab.
// Log the refusal too, since the extension is the only one that sees the response.
foreach (['', '/commands', '/sent', '/results'] as $subdir) {
    $queue_dir = "{$bridge_dir}{$subdir}";
    if (fileowner($queue_dir) !== posix_geteuid()) {
        log_line("Refusing {$queue_dir}: another account owns it.");
        http_response_code(500);
        exit;
    } elseif ((fileperms($queue_dir) & 0077) !== 0) {
        log_line("Refusing {$queue_dir}: other accounts can open it; run chmod 700 on it.");
        http_response_code(500);
        exit;
    }
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Hand out the oldest queued command and move it aside so no other tab runs it too.
if ($path === '/next' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $command_files = glob("{$bridge_dir}/commands/*.js");
    sort($command_files);
    if (count($command_files) === 0) {
        http_response_code(204);
        exit;
    }
    $command_file = $command_files[0];
    $id = basename($command_file, '.js');
    $code = file_get_contents($command_file);
    rename($command_file, "{$bridge_dir}/sent/{$id}.js");
    $preview = preview($code);
    log_line("Handed out {$id}: {$preview}");
    header('Content-Type: application/json');
    echo json_encode([
        'code' => $code,
        'id' => $id,
        'token' => $bridge_token,
    ]);
    exit;
}

// Save a result, accepting only ids that were handed out, so nothing else can plant a result file.
if ($path === '/result' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = file_get_contents('php://input');
    $result = json_decode($body, true);
    $id = $result['id'] ?? '';
    if (preg_match('/^[A-Za-z0-9_-]+$/', $id) !== 1) {
        http_response_code(400);
        exit;
    } elseif (!file_exists("{$bridge_dir}/sent/{$id}.js")) {
        http_response_code(404);
        exit;
    }
    file_put_contents("{$bridge_dir}/results/{$id}.json", $body);
    unset($result['id']);
    $preview = preview(json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    log_line("Saved result {$id}: {$preview}");
    http_response_code(204);
    exit;
}

http_response_code(404);
