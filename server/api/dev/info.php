<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

/**
 * Modular Developer Statistics API
 * Returns expanded metadata for the dev dashboard
 */

// Fix Path: Up 3 levels to reach /srv/http/admin/common/db.php
$dbPath = dirname(__FILE__) . '/../../../common/db.php';

if (!file_exists($dbPath)) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'System Core not found'
    ]);
    exit;
}

require_once $dbPath;

$stats = [
    'status' => 'success',
    'timestamp' => date('c'),
    'environment' => [
        'php_version' => PHP_VERSION,
        'api_version' => '3.1.5-modular',
        'db_status' => 'Stable',
        'load_time' => round((microtime(true) - $_SERVER["REQUEST_TIME_FLOAT"]) * 1000, 2) . 'ms'
    ],
    'system' => [
        'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
        'disk_free' => @round(disk_free_space("/") / 1024 / 1024 / 1024, 2) . ' GB'
    ],
    'traffic' => [],
    'logs' => []
];



function parse_size($size) {
    $unit = preg_replace('/[^bkmgtpezy]/i', '', $size);
    $size = preg_replace('/[^0-9\.]/', '', $size);
    if ($unit) {
        return round($size * pow(1024, stripos('bkmgtpezy', $unit[0])));
    }
    return round($size);
}

try {
    $action = $_GET['action'] ?? '';

    if ($action === 'php_config') {
        // Return structured data instead of HTML
        $config = [
            'Core' => [
                'PHP Version' => PHP_VERSION,
                'Server Software' => $_SERVER['SERVER_SOFTWARE'],
                'OS' => php_uname(),
                'Max Execution Time' => ini_get('max_execution_time') . 's',
                'Memory Limit' => ini_get('memory_limit'),
                'Upload Max Filesize' => ini_get('upload_max_filesize'),
                'Post Max Size' => ini_get('post_max_size'),
                'Display Errors' => ini_get('display_errors'),
                'Log Errors' => ini_get('log_errors'),
            ],
            'Database' => [
                'PDO Drivers' => implode(', ', pdo_drivers()),
            ],
            'Extensions' => get_loaded_extensions(),
        ];
        
        // Add OPcache status if available
        if (function_exists('opcache_get_status')) {
            $opcache = opcache_get_status(false);
            $config['OPcache'] = [
                'Enabled' => $opcache['opcache_enabled'] ? 'Yes' : 'No',
                'Memory Used' => isset($opcache['memory_usage']) ? round($opcache['memory_usage']['used_memory'] / 1024 / 1024, 2) . ' MB' : 'N/A'
            ];
        }

        echo json_encode(['status' => 'success', 'data' => $config]);
        exit;
    }

    // System Stats
    $memUsage = memory_get_usage();
    $memLimitStr = ini_get('memory_limit');
    $memLimit = ($memLimitStr === '-1') ? -1 : parse_size($memLimitStr);
    
    $diskFree = @disk_free_space("/");
    $diskTotal = @disk_total_space("/");

    // Updates stats array
    $stats = [
        'status' => 'success',
        'timestamp' => date('c'),
        'environment' => [
            'php_version' => PHP_VERSION,
            'api_version' => '3.1.5-modular',
            'db_status' => 'Stable',
            'load_time' => round((microtime(true) - $_SERVER["REQUEST_TIME_FLOAT"]) * 1000, 2) . 'ms'
        ],
        'system' => [
            'memory_usage' => round($memUsage / 1024 / 1024, 2) . ' MB',
            'memory_limit' => ($memLimit === -1) ? 'Unlimited' : round($memLimit / 1024 / 1024, 2) . ' MB',
            'memory_percent' => ($memLimit > 0) ? round(($memUsage / $memLimit) * 100, 2) : 0,
            
            'disk_free' => round($diskFree / 1024 / 1024 / 1024, 2) . ' GB',
            'disk_total' => round($diskTotal / 1024 / 1024 / 1024, 2) . ' GB',
            'disk_used_percent' => ($diskTotal > 0) ? round((($diskTotal - $diskFree) / $diskTotal) * 100, 2) : 0
        ],
        'traffic' => [],
        'logs' => []
    ];

    // 1. Fetch Traffic (Last 5)
    $trafficFile = __DIR__ . '/traffic.json';
    if (file_exists($trafficFile)) {
        $traffic = json_decode(file_get_contents($trafficFile), true) ?: [];
        $stats['traffic'] = array_slice($traffic, 0, 5);
    }

    // 2. Fetch Logs (Last 5)
    $logFile = '/home/u861850327/.logs/error_log_prospine_in';
    if (file_exists($logFile)) {
        $handle = fopen($logFile, 'r');
        fseek($handle, -5000, SEEK_END); // Read last 5KB
        $data = fread($handle, 5000);
        fclose($handle);
        $lines = explode("\n", trim($data));
        $stats['logs'] = array_slice(array_reverse(array_filter($lines)), 0, 5);
    }

} catch (Exception $e) {
    $stats['status'] = 'partial_success';
    $stats['error'] = $e->getMessage();
}

echo json_encode($stats);
