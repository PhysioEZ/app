<?php session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$dbPath = __DIR__ . '/../../common/db.php';
if (file_exists($dbPath)) {
    require_once $dbPath;
} else {
    $dbPathUp = __DIR__ . '/../../../common/db.php';
    if (file_exists($dbPathUp)) {
        require_once $dbPathUp;
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database configuration not found."]);
        exit;
    }
}

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
    echo json_encode(["status" => "error", "message" => "Unauthorized: Branch ID mismatch or missing."]);
    exit;
}
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 15;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$detailId = isset($_GET['id']) ? (int)$_GET['id'] : null;

$response = [
    "status" => "error",
    "data" => [],
    "pagination" => [
        "page" => $page,
        "limit" => $limit,
        "total" => 0,
        "pages" => 0
    ]
];

try {
    // Single Detail Fetch
    if ($detailId) {
        $stmt = $pdo->prepare("
            SELECT 
                reg.*,
                pm.patient_uid,
                CASE WHEN p.patient_id IS NOT NULL THEN 1 ELSE 0 END as is_patient_created
            FROM registration reg
            LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
            LEFT JOIN patients p ON reg.registration_id = p.registration_id
            WHERE reg.registration_id = :id AND reg.branch_id = :branch_id
        ");
        $stmt->execute([':id' => $detailId, ':branch_id' => $branchId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $response['status'] = 'success';
            $response['data'] = $row;
            // No pagination needed for detail
        } else {
            $response['message'] = "Registration not found.";
        }
    } 
    // List Fetch
    else {
        $offset = ($page - 1) * $limit;
        $orderBy = 'reg.registration_id DESC';
        
        $whereClauses = ["reg.branch_id = :branch_id", "reg.status != 'closed'"];
        $params = [':branch_id' => $branchId];

        if ($search) {
            $whereClauses[] = "(reg.patient_name LIKE :search1 OR reg.phone_number LIKE :search2 OR pm.patient_uid LIKE :search3)";
            $params[':search1'] = "%$search%";
            $params[':search2'] = "%$search%";
            $params[':search3'] = "%$search%";
        }

        $whereSql = implode(' AND ', $whereClauses);

        // Count
        $countStmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM registration reg
            LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
            WHERE $whereSql
        ");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Calculate Stats (Global for branch)
        $statsStmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN LOWER(status) = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN LOWER(status) = 'consulted' THEN 1 ELSE 0 END) as consulted,
                SUM(CASE WHEN LOWER(status) IN ('cancelled') THEN 1 ELSE 0 END) as cancelled
            FROM registration 
            WHERE branch_id = :branch_id
        ");
        $statsStmt->execute([':branch_id' => $branchId]);
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        // Fetch
        $stmt = $pdo->prepare("
            SELECT 
                reg.registration_id,
                reg.patient_name,
                reg.phone_number,
                reg.age,
                reg.gender,
                reg.consultation_type,
                reg.reffered_by,
                reg.chief_complain,
                reg.consultation_amount,
                reg.created_at,
                reg.status,
                reg.patient_photo_path,
                pm.patient_uid,
                CASE WHEN p.patient_id IS NOT NULL THEN 1 ELSE 0 END as is_patient_created
            FROM registration reg
            LEFT JOIN patient_master pm ON reg.master_patient_id = pm.master_patient_id
            LEFT JOIN patients p ON reg.registration_id = p.registration_id
            WHERE $whereSql
            ORDER BY $orderBy
            LIMIT :limit OFFSET :offset
        ");

        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response['status'] = 'success';
        $response['data'] = $data;
        $response['stats'] = $stats;
        $response['pagination']['total'] = $total;
        $response['pagination']['pages'] = ceil($total / $limit);
    }
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
exit;
