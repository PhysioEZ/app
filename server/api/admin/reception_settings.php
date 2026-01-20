<?php
declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../../../common/db.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

$categoryMap = [
    'complaints' => [
        'table' => 'chief_complaints',
        'pk' => 'complaint_id',
        'name' => 'complaint_name',
        'code' => 'complaint_code'
    ],
    'sources' => [
        'table' => 'referral_sources',
        'pk' => 'source_id',
        'name' => 'source_name',
        'code' => 'source_code'
    ],
    'consultations' => [
        'table' => 'consultation_types',
        'pk' => 'consultation_id',
        'name' => 'consultation_name',
        'code' => 'consultation_code'
    ],
    'services' => [
        'table' => 'inquiry_service_types',
        'pk' => 'service_id',
        'name' => 'service_name',
        'code' => 'service_code'
    ]
];

try {
    if ($action === 'fetch_metadata') {
        $userId = $_GET['user_id'] ?? 0;
        
        // Get branch_id from employee
        $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
        $stmtB->execute([$userId]);
        $branchId = $stmtB->fetchColumn() ?: 1;

        $results = [];
        foreach ($categoryMap as $key => $config) {
            $table = $config['table'];
            $stmt = $pdo->prepare("SELECT * FROM $table WHERE branch_id = ? ORDER BY display_order ASC");
            $stmt->execute([$branchId]);
            $results[$key] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(['status' => 'success', 'data' => $results]);

    } elseif ($action === 'save') {
        $userId = $input['user_id'] ?? 0;
        $category = $input['category'] ?? '';
        $id = $input['id'] ?? null;
        $name = $input['name'] ?? '';
        $code = $input['code'] ?? '';
        $isActive = (int)($input['is_active'] ?? 1);
        $displayOrder = (int)($input['display_order'] ?? 0);

        if (!isset($categoryMap[$category])) throw new Exception("Invalid category");

        $config = $categoryMap[$category];
        $table = $config['table'];
        $pk = $config['pk'];
        $nameCol = $config['name'];
        $codeCol = $config['code'];

        // Get branch_id
        $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
        $stmtB->execute([$userId]);
        $branchId = $stmtB->fetchColumn() ?: 1;

        if ($id) {
            $stmt = $pdo->prepare("UPDATE $table SET $nameCol = ?, $codeCol = ?, is_active = ?, display_order = ? WHERE $pk = ?");
            $stmt->execute([$name, $code, $isActive, $displayOrder, $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO $table (branch_id, $nameCol, $codeCol, is_active, display_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$branchId, $name, $code, $isActive, $displayOrder]);
        }

        echo json_encode(['status' => 'success']);

    } elseif ($action === 'toggle_status') {
        $category = $input['category'] ?? '';
        $id = $input['id'] ?? 0;
        $status = (int)($input['status'] ?? 0);

        if (!isset($categoryMap[$category])) throw new Exception("Invalid category");
        
        $config = $categoryMap[$category];
        $table = $config['table'];
        $pk = $config['pk'];

        $stmt = $pdo->prepare("UPDATE $table SET is_active = ? WHERE $pk = ?");
        $stmt->execute([$status, $id]);

        echo json_encode(['status' => 'success']);

    } elseif ($action === 'delete') {
        $category = $input['category'] ?? '';
        $id = $input['id'] ?? 0;

        if (!isset($categoryMap[$category])) throw new Exception("Invalid category");
        
        $config = $categoryMap[$category];
        $table = $config['table'];
        $pk = $config['pk'];

        $stmt = $pdo->prepare("DELETE FROM $table WHERE $pk = ?");
        $stmt->execute([$id]);

        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
