<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

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
if (strtolower(trim((string)$jt)) !== 'developer') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$logDir = '/home/u861850327/.logs/';
$files = [];

if (is_dir($logDir)) {
    $dir = opendir($logDir);
    while (($file = readdir($dir)) !== false) {
        if ($file != '.' && $file != '..') {
            $files[] = [
                'name' => $file,
                'size' => filesize($logDir . $file),
                'modified' => date('Y-m-d H:i:s', filemtime($logDir . $file))
            ];
        }
    }
    closedir($dir);
}

echo json_encode([
    'status' => 'success',
    'directory' => $logDir,
    'files' => $files
]);
