<?php

declare(strict_types=1);
session_start();

// ----------------------------------------------------------------------
// API: List Patient Billing Overview
// ----------------------------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection
$db_paths = [
    __DIR__ . '/../../common/db.php',
    __DIR__ . '/../../../common/db.php',
    $_SERVER['DOCUMENT_ROOT'] . '/prospine/server/common/db.php',
    $_SERVER['DOCUMENT_ROOT'] . '/common/db.php'
];

$db_loaded = false;
foreach ($db_paths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $db_loaded = true;
        break;
    }
}

if (!$db_loaded) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database configuration not found']);
    exit();
}

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
$statusFilter = isset($_GET['status']) ? trim($_GET['status']) : '';

    // Pagination
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 20;
    $offset = ($page - 1) * $limit;

    // Filters
    $whereClauses = ["p.branch_id = :branch_id"];
    $params = [':branch_id' => $branchId];

    if (!empty($search)) {
        $whereClauses[] = "(r.patient_name LIKE :search1 OR r.phone_number LIKE :search2 OR pm.patient_uid LIKE :search3 OR p.patient_id LIKE :search4)";
        $params[':search1'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
        $params[':search4'] = "%$search%";
    }

    if (!empty($statusFilter) && $statusFilter !== 'all') {
        $whereClauses[] = "p.status = :status";
        $params[':status'] = $statusFilter;
    }

    $whereSql = implode(' AND ', $whereClauses);

    // Count
    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        WHERE $whereSql
    ");
    $countStmt->execute($params);
    $totalRecords = (int)$countStmt->fetchColumn();
    $totalPages = ceil($totalRecords / $limit);

    // Data
    $sql = "
        SELECT
            p.patient_id,
            r.patient_name,
            r.patient_photo_path,
            pm.patient_uid,
            p.total_amount AS total_billed,
            p.status,
            (
                SELECT COALESCE(SUM(amount), 0)
                FROM payments
                WHERE patient_id = p.patient_id
            ) AS total_paid
        FROM patients p
        JOIN registration r ON p.registration_id = r.registration_id
        LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
        WHERE $whereSql
        ORDER BY p.created_at DESC
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

    // Calc Due
    foreach ($records as &$row) {
        $billed = (float)$row['total_billed'];
        $paid = (float)$row['total_paid'];
        $row['total_due'] = $billed - $paid;
        
        // Photo URL Helper (Relative -> Absoluteish for frontend mostly)
        // Frontend will handle prefix
    }
    unset($row);

    echo json_encode([
        'status' => 'success',
        'data' => $records,
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
