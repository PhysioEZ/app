<?php
/**
 * Simple Traffic Logger for PhysioEZ Dev Environment
 * Injected into db.php to track all API requests
 */

$trafficLogFile = __DIR__ . '/traffic.json';

// Get request info
$request = [
    'timestamp' => date('c'), // ISO 8601 (e.g. 2024-01-20T10:00:00+05:30)
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
    'uri' => $_SERVER['REQUEST_URI'] ?? $_SERVER['PHP_SELF'] ?? 'UNKNOWN',
    'ip' => $_SERVER['REMOTE_ADDR'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 'UNKNOWN',
    'agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'UNKNOWN',
    'status' => http_response_code() ?: 200
];

// Exclusion List (Dev Tools)
$excluded = ['info.php', 'get_traffic.php', 'traffic_logger.php'];
foreach ($excluded as $ex) {
    if (strpos($request['uri'], $ex) !== false) {
        return; // Don't log self-monitoring calls
    }
}

// Read existing logs
$logs = [];
if (file_exists($trafficLogFile)) {
    $content = file_get_contents($trafficLogFile);
    $logs = json_decode($content, true) ?: [];
}

// Add new log to the start
array_unshift($logs, $request);

// Keep only last 50 requests
$logs = array_slice($logs, 0, 50);

// Write back
file_put_contents($trafficLogFile, json_encode($logs));
