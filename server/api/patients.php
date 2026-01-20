<?php session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

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

// STRICT BRANCH ISOLATION
$employeeId = $_GET['employee_id'] ?? $_REQUEST['employee_id'] ?? $_SESSION['employee_id'] ?? null;
$branchId = 0;
if ($employeeId) {
    $stmtB = $pdo->prepare("SELECT branch_id FROM employees WHERE employee_id = ?");
    $stmtB->execute([$employeeId]);
    $val = $stmtB->fetchColumn();
    if ($val) $branchId = $val;
}
if (!$branchId && isset($_GET["branch_id"])) { $branchId = (int)$_GET["branch_id"]; }
if (!$branchId) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: Branch ID mismatch or missing.']);
    exit;
}
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$limit = 20;
$offset = ($page - 1) * $limit;

try {
    $params = [':branch_id' => $branchId];
    $whereClause = "WHERE p.branch_id = :branch_id";

    if (!empty($search)) {
        $whereClause .= " AND (r.patient_name LIKE :search_name OR r.phone_number LIKE :search_phone)";
        $params[':search_name'] = "%$search%";
        $params[':search_phone'] = "%$search%";
    }

    // Count total for pagination
    $countSql = "SELECT COUNT(*) FROM patients p JOIN registration r ON p.registration_id = r.registration_id $whereClause";
    $stmtCount = $pdo->prepare($countSql);
    $stmtCount->execute($params);
    $totalRecords = $stmtCount->fetchColumn();
    $totalPages = ceil($totalRecords / $limit);

    // Calculate Statistics (Overall)
    $statsSql = "SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(status) IN ('ongoing', 'active', 'p', 'partially_paid') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN LOWER(status) IN ('discharged', 'completed', 'f', 'fully_paid') THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN LOWER(status) NOT IN ('ongoing', 'active', 'p', 'partially_paid', 'discharged', 'completed', 'f', 'fully_paid') THEN 1 ELSE 0 END) as inactive,
        SUM(total_amount) as total_gross,
        SUM(due_amount) as total_due
    FROM patients WHERE branch_id = :branch_id";
    $stmtStats = $pdo->prepare($statsSql);
    $stmtStats->execute([':branch_id' => $branchId]);
    $stats = $stmtStats->fetch(PDO::FETCH_ASSOC);
    
    // Compute collection
    $stats['total_collection'] = (float)$stats['total_gross'] - (float)$stats['total_due'];

    // Fetch patients
    $sql = "SELECT 
                p.patient_id, 
                r.patient_name, 
                r.phone_number, 
                r.age, 
                r.gender, 
                p.treatment_type,
                p.status,
                p.total_amount,
                p.due_amount
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            $whereClause 
            ORDER BY p.patient_id DESC 
            LIMIT $limit OFFSET $offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
    }
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $patients,
        "stats" => $stats,
        "pagination" => [
            "current_page" => $page,
            "total_pages" => $totalPages,
            "total_records" => $totalRecords
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
