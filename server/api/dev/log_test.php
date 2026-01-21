<?php
// Set headers for JSON response
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// The path we found earlier
$logFile = '/home/u861850327/.logs/error_log_prospine_in';

try {
    if (!file_exists($logFile)) {
        echo json_encode(['status' => 'error', 'message' => 'File does not exist: ' . $logFile]);
        exit;
    }

    if (!is_readable($logFile)) {
        echo json_encode(['status' => 'error', 'message' => 'File is not readable. Root/System permissions might block PHP.']);
        exit;
    }

    // Attempt a very simple read of the last few bytes
    $handle = fopen($logFile, "r");
    if ($handle === false) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to open file handle.']);
        exit;
    }

    // Seek to near the end
    fseek($handle, -1024, SEEK_END);
    $data = fread($handle, 1024);
    fclose($handle);

    echo json_encode([
        'status' => 'success',
        'sample' => $data ? substr($data, -200) : 'No data read'
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
