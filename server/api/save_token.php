<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Remote DB Connection
$DB_DSN  = 'mysql:host=srv2050.hstgr.io;dbname=u861850327_prospine;charset=utf8mb4';
$DB_USER = 'u861850327_root';
$DB_PASS = 'Spine33#';

try {
    $pdo = new PDO($DB_DSN, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Remote DB Connection Failed: ' . $e->getMessage()]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // The App sends { user_id: X, token: Y } where X is the employee_id
    $empId = $input['user_id'] ?? 0;
    $token = $input['token'] ?? '';
    $platform = $input['platform'] ?? 'android';

    error_log("SaveToken Input: " . json_encode($input));

    if (!$empId || !$token) {
        $msg = 'Missing Employee ID or Token';
        error_log($msg);
        echo json_encode(['status' => 'error', 'message' => $msg]);
        exit;
    }

    try {
        // Migration: Drop old table if it has user_id
        // NOTE: Running this once will clear old tokens.
        // $pdo->exec("DROP TABLE IF EXISTS user_device_tokens"); // Uncomment if you want to force reset schema

        // Ensure Table has employee_id column
        // We will ALtER if not exists or create new
        $pdo->exec("CREATE TABLE IF NOT EXISTS user_device_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_id INT NOT NULL,
            token VARCHAR(512) NOT NULL,
            platform VARCHAR(50) DEFAULT 'android',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_emp_token (employee_id, token)
        )");
        
        // Check if user_id column exists (from old schema) and drop it or migrate?
        // For now, let's just use the table. If it fails, we might need a manual ALTER or DROP.
        // Assuming strict 'remove anything related to users table' -> we should probably focus on fresh start.
        
        // Simplest strategy for strict compliance:
        // Delete rows with this token first to avoid duplicates across IDs?
        $pdo->prepare("DELETE FROM user_device_tokens WHERE token = ?")->execute([$token]);

        $stmt = $pdo->prepare("
            INSERT INTO user_device_tokens (employee_id, token, platform) 
            VALUES (:eid, :token, :platform)
            ON DUPLICATE KEY UPDATE platform = VALUES(platform), last_updated = NOW()
        ");
        
        $stmt->execute([
            ':eid' => $empId,
            ':token' => $token,
            ':platform' => $platform
        ]);

        error_log("Token saved for Employee $empId");
        echo json_encode(['status' => 'success', 'message' => 'Token saved for Employee']);

    } catch (PDOException $e) {
        // If error due to column missing (old schema), we can try to ALTER or just fail and log
        error_log("SaveToken Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
?>
