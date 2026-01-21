<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

date_default_timezone_set('Asia/Kolkata');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../../../common/db.php';

$currentEmployeeId = $_REQUEST['employee_id'] ?? $_REQUEST['user_id'] ?? null;

if (!$currentEmployeeId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing employee_id']);
    exit;
}

// Verify that this user is a developer
$stmtV = $pdo->prepare("SELECT job_title FROM employees WHERE employee_id = ?");
$stmtV->execute([$currentEmployeeId]);
$jt = $stmtV->fetchColumn();
if (strtolower(trim($jt ?: '')) !== 'developer') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Developer access only']);
    exit;
}

$logDir = '/home/u861850327/.logs/';
$defaultLog = 'error_log_prospine_in';

// Get requested file, but sanitize it to prevent directory traversal
$requestedFile = isset($_GET['file']) ? basename($_GET['file']) : $defaultLog;
$logFile = $logDir . $requestedFile;

try {
    if (!file_exists($logFile)) {
        throw new Exception('Log file not found: ' . $requestedFile);
    }

    $numLines = isset($_GET['lines']) ? (int)$_GET['lines'] : 300;
    
    function read_tail($path, $n) {
        if (!is_readable($path)) return ["Error: File is not readable or permission denied."];
        
        $handle = fopen($path, 'r');
        if (!$handle) return [];

        $buffer = 8192;
        fseek($handle, 0, SEEK_END);
        $pos = ftell($handle);
        
        // If file is empty
        if ($pos == 0) {
            fclose($handle);
            return ["Log file is empty."];
        }

        $count = 0;
        $data = '';

        while ($pos > 0 && $count < $n + 1) {
            $read = min($pos, $buffer);
            $pos -= $read;
            fseek($handle, $pos);
            $chunk = fread($handle, $read);
            $data = $chunk . $data;
            $count = substr_count($data, "\n");
        }
        fclose($handle);
        
        $lines = explode("\n", trim($data));
        return array_slice($lines, -$n);
    }

    $all_lines = read_tail($logFile, $numLines);

    echo json_encode([
        'status' => 'success',
        'file' => $requestedFile,
        'path' => $logFile,
        'lines' => array_values(array_filter($all_lines, function($line) {
            return trim($line) !== '';
        })),
        'last_updated' => date('Y-m-d H:i:s', filemtime($logFile)),
        'file_size' => filesize($logFile),
        'server_time' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage()
    ]);
}
