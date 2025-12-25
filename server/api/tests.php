<?php

declare(strict_types=1);
session_start();

// ----------------------------------------------------------------------
// API: List Tests
// ----------------------------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../common/db.php'; // Adjust path if needed

try {
    // STRICT BRANCH ISOLATION
$employeeId = $_GET['employee_id'] ?? $_REQUEST['employee_id'] ?? $_SESSION['employee_id'] ?? null;
$branchId = 0;
if ($employeeId) {
    try {
        $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
        $stmtB->execute([$employeeId]);
        $val = $stmtB->fetchColumn();
        if ($val) $branchId = $val;
    } catch(Exception $e){}
}
if (!$branchId && isset($_SESSION['branch_id'])) $branchId = $_SESSION['branch_id'];

if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID required from valid Employee.']);
    exit;
}
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $statusFilter = isset($_GET['test_status']) ? trim($_GET['test_status']) : '';
    $paymentFilter = isset($_GET['payment_status']) ? trim($_GET['payment_status']) : '';
    
    // Pagination
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;
    $offset = ($page - 1) * $limit;

    // Build Query
    $whereClauses = ["branch_id = :branch_id", "test_status != 'cancelled'"];
    $params = [':branch_id' => $branchId];

    if (!empty($search)) {
        $whereClauses[] = "(patient_name LIKE :search1 OR test_uid LIKE :search2 OR test_name LIKE :search3)";
        $params[':search1'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
    }

    if (!empty($statusFilter) && $statusFilter !== 'all') {
        $whereClauses[] = "test_status = :test_status";
        $params[':test_status'] = $statusFilter;
    }

    if (!empty($paymentFilter) && $paymentFilter !== 'all') {
        $whereClauses[] = "payment_status = :payment_status";
        $params[':payment_status'] = $paymentFilter;
    }

    $whereSql = implode(' AND ', $whereClauses);

    // Count
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM tests WHERE $whereSql");
    $countStmt->execute($params);
    $totalRecords = (int)$countStmt->fetchColumn();
    $totalPages = ceil($totalRecords / $limit);

    // Stats
    $statsStmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(test_status) = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN LOWER(test_status) = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN LOWER(test_status) = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM tests
        WHERE branch_id = :branch_id
    ");
    $statsStmt->execute([':branch_id' => $branchId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // Data
    $sql = "
        SELECT 
            test_id, test_uid, patient_name, test_name, 
            total_amount, advance_amount, due_amount, 
            payment_status, test_status, created_at
        FROM tests
        WHERE $whereSql
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Casting
    foreach ($records as &$row) {
        $row['test_id'] = (int)$row['test_id'];
        $row['total_amount'] = (float)$row['total_amount'];
        $row['advance_amount'] = (float)$row['advance_amount'];
        $row['due_amount'] = (float)$row['due_amount'];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $records,
        'stats' => $stats,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total_records' => $totalRecords
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
