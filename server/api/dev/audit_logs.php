<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

date_default_timezone_set('Asia/Kolkata');

$dbPath = dirname(__FILE__) . '/../../../common/db.php';

if (!file_exists($dbPath)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'System Core not found']);
    exit;
}

require_once $dbPath;

try {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Search filter
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $where = "";
    $params = [];
    
    if ($search) {
        $where = "WHERE username LIKE ? OR action_type LIKE ? OR target_table LIKE ? OR details_after LIKE ?";
        $params = ["%$search%", "%$search%", "%$search%", "%$search%"];
    }

    $stmt = $pdo->prepare("SELECT * FROM audit_log $where ORDER BY log_timestamp DESC LIMIT $limit OFFSET $offset");
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total count for pagination
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM audit_log $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    echo json_encode([
        'status' => 'success',
        'logs' => $logs,
        'pagination' => [
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
