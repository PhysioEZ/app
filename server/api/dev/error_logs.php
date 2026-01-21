<?php
// /srv/http/admin/app/server/api/dev/error_logs.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET");

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

$errorLogPath = ini_get('error_log');

if (empty($errorLogPath) || !file_exists($errorLogPath)) {
    // Fallback: check project root
    $errorLogPath = dirname(__FILE__) . '/../../../../error_log';
}

if (!file_exists($errorLogPath)) {
     echo json_encode([
        'status' => 'success',
        'log_path' => $errorLogPath,
        'logs' => [],
        'message' => 'Error log file not found at this path.'
    ]);
    exit;
}

// Read last 100 lines
$lines = [];
$fp = fopen($errorLogPath, "r");
$chunkSize = 4096;
fseek($fp, 0, SEEK_END);
$pos = ftell($fp);
$count = 0;
$data = "";

while ($pos > 0 && $count < 100) {
    $readSize = min($pos, $chunkSize);
    $pos -= $readSize;
    fseek($fp, $pos);
    $buffer = fread($fp, $readSize);
    $data = $buffer . $data;
    $count = substr_count($data, "\n");
}

fclose($fp);

$lines = explode("\n", trim($data));
$lines = array_reverse(array_slice($lines, -100));

echo json_encode([
    'status' => 'success',
    'log_path' => $errorLogPath,
    'logs' => $lines
]);
