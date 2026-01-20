<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

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
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found']);
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
    
    $userId = $input['user_id'] ?? 0;
    $token = $input['token'] ?? '';
    $platform = $input['platform'] ?? 'android';

    if (!$userId || !$token) {
        echo json_encode(['status' => 'error', 'message' => 'Missing ID or Token']);
        exit;
    }

    try {
        // Create table if not exists (Lazy init)
        $pdo->exec("CREATE TABLE IF NOT EXISTS user_device_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(512) NOT NULL,
            platform VARCHAR(50) DEFAULT 'android',
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_token (user_id, token)
        )");

        // Insert or Ignore
        $stmt = $pdo->prepare("
            INSERT INTO user_device_tokens (user_id, token, platform) 
            VALUES (:uid, :token, :platform)
            ON DUPLICATE KEY UPDATE token = VALUES(token), platform = VALUES(platform), last_updated = NOW()
        ");
        
        $stmt->execute([
            ':uid' => $userId,
            ':token' => $token,
            ':platform' => $platform
        ]);

        echo json_encode(['status' => 'success', 'message' => 'Token saved DEBUG_V1']);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}
?>
