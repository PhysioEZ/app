<?php
// /srv/http/admin/app/server/api/dev/maintenance_check.php

// Prevent infinite recursion if we're in the remote control api or login
if (isset($_SERVER['SCRIPT_NAME']) && (
    strpos($_SERVER['SCRIPT_NAME'], 'remote_control.php') !== false || 
    strpos($_SERVER['SCRIPT_NAME'], 'login.php') !== false ||
    strpos($_SERVER['SCRIPT_NAME'], 'git_info.php') !== false ||
    strpos($_SERVER['SCRIPT_NAME'], '/dev/') !== false
)) {
    return;
}

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

require_once __DIR__ . '/status_template.php';

// Detect if JSON is requested
$isJsonRequest = (
    (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) ||
    (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') ||
    strpos($_SERVER['REQUEST_URI'], '/api/') !== false
);

try {
    if (isset($pdo)) {
        // --- 1. Identify User (Robust) ---
        // Attempt to start session if not started, to check web auth
        if (session_status() === PHP_SESSION_NONE) {
            // Suppress headers already sent warning if any
            @session_start();
        }

        $empId = $_SESSION['employee_id'] ?? $_REQUEST['employee_id'] ?? $_REQUEST['user_id'] ?? null;

        // If no ID found, try Authorization Header (Mobile Apps)
        if (!$empId) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                // Determine user likely from token (Not fully implemented here without auth lib, 
                // but checking if we can trust this token - simplified for MAINTENANCE CHECK only)
                // For now, relies on explicit ID or session.
            }
        }

        // --- 2. Auth Version Check (Force Logout) ---
        if ($empId) {
            $stmtAuth = $pdo->prepare("
                SELECT e.auth_version, 
                (SELECT setting_value FROM system_settings WHERE setting_key = 'min_auth_version') as min_version
                FROM employees e
                WHERE e.employee_id = ?
            ");
            $stmtAuth->execute([$empId]);
            $authData = $stmtAuth->fetch(PDO::FETCH_ASSOC);

            if ($authData) {
                if ((int)$authData['auth_version'] < (int)$authData['min_version']) {
                    // Force Logout
                    if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
                    
                    http_response_code(401);
                    if ($isJsonRequest) {
                        header('Content-Type: application/json');
                        exit(json_encode([
                            'status' => 'error',
                            'message' => 'Your session has been terminated by an administrator. Please log in again.',
                            'force_logout' => true
                        ]));
                    } else {
                        show_status_page("Authentication Error", "Your session has been terminated by an administrator. Please log in again.", "logout");
                    }
                }
            }
        }

        // --- 3. Maintenance Mode Check ---
        $stmtM = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode'");
        $mode = $stmtM->fetchColumn();

        if ($mode === '1') {
            $isAllowed = false;

            // A. Check if Developer (by ID)
            if ($empId) {
                $stmtD = $pdo->prepare("SELECT COUNT(*) FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.employee_id = ? AND r.role_name IN ('developer', 'superadmin')");
                $stmtD->execute([$empId]);
                if ($stmtD->fetchColumn() > 0) {
                    $isAllowed = true;
                }
            }

            // B. Check IP Whitelist (by Remote IP)
            if (!$isAllowed) {
                $stmtIP = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'allowed_dev_ips'");
                $allowedJson = $stmtIP->fetchColumn();
                $allowedIps = json_decode($allowedJson ?: '[]', true);
                if (in_array($_SERVER['REMOTE_ADDR'], $allowedIps)) {
                    $isAllowed = true;
                }
            }
            
            // C. CRITICAL EXEMPTION: Allow requests with 'employee_id' parameter effectively claiming to be developer to PASS
            // This is a fail-safe for the specific user "locked out" scenario where session logic fails.
            // We re-query role specifically for the passed param ID if not checked above
            if (!$isAllowed && isset($_REQUEST['employee_id'])) {
                 $eid = $_REQUEST['employee_id'];
                 $stmtD2 = $pdo->prepare("SELECT COUNT(*) FROM employees e JOIN roles r ON e.role_id = r.role_id WHERE e.employee_id = ? AND r.role_name = 'developer'");
                 $stmtD2->execute([$eid]);
                 if ($stmtD2->fetchColumn() > 0) {
                     $isAllowed = true;
                 }
            }

            // Block if not allowed
            if (!$isAllowed) {
                $stmtMsg = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_message'");
                $message = $stmtMsg->fetchColumn() ?: "System is under maintenance.";

                http_response_code(503);
                if ($isJsonRequest) {
                    header('Content-Type: application/json');
                    exit(json_encode([
                        'status' => 'maintenance',
                        'message' => $message
                    ]));
                } else {
                    show_status_page("System Maintenance", $message, "maintenance");
                }
            }
        }
    }
} catch (Exception $e) {
    // Silently fail or log if needed
}
