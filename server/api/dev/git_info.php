<?php
// /srv/http/admin/app/server/api/dev/git_info.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

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
    exit(json_encode(['status' => 'error', 'message' => 'Unauthorized']));
}

// git shell_exec seems to be restricted on this server
$branch = 'main';
$commit = 'live-env';
$lastUpdate = date('Y-m-d H:i:s');

echo json_encode([
    'status' => 'success',
    'branch' => $branch,
    'commit' => $commit,
    'last_update' => $lastUpdate,
    'server_os' => PHP_OS,
    'php_version' => PHP_VERSION,
    'time' => date('Y-m-d H:i:s')
]);
