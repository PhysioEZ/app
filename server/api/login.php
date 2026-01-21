<?php
// /server/api/login.php

// 1. CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Access
$dbPaths = [
    __DIR__ . '/../../../common/db.php',
    __DIR__ . '/../../common/db.php',
    '/srv/http/admin/common/db.php'
];

$dbFound = false;
foreach ($dbPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $dbFound = true;
        break;
    }
}

if (!$dbFound) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found']);
    exit;
}

// Load auth logger
require_once __DIR__ . '/../../../common/auth_logger.php';

// 3. Get Input
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete credentials."]);
    exit;
}

$username = trim($data->username);
$password = $data->password;

try {
    // 4. Query User (Same logic as standard login)
    // We check email or first_name
    $query = "
        SELECT 
            e.employee_id, 
            e.user_id, 
            e.password_hash, 
            e.is_active,
            e.branch_id, 
            e.first_name, 
            e.last_name, 
            e.email,
            r.role_name,
            e.photo_path
        FROM employees e
        JOIN roles r ON e.role_id = r.role_id
        WHERE (e.email = ? OR e.first_name = ?) 
        AND e.is_active = 1 
        LIMIT 1
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 5. Verify Password
    if ($user && password_verify($password, $user['password_hash'])) {
        // --- Maintenance Mode Check ---
        $stmtMaint = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_mode'");
        $maintenanceMode = $stmtMaint->fetchColumn() === '1';

        if ($maintenanceMode && strtolower($user['role_name'] ?? '') !== 'developer') {
             $stmtMsg = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'maintenance_message'");
             $msg = $stmtMsg->fetchColumn() ?: 'System is currently under maintenance. Please try again later.';
             
             http_response_code(503);
             echo json_encode(["status" => "error", "message" => $msg]);
             exit;
        }

        // Sync Auth Version
        $stmtVer = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'min_auth_version'");
        $minVer = (int)$stmtVer->fetchColumn() ?: 1;
        
        $stmtSync = $pdo->prepare("UPDATE employees SET auth_version = ? WHERE employee_id = ?");
        $stmtSync->execute([$minVer, $user['employee_id']]);
        $user['auth_version'] = $minVer;
        
        // Log successful login
        log_auth_event($pdo, 'mobile_login_success', $user['employee_id'], $username, true, [
            'role' => $user['role_name'],
            'branch_id' => $user['branch_id']
        ]);
        
        // Success!
        // Remove sensitive data
        unset($user['password_hash']);
        unset($user['user_id']); // internal ID maybe not needed

        // Add full name
        $user['full_name'] = $user['first_name'] . ' ' . $user['last_name'];
        
        // Generate a simple token (In production, use JWT)
        // For now, we'll return a random token string that the client can store
        // If you want to validate this token later, you should store it in a DB table 'api_sessions'
        // But for this MVP, we will rely on the app storing the user data.
        $token = bin2hex(random_bytes(32));

        // Return Data
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "data" => [
                "user" => $user,
                "token" => $token
            ]
        ]);

    } else {
        // Log failed login
        log_auth_event($pdo, 'mobile_login_failed', null, $username, false, [
            'reason' => 'invalid_credentials'
        ]);
        
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
