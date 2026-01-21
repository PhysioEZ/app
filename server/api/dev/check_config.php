<?php
header('Content-Type: application/json');
echo json_encode([
    'error_log' => ini_get('error_log'),
    'display_errors' => ini_get('display_errors'),
    'log_errors' => ini_get('log_errors'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'dir' => __DIR__
]);
