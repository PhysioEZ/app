<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once __DIR__ . '/../../../common/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'OPTIONS') {
    exit;
}

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

try {
    if ($action === 'get_status') {
        $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('maintenance_mode', 'maintenance_message')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // Check DB Health
        $dbHealth = "Healthy";
        try {
            $pdo->query("SELECT 1");
        } catch (Exception $e) {
            $dbHealth = "Unhealthy: " . $e->getMessage();
        }

        echo json_encode([
            'status' => 'success',
            'maintenance_mode' => $settings['maintenance_mode'] === '1',
            'maintenance_message' => $settings['maintenance_message'] ?? '',
            'db_status' => $dbHealth,
            'server_time' => date('Y-m-d H:i:s')
        ]);
    } elseif ($action === 'toggle_maintenance') {
        $input = json_decode(file_get_contents('php://input'), true);
        $enabled = $input['enabled'] ? '1' : '0';
        $message = $input['message'] ?? 'The system is currently undergoing scheduled maintenance. Please try again later.';

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'maintenance_mode'");
        $stmt->execute([$enabled]);

        $stmtMsg = $pdo->prepare("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'maintenance_message'");
        $stmtMsg->execute([$message]);

        $pdo->commit();

        // Send Broadcast Push Notification
        require_once __DIR__ . '/../../../common/push_utils.php';
        $pushTitle = $enabled === '1' ? '⚠️ System Maintenance' : '✅ System Back Online';
        $pushBody = $enabled === '1' ? $message : 'The system maintenance is complete. You can now log back in.';
        sendBroadcastPush($pdo, $pushTitle, $pushBody);

        echo json_encode(['status' => 'success', 'message' => 'Maintenance mode updated and broadcast sent']);
    } elseif ($action === 'force_logout_all') {
        $pdo->beginTransaction();
        
        // Increment min_auth_version
        $stmtCurr = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'min_auth_version'");
        $curr = (int)$stmtCurr->fetchColumn();
        $next = $curr + 1;
        
        $stmtUpd = $pdo->prepare("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'min_auth_version'");
        $stmtUpd->execute([$next]);
        
        // We also want to make sure the developer doing the action isn't logged out
        $stmtSelf = $pdo->prepare("UPDATE employees SET auth_version = ? WHERE employee_id = ?");
        $stmtSelf->execute([$next, $currentEmployeeId]);
        
        $pdo->commit();
        
        // Send Broadcast Push Notification
        require_once __DIR__ . '/../../../common/push_utils.php';
        sendBroadcastPush($pdo, '🛑 Critical Update', 'All active sessions have been reset for a security update. Please log in again.');

        echo json_encode(['status' => 'success', 'message' => "Broadcast logout signal sent. All users must re-authenticate. (Version now: $next)"]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
