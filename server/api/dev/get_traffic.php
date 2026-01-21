<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// /srv/http/admin/app/server/api/dev/get_traffic.php

$logFile = '/home/u861850327/.logs/slow_requests.log';
// Traffic Logger JSON for real-time tracking
// Traffic Logger JSON for real-time tracking
// Check common directory (server path) first
$trafficFile = __DIR__ . '/../../../common/traffic.json';
if (!file_exists($trafficFile)) {
    // Fallback to local
    $trafficFile = __DIR__ . '/traffic.json';
}
$traffic = [];

// 1. Get Real-time traffic from traffic.json (Primary)
if (file_exists($trafficFile)) {
    $traffic = json_decode(file_get_contents($trafficFile), true) ?: [];
}

// 2. Get Slow Requests from log file (Secondary / Errors)
if (file_exists($logFile)) {
    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $lines = array_slice($lines, -20); // Last 20 slow requests
    
    foreach ($lines as $line) {
        if (preg_match('/^\[(.*?)\] SLOW_REQUEST \| (.*?)s \| (.*?) (.*)$/', $line, $matches)) {
            // These act as "Error/Slow" highlights in the stream
            $traffic[] = [
                'timestamp' => $matches[1],
                'method' => $matches[3],
                'uri' => $matches[4],
                'ip' => 'SLOW',
                'agent' => 'Execution Time: ' . $matches[2] . 's',
                'status' => 503 // Mark as service degradation
            ];
        }
    }
}

// Sort by timestamp descending
usort($traffic, function($a, $b) {
    return strtotime($b['timestamp']) - strtotime($a['timestamp']);
});

// Return merged traffic
echo json_encode([
    'status' => 'success',
    'traffic' => array_slice($traffic, 0, 100)
]);
